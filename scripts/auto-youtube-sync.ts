#!/usr/bin/env tsx

/**
 * 자동 YouTube 영상 동기화 시스템
 * 유튜브 채널에 새로운 영상이 업로드되면 자동으로 블로그 포스트 생성
 */

import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { backupSinglePost } from '@/lib/auto-backup'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
})

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCoAoO5cUnk_yG4lOUHKvfqg'

/**
 * YouTube 영상 정보 인터페이스
 */
export interface VideoInfo {
  videoId: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  viewCount: string
  likeCount: string
}

/**
 * YouTube 동기화 결과 인터페이스
 */
export interface SyncResult {
  totalVideos: number
  newVideos: number
  successfulConversions: number
  failedConversions: number
  processedVideos: string[]
}

/**
 * 환경 변수 검증
 * @throws 필수 환경 변수가 없을 경우 에러 발생
 */
function validateEnvironment(): void {
  const requiredEnvVars = [
    'YOUTUBE_API_KEY',
    'YOUTUBE_CHANNEL_ID',
    'NEXT_PUBLIC_SITE_URL'
  ]

  const missing = requiredEnvVars.filter(varName => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(
      `Required environment variables are missing: ${missing.join(', ')}\n` +
      `Please set these in your .env file or environment.`
    )
  }
}

/**
 * 유튜브 채널의 최신 영상들을 가져옴
 *
 * @param maxResults - 가져올 영상 개수 (기본값: 10, 최대: 50)
 * @returns 영상 정보 배열
 * @throws YouTube API 호출 실패 시 에러 발생
 *
 * @example
 * ```typescript
 * const videos = await getLatestVideos(20)
 * console.log(`Found ${videos.length} videos`)
 * ```
 */
async function getLatestVideos(maxResults: number = 10): Promise<VideoInfo[]> {
  try {
    // 입력 검증
    if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 50) {
      throw new Error('Invalid maxResults: must be a number between 1 and 50')
    }

    console.log(`🔍 채널 ${CHANNEL_ID}의 최신 영상 ${maxResults}개 조회 중...`)

    // 1. 채널의 uploads 플레이리스트 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [CHANNEL_ID]
    })

    // API 응답 검증
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error(`Channel not found: ${CHANNEL_ID}. Please check YOUTUBE_CHANNEL_ID environment variable.`)
    }

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      throw new Error('채널의 uploads 플레이리스트를 찾을 수 없습니다')
    }

    // 2. 플레이리스트에서 최신 영상들 가져오기
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults
      // Note: order 파라미터는 playlistItems.list에서 지원하지 않음 (자동으로 최신순)
    })

    const videoIds = playlistResponse.data.items?.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean) || []

    if (videoIds.length === 0) {
      console.log('⚠️ 채널에서 영상을 찾을 수 없습니다')
      return []
    }

    // 3. 영상 세부 정보 가져오기
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds as string[]
    })

    if (!videosResponse.data.items) {
      throw new Error('Failed to fetch video details from YouTube API')
    }

    const videos: VideoInfo[] = videosResponse.data.items
      .filter(video => video.id) // videoId가 없는 항목 필터링
      .map(video => ({
        videoId: video.id!,
        title: video.snippet?.title || 'Untitled',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl: video.snippet?.thumbnails?.maxres?.url ||
                     video.snippet?.thumbnails?.high?.url ||
                     video.snippet?.thumbnails?.medium?.url || '',
        duration: video.contentDetails?.duration || '',
        viewCount: video.statistics?.viewCount || '0',
        likeCount: video.statistics?.likeCount || '0'
      }))

    console.log(`✅ ${videos.length}개 영상 정보 가져오기 완료`)
    return videos

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ YouTube API 호출 실패:', errorMessage)

    // YouTube API quota exceeded 에러 메시지 개선
    if (errorMessage.includes('quota')) {
      console.error('💡 YouTube API 할당량이 초과되었습니다. 내일 다시 시도해주세요.')
    }

    throw error // 에러를 다시 던져서 호출자가 처리할 수 있도록
  }
}

/**
 * 영상이 이미 블로그 포스트로 변환되었는지 확인
 *
 * @param videoId - YouTube 영상 ID
 * @returns 이미 처리되었으면 true, 아니면 false
 *
 * @example
 * ```typescript
 * const isProcessed = await isVideoAlreadyProcessed('dQw4w9WgXcQ')
 * if (isProcessed) {
 *   console.log('Video already converted to blog post')
 * }
 * ```
 */
async function isVideoAlreadyProcessed(videoId: string): Promise<boolean> {
  try {
    // 입력 검증
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid videoId: must be a non-empty string')
    }

    const existingPost = await prisma.post.findFirst({
      where: { youtubeVideoId: videoId },
      select: { id: true } // 성능 최적화: ID만 가져오기
    })

    return !!existingPost
  } catch (error) {
    console.error(`❌ DB 조회 실패 (videoId: ${videoId}):`, error instanceof Error ? error.message : 'Unknown error')
    // DB 조회 실패는 처리되지 않은 것으로 간주 (보수적 접근)
    return false
  }
}

/**
 * 영상을 블로그 포스트로 변환
 *
 * @param video - 변환할 YouTube 영상 정보
 * @returns 성공 여부
 *
 * @example
 * ```typescript
 * const video = { videoId: 'dQw4w9WgXcQ', title: 'Test Video', ... }
 * const success = await convertVideoToBlogPost(video)
 * ```
 */
