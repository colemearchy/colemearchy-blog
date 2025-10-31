import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { MASTER_SYSTEM_PROMPT, generateContentPrompt } from '@/lib/ai-prompts';
import { env } from '@/lib/env';
import { withErrorHandler, logger, ApiError, createSuccessResponse, validateRequest } from '@/lib/error-handler';
import { generateContentSchema } from '@/lib/validations';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';
import { detectLanguage } from '@/lib/translation';
import { autoGenerateThumbnailUrl } from '@/lib/utils/thumbnail';
import { tagsToArray } from '@/lib/utils/tags'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Generate embedding for a text
async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Search for similar knowledge using vector similarity
async function searchSimilarKnowledge(queryEmbedding: number[], limit: number = 3) {
  // Use pgvector to find similar embeddings
  const results = await prisma.$queryRaw`
    SELECT id, content, source,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "Knowledge"
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results as Array<{
    id: string;
    content: string;
    source: string | null;
    similarity: number;
  }>;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Validate input data
  const validatedData = await validateRequest(request, generateContentSchema);
  const { prompt, keywords, affiliateProducts, publishDate } = validatedData;

  logger.info('Generating content', {
    promptLength: prompt.length,
    keywordsCount: keywords?.length || 0
  });

  // Step 1 & 2: RAG temporarily disabled for SQLite/Turso compatibility
  // TODO: Implement SQLite-compatible vector search or use external vector DB
  logger.info('RAG disabled (pgvector not compatible with SQLite/Turso)');
  const similarKnowledge: Array<{id: string; content: string; source: string | null; similarity: number}> = [];

  // Step 3a: Get existing posts for deduplication check
  logger.info('Fetching existing posts for deduplication');
    const existingPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        title: true,
        slug: true,
        tags: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 100 // Get recent 100 posts
    });

    const existingPostsContext = existingPosts.length > 0
      ? `\n\n**EXISTING POSTS IN DATABASE (for deduplication check):**\n${
          existingPosts.map(p => `- Title: "${p.title}" | Slug: "${p.slug}" | Tags: [${tagsToArray(p.tags).join(', ')}]`).join('\n')
        }\n\n**IMPORTANT: Do NOT create content that duplicates any of the above topics. If the requested topic is similar to an existing post, create content that extends or provides a new angle on the topic.**\n\n`
      : '';

    // Step 3b: Create RAG context
    const ragContext = similarKnowledge.length > 0 
      ? `\n\n**과거 기록 컨텍스트 (Past Knowledge Context):**\n${
          similarKnowledge.map((k, i) => 
            `\n[Context ${i + 1}${k.source ? ` - from "${k.source}"` : ''}]:\n${k.content.substring(0, 500)}...`
          ).join('\n')
        }\n\n**위 컨텍스트를 참고하여 나의 과거 생각과 스타일을 반영해 글을 작성해주세요.**\n\n`
      : '';

    // Step 4: Generate content with RAG context and existing posts
    const fullPrompt = `${MASTER_SYSTEM_PROMPT}\n\n------\n\n${existingPostsContext}${ragContext}**EXECUTE TASK:**\n\n${generateContentPrompt(prompt, keywords, affiliateProducts)}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    const responseText = result.response.text();

    // Step 5: Parse the generated content
    let parsedContent;
    try {
      // Remove markdown code block wrapper if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsedContent = JSON.parse(jsonText);

      // IMPORTANT: If parsed content already has a 'content' field,
      // ensure we're using ONLY that content, not the entire JSON
      if (parsedContent.content && typeof parsedContent.content === 'string') {
        // Content is already extracted correctly
      } else if (typeof parsedContent === 'object' && !parsedContent.content) {
        // JSON doesn't have a content field, treat entire text as content
        parsedContent = {
          title: parsedContent.title || prompt.substring(0, 60),
          content: responseText,
          excerpt: parsedContent.excerpt || responseText.substring(0, 160),
          tags: parsedContent.tags || keywords || []
        };
      }
    } catch {
      // If not JSON, wrap in content object
      parsedContent = {
        title: prompt.substring(0, 60),
        content: responseText,
        excerpt: responseText.substring(0, 160),
        tags: keywords || []
      };
    }

    // Step 6: Save to database as draft
    const baseSlug = generateSlug(parsedContent.title || prompt);
    const scheduledAt = publishDate ? new Date(publishDate) : null;

    // Generate unique slug by checking for duplicates
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.post.findUnique({ where: { slug: s } });
      return !!existing;
    });

    // Auto-detect language from generated content
    const detectedLanguage = detectLanguage(
      (parsedContent.title || prompt) + ' ' + (parsedContent.content || responseText).substring(0, 500)
    );
    logger.info('Language detected for AI-generated content', {
      language: detectedLanguage,
      title: parsedContent.title || prompt
    });

    // Auto-generate thumbnail URL if no coverImage provided
    const postTitle = parsedContent.title || prompt;
    const coverImageUrl = parsedContent.coverImage || autoGenerateThumbnailUrl(postTitle, request);

    logger.info('Thumbnail generation for new post', {
      title: postTitle,
      hasAICoverImage: !!parsedContent.coverImage,
      generatedThumbnailUrl: !parsedContent.coverImage ? coverImageUrl : null
    });

    const post = await prisma.post.create({
      data: {
        title: postTitle,
        slug,
        content: parsedContent.content || responseText,
        excerpt: parsedContent.excerpt || responseText.substring(0, 160),
        tags: parsedContent.tags || [],
        seoTitle: parsedContent.seoTitle || parsedContent.title,
        seoDescription: parsedContent.seoDescription || parsedContent.excerpt,
        coverImage: coverImageUrl,
        status: 'DRAFT',
        scheduledAt,
        author: 'Colemearchy AI',
        originalLanguage: detectedLanguage
      }
    });

  logger.info('Content generated and saved', {
    postId: post.id,
    slug: post.slug,
    status: post.status
  });

  return createSuccessResponse({
    ...parsedContent,
    id: post.id,
    slug: post.slug,
    status: post.status,
    scheduledAt: post.scheduledAt,
    ragContextUsed: similarKnowledge.length > 0
  }, new URL(request.url).pathname);
});