import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MASTER_SYSTEM_PROMPT } from '@/lib/ai-prompts'
import { getVideoMetadataForBlog } from '@/lib/youtube'
import { YouTubeTranscriptService } from '@/lib/youtube-transcript'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { videoId, autoPublish = false } = await request.json()
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log('Processing YouTube video:', videoId)

    // Check if video already processed
    const existingPost = await prisma.post.findFirst({
      where: { youtubeVideoId: videoId }
    })

    if (existingPost) {
      return NextResponse.json({ 
        error: 'Video already processed',
        postId: existingPost.id,
        slug: existingPost.slug
      }, { status: 400 })
    }

    // Initialize services
    const transcriptService = new YouTubeTranscriptService()
    
    // Fetch video metadata
    console.log('Fetching video metadata...')
    const metadata = await getVideoMetadataForBlog(videoId)
    
    if (!metadata) {
      return NextResponse.json({ error: 'Failed to fetch video metadata' }, { status: 400 })
    }

    console.log('Video metadata:', {
      title: metadata.title,
      duration: metadata.duration,
      channelTitle: metadata.channelTitle
    })

    // Fetch transcript
    console.log('Fetching transcript...')
    let transcript
    try {
      transcript = await transcriptService.fetchTranscript(videoId)
    } catch (error) {
      console.error('Transcript fetch error:', error)
      return NextResponse.json({ 
        error: 'Transcript not available for this video. Only videos with captions can be processed.' 
      }, { status: 400 })
    }

    // Process transcript
    console.log('Processing transcript...')
    const processedTranscript = transcriptService.processTranscript(transcript)
    console.log('Transcript processed:', {
      fullLength: processedTranscript.fullText.length,
      chunks: processedTranscript.chunks.length,
      duration: processedTranscript.duration
    })

    // Generate blog content using Gemini
    console.log('Generating blog content...')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    // Process in chunks if needed
    let generatedContent = ''
    if (processedTranscript.chunks.length > 1) {
      console.log(`Processing ${processedTranscript.chunks.length} chunks...`)
      
      // Process each chunk
      for (let i = 0; i < processedTranscript.chunks.length; i++) {
        const prompt = transcriptService.generateBlogPrompt(
          processedTranscript,
          metadata,
          i
        )
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        generatedContent += response.text() + '\n\n'
        
        // Small delay between chunks to avoid rate limiting
        if (i < processedTranscript.chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } else {
      // Process as single content
      const prompt = transcriptService.generateBlogPrompt(
        processedTranscript,
        metadata
      )
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      generatedContent = response.text()
    }

    // Extract key moments
    const keyMoments = transcriptService.extractKeyMoments(transcript)
    
    // Enhance content with key moments
    const enhancedContent = `
${generatedContent}

## 📍 주요 타임스탬프

${keyMoments.map(moment => 
  `- [${moment.timeString}](https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(moment.timestamp)}s) - ${moment.text}`
).join('\n')}

## 📺 원본 영상

아래에서 전체 영상을 시청하실 수 있습니다:

[YouTube 영상 임베드 위치]
    `.trim()

    // Generate final blog post structure
    console.log('Creating blog post structure...')
    const blogPrompt = `
${MASTER_SYSTEM_PROMPT}

SPECIAL TASK: Transform the following YouTube video transcript blog draft into a final, polished blog post.

VIDEO INFO:
- Title: ${metadata.title}
- Channel: ${metadata.channelTitle}
- Duration: ${Math.floor(processedTranscript.duration / 60)} minutes
- URL: https://www.youtube.com/watch?v=${videoId}

DRAFT CONTENT:
${enhancedContent}

REQUIREMENTS:
1. Create an engaging SEO-optimized title (max 100 chars)
2. Write a compelling excerpt (2-3 sentences)
3. Polish and structure the content with proper headings
4. Add the Colemearchy voice and personal insights
5. Include the YouTube embed naturally
6. Generate 3-5 relevant tags
7. Optimize for SEO

OUTPUT FORMAT:
{
  "title": "Engaging SEO title",
  "excerpt": "2-3 sentence compelling summary",
  "content": "Full markdown content with YouTube embed",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO optimized title",
  "seoDescription": "SEO meta description"
}
    `.trim()

    const finalModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    const finalResult = await finalModel.generateContent(blogPrompt)
    const finalResponse = await finalResult.response
    const finalText = finalResponse.text()
    
    let generatedData
    try {
      // Try to parse as JSON
      const jsonMatch = finalText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (error) {
      console.error('Failed to parse generated data as JSON:', error)
      // Fallback structure
      generatedData = {
        title: `[영상 요약] ${metadata.title}`,
        excerpt: `${metadata.title} 영상의 핵심 내용을 정리했습니다.`,
        content: enhancedContent,
        tags: ['YouTube', '영상요약', metadata.channelTitle.replace(/\s+/g, '')],
        seoTitle: `${metadata.title} - 핵심 요약`,
        seoDescription: `${metadata.title} 영상의 주요 내용과 인사이트를 정리한 블로그 포스트입니다.`
      }
    }

    // Extract title and create post
    let title = generatedData.title || `[영상 요약] ${metadata.title}`
    
    // Ensure title is not too long
    if (title.length > 100) {
      title = title.substring(0, 97) + '...'
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
    
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000)
    const slug = `${baseSlug}-${timestamp}-${randomNum}`

    // Extract tags from content
    const hashtags = metadata.description.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
    const tags = [...new Set([
      'YouTube',
      '영상요약',
      metadata.channelTitle.replace(/\s+/g, ''),
      ...hashtags.slice(0, 3),
      ...generatedData.tags || []
    ])].slice(0, 5)

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content: generatedData.content || enhancedContent,
        excerpt: generatedData.excerpt || `${metadata.title} 영상을 요약하고 핵심 인사이트를 정리했습니다.`,
        tags,
        author: 'Colemearchy',
        status: autoPublish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: autoPublish ? new Date() : null,
        youtubeVideoId: videoId,
        coverImage: metadata.thumbnailUrl,
        seoTitle: generatedData.seoTitle || title,
        seoDescription: generatedData.seoDescription || generatedData.excerpt,
        originalLanguage: 'ko'
      }
    })

    console.log('Blog post created:', {
      id: post.id,
      slug: post.slug,
      status: post.status
    })

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status
      }
    })

  } catch (error: any) {
    console.error('YouTube to blog error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process YouTube video',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}