async function convertVideoToBlogPost(video: VideoInfo): Promise<boolean> {
  try {
    console.log(`📝 영상을 블로그 포스트로 변환 중: "${video.title}"`)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is not set')
    }

    // YouTube-to-blog API 호출
    const response = await fetch(`${siteUrl}/api/youtube-to-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: video.videoId,
        autoPublish: false // DRAFT로 생성 (수동 검토 후 발행)
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `API call failed with status ${response.status} ${response.statusText}\n` +
        `Response: ${errorText}`
      )
    }

    const result = await response.json()

    // API 응답 검증
    if (!result.post || !result.post.title) {
      throw new Error('Invalid API response: missing post data')
    }

    console.log(`✅ 블로그 포스트 생성 완료: "${result.post.title}"`)
    console.log(`📄 슬러그: ${result.post.slug}`)
    console.log(`📊 상태: ${result.post.status}`)

    return true

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ 영상 변환 실패 (${video.videoId}): ${errorMessage}`)
    return false
  }
}

/**
 * 새로운 영상들을 자동으로 블로그 포스트로 변환
 *
 * @returns 동기화 결과 (영상 개수, 변환 성공/실패 통계)
 * @throws 치명적인 에러 발생 시 (환경 변수 누락 등)
 *
 * @example
 * ```typescript
 * const result = await syncNewVideos()
 * console.log(`${result.successfulConversions} posts created successfully`)
 * ```
 */
async function syncNewVideos(): Promise<SyncResult> {
  console.log('🚀 YouTube 채널 자동 동기화 시작...')

  // 환경 변수 검증
  validateEnvironment()

  // 1. 최신 영상들 가져오기
  let videos: VideoInfo[]
  try {
    videos = await getLatestVideos(20) // 최근 20개 영상 확인

    if (videos.length === 0) {
      console.log('⚠️ 가져올 영상이 없습니다')
      return {
        totalVideos: 0,
        newVideos: 0,
        successfulConversions: 0,
        failedConversions: 0,
        processedVideos: []
      }
    }
  } catch (error) {
    console.error('❌ YouTube API 호출 실패:', error instanceof Error ? error.message : 'Unknown error')
    // YouTube API 실패는 빈 결과 반환
    return {
      totalVideos: 0,
      newVideos: 0,
      successfulConversions: 0,
      failedConversions: 0,
      processedVideos: []
    }
  }

  console.log(`📊 총 ${videos.length}개 영상 확인`)

  // 2. 새로운 영상들 필터링
  const newVideos: VideoInfo[] = []
  for (const video of videos) {
    const isProcessed = await isVideoAlreadyProcessed(video.videoId)
    if (!isProcessed) {
      newVideos.push(video)
    }
  }

  console.log(`🆕 새로운 영상: ${newVideos.length}개`)

  if (newVideos.length === 0) {
    console.log('✨ 모든 영상이 이미 처리되었습니다')
    return {
      totalVideos: videos.length,
      newVideos: 0,
      successfulConversions: 0,
      failedConversions: 0,
      processedVideos: []
    }
  }

  // 3. 새로운 영상들을 블로그 포스트로 변환
  let successfulConversions = 0
  let failedConversions = 0
  const processedVideos: string[] = []

  for (const video of newVideos) {
    console.log(`\n🎬 처리 중: "${video.title}" (${video.videoId})`)
    console.log(`📅 발행일: ${new Date(video.publishedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`)

    const success = await convertVideoToBlogPost(video)

    if (success) {
      successfulConversions++
      processedVideos.push(`✅ ${video.title}`)
    } else {
      failedConversions++
      processedVideos.push(`❌ ${video.title}`)
    }

    // API 호출 간 잠시 대기 (Rate limiting 방지)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n📋 처리 결과 요약:')
  console.log(`  - 총 영상: ${videos.length}개`)
  console.log(`  - 새로운 영상: ${newVideos.length}개`)
  console.log(`  - 성공: ${successfulConversions}개`)
  console.log(`  - 실패: ${failedConversions}개`)

  return {
    totalVideos: videos.length,
    newVideos: newVideos.length,
    successfulConversions,
    failedConversions,
    processedVideos
  }
}

/**
 * 메인 실행 함수
 * CLI에서 직접 실행 시 사용
 */
async function main(): Promise<void> {
  try {
    console.log('🎥 YouTube 자동 동기화 스크립트 시작...')
    console.log(`📺 채널 ID: ${CHANNEL_ID}`)
    console.log(`🌐 사이트 URL: ${process.env.NEXT_PUBLIC_SITE_URL}`)
    console.log('')

    // 환경 변수 검증 (validateEnvironment가 이미 syncNewVideos 안에서 호출되지만, 명시적으로 여기서도 호출)
    try {
      validateEnvironment()
      console.log('✅ 환경 변수 검증 완료')
      console.log('')
    } catch (error) {
      console.error('❌ 환경 변수 검증 실패')
      console.error(error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }

    // 동기화 실행
    const result = await syncNewVideos()

    // 결과 출력
    console.log('\n🎉 YouTube 자동 동기화 완료!')

    if (result.processedVideos.length > 0) {
      console.log('\n📝 처리된 영상들:')
      result.processedVideos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video}`)
      })
    }

    // 성공한 변환이 있으면 백업 실행
    if (result.successfulConversions > 0) {
      console.log('\n💾 자동 백업 실행 중...')
      try {
        const { backupAllPosts } = await import('@/lib/auto-backup')
        await backupAllPosts('youtube-sync')
        console.log('✅ 자동 백업 완료')
      } catch (backupError) {
        console.warn('⚠️ 자동 백업 실패:', backupError)
      }
    }

    process.exit(0)

  } catch (error) {
    console.error('❌ YouTube 자동 동기화 실패:', error)
    process.exit(1)
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  main()
}

export { syncNewVideos, getLatestVideos, isVideoAlreadyProcessed, convertVideoToBlogPost }