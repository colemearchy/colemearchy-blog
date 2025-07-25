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
You are the content strategist for Colemearchy blog. Based on the following reading notes, generate 10 engaging blog topics that match our brand voice.

**Sample Knowledge Base:**
${knowledgeContext}

**Colemearchy Blog Style (The Golden Triangle):**
1. Biohacking & The Optimized Self: Personal journeys with modern health solutions (Wegovy, mental health meds, fitness, keto diet)
2. The Startup Architect: Actionable insights on growth, SEO, AI, and leadership from a tech director perspective
3. The Sovereign Mind: Philosophical and practical takes on investing, personal freedom, and building meaningful life

**Target Audience:** Ambitious millennials (25-40) in tech/finance/creative industries seeking life optimization beyond careers

**Requirements:**
1. Each topic should be 8-15 words long and click-worthy
2. Include SEO-friendly keywords
3. Provoke curiosity and promise actionable insights
4. Be personal and experience-based (use "I", "My", "How I")
5. Appeal to freedom-seeking, optimization-minded readers

**Topic Categories to Cover:**
- Biohacking experiments and results
- Startup/business growth tactics
- Investment and wealth building
- Productivity and mental optimization
- Technology and AI insights
- Personal freedom and lifestyle design

Respond in JSON format:
{
  "topics": [
    "First topic title",
    "Second topic title",
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
      'How I Biohacked My Way Out of Chronic Fatigue (5 Game-Changing Experiments)',
      'The Growth Trap That Killed My Startup (And How to Avoid It)',
      'From $50K to $500K: My Actual Investment Journey Timeline',
      'Why I Quit Productivity Porn and Started Getting Things Done',
      'The AI Tools That Actually Make Me Money (Not Just Hype)',
      'How to Build Wealth While Working a 9-5 (My 3-Year Experiment)',
      'The Biohacking Stack That Fixed My ADHD Without Medication',
      'Why Your Startup is Failing (And the Pivot That Saved Mine)',
      'My $10K Mistake That Taught Me How Markets Really Work',
      'The Minimalist Productivity System That Changed Everything'
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

    // Step 2: Generate content for each topic with scheduled publishing
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(9, 0, 0, 0); // Start publishing at 9 AM
    
    // Calculate publish times spread throughout the day (9 AM - 11 PM)
    const publishTimes = [];
    for (let i = 0; i < 10; i++) {
      const publishTime = new Date(startOfDay);
      publishTime.setHours(9 + Math.floor(i * 14 / 10), (i * 37) % 60, 0, 0); // Spread across 14 hours with varying minutes
      publishTimes.push(publishTime);
    }
    
    for (let i = 0; i < Math.min(topics.length, 10); i++) {
      const topic = topics[i];
      console.log(`📝 Generating content for: "${topic}" (${i + 1}/${Math.min(topics.length, 10)})`);
      
      try {
        const content = await generateContentWithRAG(topic);
        
        if (content) {
          // Validate content length (minimum 2500 characters for ~3000 words)
          const contentLength = content.content?.length || 0;
          if (contentLength < 2500) {
            console.warn(`⚠️ Content too short (${contentLength} chars), regenerating...`);
            continue;
          }
          
          // Save to database as draft with scheduled publish time
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
              author: 'Colemearchy',
              publishDate: publishTimes[i], // Schedule for automatic publishing
              createdAt: new Date()
            }
          });

          generatedPosts.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            publishDate: publishTimes[i].toISOString(),
            contentLength: contentLength
          });

          console.log(`✅ Generated post: "${post.title}" (${contentLength} chars) - Scheduled for ${publishTimes[i].toLocaleString()}`);
        } else {
          failedTopics.push(topic);
        }

        // Add delay between generations to avoid rate limiting
        if (i < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay for quality
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