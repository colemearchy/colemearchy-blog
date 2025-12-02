/**
 * YouTube to Blog conversion service
 * Core logic extracted from API route for reuse in scripts
 */

import { prisma } from '@/lib/prisma'
import { MASTER_SYSTEM_PROMPT } from '@/lib/ai-prompts'
import { getVideoMetadataForBlog } from '@/lib/youtube'
import { YouTubeTranscriptService } from '@/lib/youtube-transcript'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/env'
import { logger, ApiError } from '@/lib/error-handler'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { detectLanguage } from '@/lib/translation'
import { backupSinglePost } from '@/lib/auto-backup'
import { findMatchingProducts } from '@/lib/utils/affiliate-product-matcher'
import { injectAffiliateLinks } from '@/lib/utils/affiliate-link-injector'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export interface ConvertVideoToBlogOptions {
  videoId: string
  autoPublish?: boolean
}

export interface ConvertVideoToBlogResult {
  post: {
    id: string
    slug: string
    title: string
    status: string
  }
}

/**
 * Convert YouTube video to blog post
 */
export async function convertVideoToBlog(
  options: ConvertVideoToBlogOptions
): Promise<ConvertVideoToBlogResult> {
  const { videoId, autoPublish = false } = options

  if (!videoId) {
    throw new ApiError(400, 'Video ID is required')
  }

  logger.info('Processing YouTube video', { videoId, autoPublish })

  // Check if video already processed
  const existingPost = await prisma.post.findFirst({
    where: { youtubeVideoId: videoId }
  })

  if (existingPost) {
    logger.warn('Video already processed', { videoId, postId: existingPost.id })
    throw new ApiError(409, 'Video already processed', {
      postId: existingPost.id,
      slug: existingPost.slug
    })
  }

  // Initialize services
  const transcriptService = new YouTubeTranscriptService()

  // Fetch video metadata
  logger.info('Fetching video metadata', { videoId })
  const metadata = await getVideoMetadataForBlog(videoId)

  if (!metadata) {
    throw new ApiError(400, 'Failed to fetch video metadata', { videoId })
  }

  logger.info('Video metadata fetched', {
    title: metadata.title,
    duration: metadata.duration,
    channelTitle: metadata.channelTitle
  })

  // Fetch transcript
  logger.info('Fetching transcript', { videoId })
  let transcript
  try {
    transcript = await transcriptService.fetchTranscript(videoId)
  } catch (error) {
    logger.error('Transcript fetch error', error, { videoId })
    throw new ApiError(
      400,
      'Transcript not available for this video. Only videos with captions can be processed.',
      { videoId }
    )
  }

  // Process transcript
  logger.info('Processing transcript', { videoId })
  const processedTranscript = transcriptService.processTranscript(transcript)
  logger.info('Transcript processed', {
    fullLength: processedTranscript.fullText.length,
    chunks: processedTranscript.chunks.length,
    duration: processedTranscript.duration
  })

  // Determine if this is a Shorts video (< 120 seconds)
  const isShort = processedTranscript.duration < 120
  logger.info('Video type detected', {
    duration: processedTranscript.duration,
    isShort,
    type: isShort ? 'Shorts' : 'Regular'
  })

  // Generate blog content using Gemini
  logger.info('Generating blog content', { videoId, isShort })
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  // Process in chunks if needed
  let generatedContent = ''
  if (processedTranscript.chunks.length > 1) {
    logger.info('Processing multiple chunks', {
      chunks: processedTranscript.chunks.length
    })

    // Process each chunk
    for (let i = 0; i < processedTranscript.chunks.length; i++) {
      const prompt = transcriptService.generateBlogPrompt(
        processedTranscript,
        metadata,
        i,
        isShort
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
      metadata,
      undefined,
      isShort
    )

    const result = await model.generateContent(prompt)
    const response = await result.response
    generatedContent = response.text()
  }

  // Enhance content differently based on video type
  let enhancedContent = ''

  if (isShort) {
    // For Shorts: Skip timestamps, just add video embed section
    enhancedContent = `
${generatedContent}

## 📺 원본 쇼츠 영상

전체 영상은 아래에서 확인하실 수 있습니다:

[YouTube 쇼츠 임베드 위치]
    `.trim()
  } else {
    // For regular videos: Include timestamps
    const keyMoments = transcriptService.extractKeyMoments(transcript)
    enhancedContent = `
${generatedContent}

## 📍 주요 타임스탬프

${keyMoments.map(moment =>
  `- [${moment.timeString}](https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(moment.timestamp)}s) - ${moment.text}`
).join('\n')}

## 📺 원본 영상

아래에서 전체 영상을 시청하실 수 있습니다:

[YouTube 영상 임베드 위치]
    `.trim()
  }

  // Generate final blog post structure
  logger.info('Creating blog post structure', { videoId, isShort })

  const durationMinutes = Math.floor(processedTranscript.duration / 60)
  const durationSeconds = Math.floor(processedTranscript.duration % 60)
  const durationText = durationMinutes > 0
    ? `${durationMinutes}분 ${durationSeconds}초`
    : `${durationSeconds}초`

  const videoTypeText = isShort ? 'Shorts 영상' : '일반 영상'

  const blogPrompt = `
${MASTER_SYSTEM_PROMPT}

SPECIAL TASK: Transform the following YouTube ${isShort ? 'Shorts' : 'video'} transcript blog draft into a final, polished blog post.

VIDEO INFO:
- Title: ${metadata.title}
- Channel: ${metadata.channelTitle}
- Duration: ${durationText}
- Type: ${videoTypeText}
- URL: https://www.youtube.com/watch?v=${videoId}

DRAFT CONTENT:
${enhancedContent}

REQUIREMENTS:
1. Create an engaging SEO-optimized title (max 100 chars)${isShort ? ' - 쇼츠의 핵심 메시지를 담되 블로그 타이틀답게' : ''}
2. Write a compelling excerpt (2-3 sentences)
3. Polish and structure the content with proper headings
4. Add the Colemearchy voice and personal insights
5. Include the YouTube embed naturally
6. Generate 3-5 relevant tags${isShort ? ' - "Shorts", "쇼츠" 태그 포함' : ''}
7. Optimize for SEO

${isShort ? `
SPECIAL INSTRUCTIONS FOR SHORTS:
- The draft content should already be comprehensive (1000+ chars)
- Ensure all sections are well-developed (intro, main content, insights, conclusion)
- Don't add "Watch the video" suggestions - the blog should stand alone
- Focus on making the content valuable without requiring video viewing
` : ''}

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
    const jsonMatch = finalText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      generatedData = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('No JSON found')
    }
  } catch (error) {
    logger.warn('Failed to parse generated data as JSON, using fallback', { videoId, isShort })
    // Fallback structure
    const videoTypeLabel = isShort ? 'Shorts' : '영상'
    const fallbackTags = isShort
      ? ['YouTube', 'Shorts', '쇼츠', '영상요약', metadata.channelTitle.replace(/\s+/g, '')]
      : ['YouTube', '영상요약', metadata.channelTitle.replace(/\s+/g, '')]

    generatedData = {
      title: `[${videoTypeLabel} 요약] ${metadata.title}`,
      excerpt: `${metadata.title} ${isShort ? '쇼츠' : '영상'}의 핵심 내용을 정리했습니다.`,
      content: enhancedContent,
      tags: fallbackTags,
      seoTitle: `${metadata.title} - 핵심 요약`,
      seoDescription: `${metadata.title} ${isShort ? '쇼츠' : '영상'}의 주요 내용과 인사이트를 정리한 블로그 포스트입니다.`
    }
  }

  // Extract title and create post
  let title = generatedData.title || `[영상 요약] ${metadata.title}`

  // Ensure title is not too long
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }

  // Generate slug
  const baseSlug = generateSlug(title, 60)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    const existing = await prisma.post.findUnique({ where: { slug: s } })
    return !!existing
  })

  // Extract tags from content
  const hashtags = metadata.description.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
  const baseTags = isShort
    ? ['YouTube', 'Shorts', '쇼츠', '영상요약']
    : ['YouTube', '영상요약']

  const tags = [...new Set([
    ...baseTags,
    metadata.channelTitle.replace(/\s+/g, ''),
    ...hashtags.slice(0, 3),
    ...generatedData.tags || []
  ])].slice(0, 7) // Allow more tags for Shorts to include both 'Shorts' and '쇼츠'

  // Auto-detect language from title and content
  const detectedLanguage = detectLanguage(title + ' ' + (generatedData.content || enhancedContent).substring(0, 500))
  logger.info('Language detected', { language: detectedLanguage, title })

  // 쿠팡 제휴 제품 매칭 및 링크 삽입
  let finalContent = generatedData.content || enhancedContent
  try {
    const matchedProducts = await findMatchingProducts(
      title,
      finalContent,
      tags,
      20, // 최소 점수
      2   // 최대 2개 제품
    )

    if (matchedProducts.length > 0) {
      logger.info('Affiliate products matched', {
        count: matchedProducts.length,
        products: matchedProducts.map(p => p.name)
      })

      // 제휴 링크 자동 삽입
      finalContent = injectAffiliateLinks(finalContent, matchedProducts)
    } else {
      logger.info('No affiliate products matched for this post')
    }
  } catch (affiliateError) {
    // 제휴 링크 실패해도 포스트 생성은 계속 진행
    logger.warn('Affiliate link injection failed', { error: affiliateError })
  }

  // Create post
  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content: finalContent,
      excerpt: generatedData.excerpt || `${metadata.title} 영상을 요약하고 핵심 인사이트를 정리했습니다.`,
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      author: 'Colemearchy',
      status: autoPublish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: autoPublish ? new Date() : null,
      youtubeVideoId: videoId,
      coverImage: metadata.thumbnailUrl,
      seoTitle: generatedData.seoTitle || title,
      seoDescription: generatedData.seoDescription || generatedData.excerpt,
      originalLanguage: detectedLanguage
    }
  })

  logger.info('Blog post created from YouTube video', {
    postId: post.id,
    slug: post.slug,
    status: post.status,
    videoId
  })

  // Auto-backup newly created post
  try {
    await backupSinglePost(post.id, 'post-create')
    logger.info('Auto-backup completed for new post', { postId: post.id })
  } catch (backupError) {
    // Backup failure shouldn't break the main flow
    logger.warn('Auto-backup failed but post creation succeeded', {
      postId: post.id,
      error: backupError
    })
  }

  return {
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status
    }
  }
}
