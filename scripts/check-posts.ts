import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPosts() {
  try {
    const totalPosts = await prisma.post.count()
    const draftPosts = await prisma.post.count({
      where: { status: 'DRAFT' }
    })
    const publishedPosts = await prisma.post.count({
      where: { status: 'PUBLISHED' }
    })
    
    console.log('📊 블로그 포스트 현황:')
    console.log(`- 전체 포스트: ${totalPosts}개`)
    console.log(`- DRAFT 상태: ${draftPosts}개`)
    console.log(`- PUBLISHED 상태: ${publishedPosts}개`)
    
    // 최근 생성된 포스트 10개 표시
    const recentPosts = await prisma.post.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        status: true,
        createdAt: true,
      }
    })
    
    console.log('\n📝 최근 생성된 포스트 10개:')
    recentPosts.forEach((post, index) => {
      console.log(`${index + 1}. [${post.status}] ${post.title.substring(0, 50)}... (${post.createdAt.toISOString()})`)
    })
  } catch (error) {
    console.error('오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPosts()