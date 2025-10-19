import { PrismaClient } from '@prisma/client'
import { getChannelVideos } from '../src/lib/youtube.js'

const prisma = new PrismaClient()

async function analyzeYouTubeShorts() {
  try {
    console.log('🔍 YouTube 채널의 모든 영상 분석 중...\n')

    let allVideos = []
    let pageToken = undefined
    let pageCount = 0

    // Fetch all videos (pagination)
    do {
      const { videos, nextPageToken } = await getChannelVideos(50, pageToken)
      allVideos = allVideos.concat(videos)
      pageToken = nextPageToken
      pageCount++
      console.log(`   페이지 ${pageCount}: ${videos.length}개 영상 로드됨`)

      // Limit to 200 videos max to avoid rate limits
      if (allVideos.length >= 200) break
    } while (pageToken)

    console.log(`\n📊 총 ${allVideos.length}개 영상 로드 완료\n`)

    // Classify videos
    const shorts = allVideos.filter(v => v.isShort)
    const regulars = allVideos.filter(v => !v.isShort)

    console.log(`📹 Shorts 영상: ${shorts.length}개`)
    console.log(`📺 일반 영상: ${regulars.length}개\n`)

    // Check which ones already have posts
    const existingPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: { in: allVideos.map(v => v.id) }
      },
      select: {
        youtubeVideoId: true,
        title: true,
        content: true,
        tags: true
      }
    })

    const existingVideoIds = new Set(existingPosts.map(p => p.youtubeVideoId))

    // Analyze Shorts
    const shortsWithPost = shorts.filter(s => existingVideoIds.has(s.id))
    const shortsWithoutPost = shorts.filter(s => !existingVideoIds.has(s.id))

    console.log('📋 Shorts 영상 현황:')
    console.log(`   ✅ 이미 포스트 있음: ${shortsWithPost.length}개`)
    console.log(`   ❌ 포스트 없음 (신규 생성 필요): ${shortsWithoutPost.length}개`)
    console.log()

    // Check existing Shorts posts that need regeneration
    const shortsPostsToRegenerate = existingPosts.filter(p => {
      const hasShortTag = p.tags.includes('Shorts') || p.tags.includes('쇼츠')
      const isShortContent = (p.content?.length || 0) < 1000
      return hasShortTag || isShortContent
    })

    console.log('🔄 재생성이 필요한 Shorts 포스트:')
    console.log(`   📝 1000자 미만: ${shortsPostsToRegenerate.length}개`)
    console.log()

    if (shortsPostsToRegenerate.length > 0) {
      console.log('샘플:')
      shortsPostsToRegenerate.slice(0, 5).forEach((post, i) => {
        console.log(`${i + 1}. ${post.title} (${post.content?.length || 0} chars)`)
      })
      console.log()
    }

    // Show未处理 Shorts
    if (shortsWithoutPost.length > 0) {
      console.log('📌 포스트가 없는 Shorts 영상 (최근 10개):')
      shortsWithoutPost.slice(0, 10).forEach((video, i) => {
        console.log(`${i + 1}. ${video.title}`)
        console.log(`   - Video ID: ${video.id}`)
        console.log(`   - Duration: ${video.duration}`)
        console.log()
      })
    }

    // Total work to do
    const totalWork = shortsPostsToRegenerate.length + shortsWithoutPost.length
    const daysNeeded = Math.ceil(totalWork / 9)

    console.log('📊 총 작업량:')
    console.log(`   - 재생성: ${shortsPostsToRegenerate.length}개`)
    console.log(`   - 신규 생성: ${shortsWithoutPost.length}개`)
    console.log(`   - 총 작업: ${totalWork}개`)
    console.log(`   - 예상 소요일 (9개/일): ${daysNeeded}일`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeYouTubeShorts()
