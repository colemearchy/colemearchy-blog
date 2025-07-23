import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { MASTER_SYSTEM_PROMPT, generateContentPrompt } from '@/lib/ai-prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, keywords, affiliateProducts, publishDate } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Step 1: Generate embedding for the user's prompt
    console.log('Generating embedding for prompt...');
    const promptEmbedding = await generateEmbedding(prompt);
    
    // Step 2: Search for similar knowledge
    console.log('Searching for similar knowledge...');
    const similarKnowledge = await searchSimilarKnowledge(promptEmbedding);
    
    // Step 3: Create RAG context
    const ragContext = similarKnowledge.length > 0 
      ? `\n\n**과거 기록 컨텍스트 (Past Knowledge Context):**\n${
          similarKnowledge.map((k, i) => 
            `\n[Context ${i + 1}${k.source ? ` - from "${k.source}"` : ''}]:\n${k.content.substring(0, 500)}...`
          ).join('\n')
        }\n\n**위 컨텍스트를 참고하여 나의 과거 생각과 스타일을 반영해 글을 작성해주세요.**\n\n`
      : '';

    // Step 4: Generate content with RAG context
    const fullPrompt = `${MASTER_SYSTEM_PROMPT}\n\n------\n\n${ragContext}**EXECUTE TASK:**\n\n${generateContentPrompt(prompt, keywords, affiliateProducts)}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent({
      contents: [{
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
      parsedContent = JSON.parse(responseText);
    } catch {
      // If not JSON, wrap in content object
      parsedContent = { 
        title: prompt.substring(0, 60),
        content: responseText,
        excerpt: responseText.substring(0, 160),
        tags: keywords ? keywords.split(',').map((k: string) => k.trim()) : []
      };
    }

    // Step 6: Save to database as draft
    const slug = generateSlug(parsedContent.title || prompt);
    const scheduledAt = publishDate ? new Date(publishDate) : null;
    
    const post = await prisma.post.create({
      data: {
        title: parsedContent.title || prompt,
        slug: `${slug}-${Date.now()}`, // Ensure unique slug
        content: parsedContent.content || responseText,
        excerpt: parsedContent.excerpt || responseText.substring(0, 160),
        tags: parsedContent.tags || [],
        seoTitle: parsedContent.seoTitle || parsedContent.title,
        seoDescription: parsedContent.seoDescription || parsedContent.excerpt,
        coverImage: parsedContent.coverImage,
        status: 'DRAFT',
        scheduledAt,
        author: 'Colemearchy AI'
      }
    });

    return NextResponse.json({
      ...parsedContent,
      id: post.id,
      slug: post.slug,
      status: post.status,
      scheduledAt: post.scheduledAt,
      ragContextUsed: similarKnowledge.length > 0
    });

  } catch (error) {
    console.error('Error in generate-content handler:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}