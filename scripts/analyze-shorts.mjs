import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeShortsPost() {
  try {
    // Count posts with Shorts tags
    const shortsCount = await prisma.post.count({
      where: {
        OR: [
          { tags: { has: 'Shorts' } },
          { tags: { has: '쇼츠' } }
        ]
      }
    })

    console.log(`\n📊 총 Shorts 게시물 수: ${shortsCount}개\n`)

    // Get sample posts
    const shortsPosts = await prisma.post.findMany({
      where: {
        OR: [
          { tags: { has: 'Shorts' } },
          { tags: { has: '쇼츠' } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        youtubeVideoId: true,
        content: true,
        tags: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log('📋 최근 Shorts 게시물 샘플:\n')
    shortsPosts.forEach((post, index) => {
      const contentLength = post.content?.length || 0
      console.log(`${index + 1}. [${post.status}] ${post.title}`)
      console.log(`   - ID: ${post.id}`)
      console.log(`   - Slug: ${post.slug}`)
      console.log(`   - Video ID: ${post.youtubeVideoId || 'N/A'}`)
      console.log(`   - Content Length: ${contentLength} chars`)
      console.log(`   - Tags: ${post.tags.join(', ')}`)
      console.log(`   - Created: ${post.createdAt.toISOString().split('T')[0]}`)
      console.log()
    })

    // Analyze content length distribution
    const allShorts = await prisma.post.findMany({
      where: {
        OR: [
          { tags: { has: 'Shorts' } },
          { tags: { has: '쇼츠' } }
        ]
      },
      select: {
        content: true
      }
    })

    const contentLengths = allShorts.map(p => p.content?.length || 0)
    const avgLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length
    const minLength = Math.min(...contentLengths)
    const maxLength = Math.max(...contentLengths)
    const shortContent = contentLengths.filter(l => l < 500).length

    console.log('📈 콘텐츠 길이 분석:')
    console.log(`   - 평균: ${Math.round(avgLength)} chars`)
    console.log(`   - 최소: ${minLength} chars`)
    console.log(`   - 최대: ${maxLength} chars`)
    console.log(`   - 500자 미만 (재생성 필요): ${shortContent}개`)
    console.log()

    // Check if they have youtubeVideoId
    const withVideoId = await prisma.post.count({
      where: {
        AND: [
          {
            OR: [
              { tags: { has: 'Shorts' } },
              { tags: { has: '쇼츠' } }
            ]
          },
          { youtubeVideoId: { not: null } }
        ]
      }
    })

    console.log(`✅ YouTube Video ID 있음: ${withVideoId}개`)
    console.log(`❌ YouTube Video ID 없음: ${shortsCount - withVideoId}개`)
    console.log()

    if (shortsCount > 0) {
      const daysNeeded = Math.ceil(shortsCount / 9)
      console.log(`⏱️  하루 9개씩 처리 시 예상 소요일: ${daysNeeded}일`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeShortsPost()
