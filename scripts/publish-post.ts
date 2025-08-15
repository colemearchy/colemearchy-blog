import { prisma } from '../src/lib/prisma'

async function publishPost() {
  const slug = 'the-no-code-era-is-over-welcome-to-the-age-of-vibe-coding'
  
  console.log(`Publishing post with slug: ${slug}`)
  
  const updatedPost = await prisma.post.update({
    where: { slug },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date() // 현재 시간으로 업데이트
    }
  })
  
  console.log('\nPost published successfully:')
  console.log('- Title:', updatedPost.title)
  console.log('- Status:', updatedPost.status)
  console.log('- Published At:', updatedPost.publishedAt)
  
  await prisma.$disconnect()
}

publishPost().catch(console.error)