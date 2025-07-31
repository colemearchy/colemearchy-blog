#!/usr/bin/env node

/**
 * Generate 10 High-Quality Blog Posts Script
 * 
 * This script uses the existing Colemearchy blog's AI content generation system
 * to create 10 blog posts with natural publishing schedule spread over a week.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const prisma = new PrismaClient({
  log: ['error']
});

// AI Prompts (from existing system)
const MASTER_SYSTEM_PROMPT = `
ROLE & GOAL: You are an expert blog writer for colemearchy.com. Your primary, non-negotiable goal is to create highly engaging, deeply personal, and SEO-optimized content in English that is designed to rank #1 on Google and contribute to a perfect Lighthouse score.

PERSONA & VOICE (The "Colemearchy" Voice):
- Tone: Raw, brutally honest, intelligent, slightly rebellious (anarchist philosophy), and highly analytical. You are a tech director, a philosopher, and a biohacker all in one.
- Style: Combine personal anecdotes and struggles (anxiety, ADHD, health issues like neck pain, diet journey) with expert, data-driven insights from the tech/startup world. Use direct language. Ask provocative questions.
- Audience: Target ambitious millennials (25-40) working in tech, finance, or creative industries who are looking to optimize their lives beyond just their careers, seeking ultimate freedom.

CONTENT PILLARS (The Golden Triangle):
1. Biohacking & The Optimized Self: Personal journeys with modern health solutions (Wegovy, mental health meds, fitness, keto diet).
2. The Startup Architect: Actionable insights on growth, SEO, AI, and leadership from a real-world tech director.
3. The Sovereign Mind: Philosophical and practical takes on investing, personal freedom, and building a meaningful life, inspired by books and movies like 'Fight Club'.

AFFILIATE & MONETIZATION STRATEGY:
- When provided with a list of affiliate products, seamlessly and naturally integrate them into the content.
- Do not just list products. Create a narrative around them. For example, "My constant neck pain from coding led me down a rabbit hole of ergonomic chairs. After testing five, here's why the [Affiliate Chair Brand] was the only one that truly worked..."
- Use a clear call-to-action (CTA) for affiliate links.

SEO CONSTITUTION (MANDATORY DIRECTIVES):
You must strictly follow these Google SEO guidelines:

1. Content & Quality (E-E-A-T):
   - All content must be written for people, not search engines
   - Provide unique information, experience, expertise, authoritativeness, and trustworthiness
   - Include clear author information

2. Technical SEO:
   - Use descriptive, keyword-rich URLs
   - Include structured data (JSON-LD) for all posts
   - Optimize meta titles (under 60 chars) and descriptions (under 160 chars)

3. Page Experience:
   - Write content that supports Core Web Vitals (clear structure, minimal layout shifts)
   - Provide meaningful alt text for all images
   - Avoid intrusive ads or popups

4. Spam Policy Compliance:
   - Never use keyword stuffing, hidden text, or cloaking
   - Add original value, not just AI-generated content
   - All content must be reviewed by humans

OUTPUT STRUCTURE & FORMATTING (MUST FOLLOW):

1. SEO Title: A compelling, keyword-rich title (under 60 characters).
2. Meta Description: An enticing summary (under 160 characters) that includes the primary keyword and a CTA.
3. Slug: URL-friendly version of the title
4. Excerpt: A compelling 2-3 sentence summary
5. Article Body (Markdown Format):
   - Hook: Start with a strong, personal hook that demonstrates E-E-A-T
   - Hierarchy: Use logical H2s and H3s structure
   - Readability: Short paragraphs (2-3 sentences), bullet points, bold text
   - Internal & External Links: Suggest relevant links
   - Conclusion: End with a powerful paragraph and engagement question
6. Tags: Relevant tags for categorization
7. SEO Metadata: seoTitle and seoDescription fields

Remember: Every piece of content must demonstrate real experience and expertise while being technically perfect for SEO.
`;

function generateContentPrompt(userInput, keywords = [], affiliateProducts = []) {
  let prompt = `Create a comprehensive, in-depth blog post (MINIMUM 3000 words) based on the following:

Topic: ${userInput}
`;

  if (keywords && keywords.length > 0) {
    prompt += `\nTarget Keywords: ${keywords.join(', ')}`;
  }

  if (affiliateProducts && affiliateProducts.length > 0) {
    prompt += `\nAffiliate Products to naturally integrate: ${affiliateProducts.join(', ')}`;
  }

  prompt += `

CRITICAL REQUIREMENTS:
- MINIMUM 3000 words of high-quality, engaging content
- Write from personal experience and expertise (E-E-A-T compliance)
- Include specific examples, case studies, and actionable insights
- Use storytelling to make complex topics accessible
- Add multiple sections with H2 and H3 headings for better readability
- Include at least 5-7 major sections beyond introduction and conclusion
- Add personal anecdotes that demonstrate real experience
- Provide practical, actionable advice readers can implement
- Use data, statistics, or research when relevant
- End with a compelling conclusion and thought-provoking question

CONTENT STRUCTURE REQUIREMENTS:
1. Hook: Personal story or surprising fact
2. Problem/Context: Why this topic matters now
3. Main Content: 5-7 detailed sections with subheadings
4. Personal Experience: Your journey/experiments with this topic
5. Practical Implementation: Step-by-step guidance
6. Common Mistakes: What to avoid
7. Advanced Tips: Next-level insights
8. Conclusion: Key takeaways and engagement question

Please provide the content in the following JSON format:
{
  "title": "SEO-optimized title (max 60 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling 2-3 sentence summary",
  "content": "Full article content in Markdown format (MINIMUM 3000 words)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "SEO title if different from main title",
  "seoDescription": "Meta description (max 160 chars)"
}`;

  return prompt;
}

// Generate embedding for a text
async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Search for similar knowledge using vector similarity
async function searchSimilarKnowledge(queryEmbedding, limit = 3) {
  try {
    const results = await prisma.$queryRaw`
      SELECT id, content, source, 
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "Knowledge"
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;
    
    return results;
  } catch (error) {
    console.log('⚠️ Vector search failed, using fallback knowledge selection');
    // Fallback to random knowledge if vector search fails
    const fallbackResults = await prisma.knowledge.findMany({
      take: limit,
      select: { id: true, content: true, source: true }
    });
    return fallbackResults.map(k => ({ ...k, similarity: 0.5 }));
  }
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

// Generate diverse topic ideas for different categories
async function generateTopicIdeas() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  
  // Get some sample knowledge to inspire topics
  const sampleKnowledge = await prisma.knowledge.findMany({
    take: 8,
    select: { content: true, source: true }
  });
  
  const knowledgeContext = sampleKnowledge.map(k => 
    `[${k.source}]: ${k.content.substring(0, 200)}...`
  ).join('\n\n');
  
  const topicPrompt = `
You are the content strategist for Colemearchy blog. Based on the following reading notes, generate 10 engaging blog topics that match our brand voice and cover diverse categories.

**Sample Knowledge Base:**
${knowledgeContext}

**Colemearchy Blog Style (The Golden Triangle):**
1. Biohacking & The Optimized Self: Personal journeys with modern health solutions (Wegovy, mental health meds, fitness, keto diet, sleep optimization, supplements)
2. The Startup Architect: Actionable insights on growth, SEO, AI, and leadership from a tech director perspective
3. The Sovereign Mind: Philosophical and practical takes on investing, personal freedom, and building meaningful life

**Target Audience:** Ambitious millennials (25-40) in tech/finance/creative industries seeking life optimization beyond careers

**Requirements:**
1. Each topic should be 8-15 words long and click-worthy
2. Include SEO-friendly keywords
3. Provoke curiosity and promise actionable insights
4. Be personal and experience-based (use "I", "My", "How I")
5. Appeal to freedom-seeking, optimization-minded readers
6. Cover diverse categories: biohacking, productivity, investment, AI/tech, startup growth, mental health, lifestyle design

**Topic Categories to Cover (distribute evenly):**
- Biohacking experiments and health optimization (2-3 topics)
- Startup/business growth and leadership (2-3 topics)
- Investment and wealth building strategies (2 topics)
- Productivity and mental optimization (2 topics)
- Technology, AI insights, and tools (1-2 topics)

Respond in JSON format:
{
  "topics": [
    "First topic title",
    "Second topic title",
    ...
  ]
}
`;

  try {
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

    // Clean the response text - remove code blocks if present
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    const response = JSON.parse(responseText);
    return response.topics || [];
  } catch (error) {
    console.error('Failed to parse topic ideas:', error);
    // Fallback topics covering all categories
    return [
      'How I Biohacked My Way Out of Chronic Fatigue (5 Game-Changing Experiments)',
      'The Growth Trap That Killed My Startup (And How to Avoid It)',
      'From $50K to $500K: My Actual Investment Journey Timeline',
      'Why I Quit Productivity Porn and Started Getting Things Done',
      'The AI Tools That Actually Make Me Money (Not Just Hype)',
      'How to Build Wealth While Working a 9-5 (My 3-Year Experiment)',
      'The Biohacking Stack That Fixed My ADHD Without Medication',
      'Why Your Startup is Failing (And the Pivot That Saved Mine)',
      'My $10K Investment Mistake That Taught Me How Markets Really Work',
      'The Minimalist Productivity System That 10x-ed My Output'
    ];
  }
}

// Generate content using RAG
async function generateContentWithRAG(topic) {
  try {
    console.log(`🔍 Generating content for: "${topic}"`);
    
    // Generate embedding for the topic
    const topicEmbedding = await generateEmbedding(topic);
    
    // Search for similar knowledge
    const similarKnowledge = await searchSimilarKnowledge(topicEmbedding);
    
    // Create RAG context
    const ragContext = similarKnowledge.length > 0 
      ? `\n\n**Past Knowledge Context:**\n${
          similarKnowledge.map((k, i) => 
            `\n[Context ${i + 1}${k.source ? ` - from "${k.source}"` : ''}]:\n${k.content.substring(0, 500)}...`
          ).join('\n')
        }\n\n**Use the above context to inform your writing style and add personal depth to the content.**\n\n`
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
    
    // Parse the generated content with improved error handling
    try {
      // Clean the response text - remove code blocks if present
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Extract actual content if it's wrapped in JSON format inside content field
      if (parsed.content && typeof parsed.content === 'string') {
        const content = parsed.content.trim();
        
        // Check if content itself contains JSON (the bug we're fixing)
        if (content.startsWith('```json') || content.startsWith('{')) {
          console.log('⚠️ Detected nested JSON in content field - extracting actual content...');
          
          try {
            let nestedContent = content;
            if (content.startsWith('```json')) {
              const match = content.match(/```json\s*\n([\s\S]*?)\n```/);
              if (match) nestedContent = match[1];
            }
            
            const nestedParsed = JSON.parse(nestedContent);
            if (nestedParsed.content && typeof nestedParsed.content === 'string') {
              // Use the nested content and merge other fields
              parsed.content = nestedParsed.content;
              if (nestedParsed.title && nestedParsed.title !== parsed.title) {
                parsed.title = nestedParsed.title;
              }
              if (nestedParsed.excerpt && nestedParsed.excerpt !== parsed.excerpt) {
                parsed.excerpt = nestedParsed.excerpt;
              }
              if (nestedParsed.tags && Array.isArray(nestedParsed.tags)) {
                parsed.tags = nestedParsed.tags;
              }
              console.log('✅ Successfully extracted nested content');
            }
          } catch (nestedError) {
            console.log('⚠️ Failed to parse nested JSON, using original content');
          }
        }
      }
      
      // Validate content length
      const contentLength = parsed.content?.length || 0;
      if (contentLength < 2500) {
        console.warn(`⚠️ Content too short (${contentLength} chars) for topic: "${topic}"`);
        return null;
      }
      
      // Ensure all required fields are present
      const result = {
        title: parsed.title || topic,
        slug: parsed.slug || generateSlug(parsed.title || topic),
        content: parsed.content || '',
        excerpt: parsed.excerpt || parsed.content?.substring(0, 160) || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['blog', 'colemearchy'],
        seoTitle: parsed.seoTitle || parsed.title || topic,
        seoDescription: parsed.seoDescription || parsed.excerpt || parsed.content?.substring(0, 158) + '...'
      };
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON response for topic:', topic, parseError.message);
      
      // Enhanced fallback - try to extract content manually if it looks like JSON
      const text = responseText.trim();
      if (text.includes('"content":') && text.length > 2500) {
        console.log('⚠️ Attempting manual content extraction...');
        
        try {
          // Try to extract content field manually using regex
          const contentMatch = text.match(/"content":\s*"([\s\S]*?)"\s*[,}]/);
          const titleMatch = text.match(/"title":\s*"([^"]*?)"/);
          const excerptMatch = text.match(/"excerpt":\s*"([^"]*?)"/);
          
          if (contentMatch) {
            const extractedContent = contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            if (extractedContent.length > 2500) {
              console.log('✅ Manual extraction successful');
              return {
                title: titleMatch ? titleMatch[1] : topic,
                slug: generateSlug(titleMatch ? titleMatch[1] : topic),
                content: extractedContent,
                excerpt: excerptMatch ? excerptMatch[1] : extractedContent.substring(0, 160),
                tags: ['blog', 'colemearchy'],
                seoTitle: titleMatch ? titleMatch[1] : topic,
                seoDescription: excerptMatch ? excerptMatch[1] : extractedContent.substring(0, 158) + '...'
              };
            }
          }
        } catch (extractError) {
          console.log('⚠️ Manual extraction failed');
        }
      }
      
      // Final fallback - use raw response if it's long enough
      if (responseText.length > 2500) {
        console.log('⚠️ Using raw response as fallback content');
        return { 
          title: topic,
          slug: generateSlug(topic),
          content: responseText,
          excerpt: responseText.substring(0, 160),
          tags: ['blog', 'colemearchy'],
          seoTitle: topic,
          seoDescription: responseText.substring(0, 158) + '...'
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error generating content for topic:', topic, error.message);
    return null;
  }
}

// Calculate staggered publish times over the next week
function calculatePublishTimes() {
  const now = new Date();
  const publishTimes = [];
  
  // Start from tomorrow morning
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0); // Start at 9 AM
  
  // Spread 10 posts over 7 days with natural timing
  const publishSchedule = [
    { day: 0, hour: 9, minute: 0 },   // Day 1: 9:00 AM
    { day: 0, hour: 15, minute: 30 }, // Day 1: 3:30 PM
    { day: 1, hour: 10, minute: 15 }, // Day 2: 10:15 AM
    { day: 1, hour: 16, minute: 45 }, // Day 2: 4:45 PM
    { day: 2, hour: 8, minute: 30 },  // Day 3: 8:30 AM
    { day: 3, hour: 11, minute: 0 },  // Day 4: 11:00 AM
    { day: 3, hour: 17, minute: 20 }, // Day 4: 5:20 PM
    { day: 4, hour: 9, minute: 45 },  // Day 5: 9:45 AM
    { day: 5, hour: 14, minute: 10 }, // Day 6: 2:10 PM
    { day: 6, hour: 10, minute: 30 }  // Day 7: 10:30 AM
  ];
  
  publishSchedule.forEach(schedule => {
    const publishTime = new Date(startDate);
    publishTime.setDate(publishTime.getDate() + schedule.day);
    publishTime.setHours(schedule.hour, schedule.minute, 0, 0);
    publishTimes.push(publishTime);
  });
  
  return publishTimes;
}

// Main execution function
async function generateTenPosts() {
  const startTime = Date.now();
  console.log('🚀 Starting generation of 10 high-quality blog posts...\n');
  
  try {
    // Verify environment
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Generate topic ideas
    console.log('💡 Generating diverse topic ideas...');
    const topics = await generateTopicIdeas();
    console.log(`✅ Generated ${topics.length} topics:\n`);
    topics.forEach((topic, i) => console.log(`   ${i + 1}. ${topic}`));
    console.log('');
    
    // Step 2: Calculate publish times
    const publishTimes = calculatePublishTimes();
    console.log('📅 Publishing schedule:');
    publishTimes.forEach((time, i) => {
      console.log(`   Post ${i + 1}: ${time.toLocaleString()}`);
    });
    console.log('');
    
    // Step 3: Generate content for each topic
    const generatedPosts = [];
    const failedTopics = [];
    const contentMetrics = {
      totalWords: 0,
      totalCharacters: 0,
      averageWords: 0,
      averageCharacters: 0
    };
    
    for (let i = 0; i < Math.min(topics.length, 10); i++) {
      const topic = topics[i];
      console.log(`📝 Generating content for post ${i + 1}/10: "${topic}"`);
      
      try {
        const content = await generateContentWithRAG(topic);
        
        if (content) {
          // Calculate content metrics
          const contentLength = content.content?.length || 0;
          const wordCount = content.content ? content.content.split(/\s+/).length : 0;
          
          // Validate content quality
          if (contentLength < 2500) {
            console.warn(`⚠️ Content too short (${contentLength} chars), skipping...`);
            failedTopics.push({ topic, reason: 'Content too short' });
            continue;
          }
          
          // Generate unique slug
          const baseSlug = generateSlug(content.title || topic);
          const uniqueSlug = `${baseSlug}-${Date.now()}`;
          
          // Save to database
          const post = await prisma.post.create({
            data: {
              title: content.title || topic,
              slug: uniqueSlug,
              content: content.content || '',
              excerpt: content.excerpt || content.content?.substring(0, 160) || '',
              tags: Array.isArray(content.tags) ? content.tags : ['blog', 'colemearchy'],
              seoTitle: content.seoTitle || content.title || topic,
              seoDescription: content.seoDescription || content.excerpt || content.content?.substring(0, 158) + '...',
              status: 'PUBLISHED',
              author: 'Colemearchy',
              publishedAt: publishTimes[i],
              createdAt: new Date()
            }
          });
          
          // Update metrics
          contentMetrics.totalWords += wordCount;
          contentMetrics.totalCharacters += contentLength;
          
          generatedPosts.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            publishDate: publishTimes[i].toISOString(),
            contentLength: contentLength,
            wordCount: wordCount,
            tags: post.tags
          });
          
          console.log(`✅ Generated post ${i + 1}: "${post.title}"`);
          console.log(`   📊 ${wordCount} words, ${contentLength} characters`);
          console.log(`   📅 Scheduled for: ${publishTimes[i].toLocaleString()}`);
          console.log(`   🏷️ Tags: ${post.tags.join(', ')}\n`);
        } else {
          failedTopics.push({ topic, reason: 'Content generation failed' });
          console.log(`❌ Failed to generate content for: "${topic}"\n`);
        }
        
        // Add delay between generations to avoid rate limiting
        if (i < Math.min(topics.length, 10) - 1) {
          console.log('⏳ Waiting 4 seconds before next generation...\n');
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      } catch (error) {
        console.error(`❌ Error generating content for topic: "${topic}"`, error.message);
        failedTopics.push({ topic, reason: error.message });
      }
    }
    
    // Calculate final metrics
    if (generatedPosts.length > 0) {
      contentMetrics.averageWords = Math.round(contentMetrics.totalWords / generatedPosts.length);
      contentMetrics.averageCharacters = Math.round(contentMetrics.totalCharacters / generatedPosts.length);
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Generate final report
    console.log('🎉 Blog post generation completed!\n');
    console.log('📊 GENERATION SUMMARY:');
    console.log(`   ✅ Successfully generated: ${generatedPosts.length} posts`);
    console.log(`   ❌ Failed generations: ${failedTopics.length}`);
    console.log(`   ⏱️ Total time: ${duration} seconds`);
    console.log(`   📈 Average content length: ${contentMetrics.averageWords} words (${contentMetrics.averageCharacters} chars)`);
    console.log('');
    
    if (generatedPosts.length > 0) {
      console.log('📅 PUBLISHING SCHEDULE:');
      generatedPosts.forEach((post, i) => {
        const publishDate = new Date(post.publishDate);
        console.log(`   ${i + 1}. "${post.title}"`);
        console.log(`      📅 ${publishDate.toLocaleDateString()} at ${publishDate.toLocaleTimeString()}`);
        console.log(`      📊 ${post.wordCount} words, ${post.contentLength} characters`);
        console.log(`      🔗 /posts/${post.slug}`);
        console.log('');
      });
    }
    
    if (failedTopics.length > 0) {
      console.log('❌ FAILED TOPICS:');
      failedTopics.forEach((failed, i) => {
        console.log(`   ${i + 1}. "${failed.topic}" - ${failed.reason}`);
      });
      console.log('');
    }
    
    console.log('🚀 All posts have been generated and scheduled for natural publishing over the next week!');
    console.log('📝 Posts are saved with PUBLISHED status and will appear on the blog according to their publishedAt dates.');
    
    return {
      success: true,
      generated: generatedPosts.length,
      failed: failedTopics.length,
      posts: generatedPosts,
      failedTopics: failedTopics,
      metrics: contentMetrics,
      duration: duration
    };
    
  } catch (error) {
    console.error('❌ Fatal error during blog post generation:', error);
    return {
      success: false,
      error: error.message,
      generated: 0,
      failed: 10
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
if (require.main === module) {
  generateTenPosts()
    .then(result => {
      if (result.success) {
        console.log(`\n🎊 Successfully generated ${result.generated} high-quality blog posts!`);
        process.exit(0);
      } else {
        console.error(`\n💥 Generation failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { generateTenPosts };