import { prisma } from '../src/lib/prisma'

async function checkPost() {
  const slug = 'the-no-code-era-is-over-welcome-to-the-age-of-vibe-coding'
  
  console.log(`Checking for post with slug: ${slug}`)
  
  const post = await prisma.post.findUnique({
    where: { slug }
  })
  
  if (post) {
    console.log('\nPost found:')
    console.log('- ID:', post.id)
    console.log('- Title:', post.title)
    console.log('- Status:', post.status)
    console.log('- Published At:', post.publishedAt)
    console.log('- Scheduled At:', post.scheduledAt)
    console.log('- Created At:', post.createdAt)
  } else {
    console.log('\nPost NOT found in database')
    
    // 비슷한 slug 찾기
    const similarPosts = await prisma.post.findMany({
      where: {
        slug: {
          contains: 'vibe-coding'
        }
      },
      select: {
        slug: true,
        title: true,
        status: true
      }
    })
    
    if (similarPosts.length > 0) {
      console.log('\nSimilar posts found:')
      similarPosts.forEach(p => {
        console.log(`- ${p.slug} (${p.status}): ${p.title}`)
      })
    }
  }
  
  // 최근 포스트 확인
  const recentPosts = await prisma.post.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    select: {
      slug: true,
      title: true,
      status: true,
      createdAt: true
    }
  })
  
  console.log('\n\nMost recent posts:')
  recentPosts.forEach(p => {
    console.log(`- ${p.slug} (${p.status}): ${p.title} - Created: ${p.createdAt.toISOString()}`)
  })
  
  await prisma.$disconnect()
}

checkPost().catch(console.error)