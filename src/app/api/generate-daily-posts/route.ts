import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { MASTER_SYSTEM_PROMPT, generateContentPrompt } from '@/lib/ai-prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// Generate embedding for a text
async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Search for similar knowledge using vector similarity
async function searchSimilarKnowledge(queryEmbedding: number[], limit: number = 3) {
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
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Generate topic ideas based on knowledge base
async function generateTopicIdeas(): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  
  // Get some sample knowledge to inspire topics
  const sampleKnowledge = await prisma.knowledge.findMany({
    take: 5,
    select: { content: true, source: true }
  });
  
  const knowledgeContext = sampleKnowledge.map(k => 
    `[${k.source}]: ${k.content.substring(0, 200)}...`
  ).join('\n\n');
  
  const topicPrompt = `
당신은 Colemearchy 블로그의 콘텐츠 기획자입니다. 다음 독서 노트들을 참고하여 흥미로운 블로그 주제 10개를 제안해주세요.

**독서 노트 샘플:**
${knowledgeContext}

**Colemearchy 블로그 스타일:**
- 바이오해킹 & 자기계발 (건강, 최적화, 생산성)
- 스타트업 & 비즈니스 인사이트
- 투자 & 경제적 자유에 대한 관점
- 개인적 경험과 솔직한 스토리텔링

**요구사항:**
1. 각 주제는 15-25단어 정도의 구체적인 제목으로 작성
2. SEO에 적합한 키워드 포함
3. 독자의 호기심을 자극하는 제목
4. 실용적이고 액션 가능한 내용

JSON 형식으로 응답해주세요:
{
  "topics": [
    "첫 번째 주제 제목",
    "두 번째 주제 제목",
    ...
  ]
}
`;

  const result = await model.generateContent({
    contents: [{ 
      role: 'user',
      parts: [{ text: topicPrompt }] 
    }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
    }
  });

  try {
    const response = JSON.parse(result.response.text());
    return response.topics || [];
  } catch (error) {
    console.error('Failed to parse topic ideas:', error);
    return [
      '30대 직장인이 실제로 해본 바이오해킹 실험 5가지 결과',
      '스타트업 초기 팀이 놓치기 쉬운 성장 함정들',
      '월급쟁이에서 투자 수익 월 300만원까지의 실제 과정',
      '불안한 완벽주의자가 생산성을 높이는 법',
      'AI 시대에도 사라지지 않을 직업 스킬 5가지'
    ];
  }
}

// Generate content using RAG
async function generateContentWithRAG(topic: string): Promise<any> {
  try {
    // Generate embedding for the topic
    const topicEmbedding = await generateEmbedding(topic);
    
    // Search for similar knowledge
    const similarKnowledge = await searchSimilarKnowledge(topicEmbedding);
    
    // Create RAG context
    const ragContext = similarKnowledge.length > 0 
      ? `\n\n**과거 기록 컨텍스트 (Past Knowledge Context):**\n${
          similarKnowledge.map((k, i) => 
            `\n[Context ${i + 1}${k.source ? ` - from "${k.source}"` : ''}]:\n${k.content.substring(0, 500)}...`
          ).join('\n')
        }\n\n**위 컨텍스트를 참고하여 나의 과거 생각과 스타일을 반영해 글을 작성해주세요.**\n\n`
      : '';

    // Generate content
    const fullPrompt = `${MASTER_SYSTEM_PROMPT}\n\n------\n\n${ragContext}**EXECUTE TASK:**\n\n${generateContentPrompt(topic, [], [])}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
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
    
    // Parse the generated content
    try {
      return JSON.parse(responseText);
    } catch {
      // If not JSON, wrap in content object
      return { 
        title: topic,
        content: responseText,
        excerpt: responseText.substring(0, 160),
        tags: []
      };
    }
  } catch (error) {
    console.error('Error generating content for topic:', topic, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify that this is a legitimate cron job request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 Starting daily content generation...');
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Step 1: Generate topic ideas
    console.log('💡 Generating topic ideas...');
    const topics = await generateTopicIdeas();
    console.log(`Generated ${topics.length} topics:`, topics);

    const generatedPosts = [];
    const failedTopics = [];

    // Step 2: Generate content for each topic
    for (let i = 0; i < Math.min(topics.length, 10); i++) {
      const topic = topics[i];
      console.log(`📝 Generating content for: "${topic}" (${i + 1}/${Math.min(topics.length, 10)})`);
      
      try {
        const content = await generateContentWithRAG(topic);
        
        if (content) {
          // Save to database as draft
          const slug = generateSlug(content.title || topic);
          const uniqueSlug = `${slug}-${Date.now()}`;
          
          const post = await prisma.post.create({
            data: {
              title: content.title || topic,
              slug: uniqueSlug,
              content: content.content || '',
              excerpt: content.excerpt || content.content?.substring(0, 160) || '',
              tags: Array.isArray(content.tags) ? content.tags : [],
              seoTitle: content.seoTitle || content.title,
              seoDescription: content.seoDescription || content.excerpt,
              status: 'DRAFT',
              author: 'Colemearchy AI',
              createdAt: new Date()
            }
          });

          generatedPosts.push({
            id: post.id,
            title: post.title,
            slug: post.slug
          });

          console.log(`✅ Generated post: "${post.title}"`);
        } else {
          failedTopics.push(topic);
        }

        // Add delay between generations to avoid rate limiting
        if (i < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Failed to generate content for topic: "${topic}"`, error);
        failedTopics.push(topic);
      }
    }

    console.log(`🎉 Daily content generation complete! Generated ${generatedPosts.length} posts`);

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedPosts.length} draft posts`,
      generatedPosts,
      failedTopics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in daily content generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate daily content',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Support GET for manual testing
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    message: 'Daily content generation endpoint is ready',
    timestamp: new Date().toISOString()
  });
}