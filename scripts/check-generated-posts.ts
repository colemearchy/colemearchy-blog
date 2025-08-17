import { prisma } from '../src/lib/prisma'

async function checkGeneratedPosts() {
  console.log('Checking generated posts...\n')
  
  const posts = await prisma.post.findMany({
    where: {
      status: 'DRAFT'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      excerpt: true
    }
  })
  
  console.log(`Found ${posts.length} DRAFT posts:\n`)
  
  posts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title}`)
    console.log(`   Slug: ${post.slug}`)
    console.log(`   Status: ${post.status}`)
    console.log(`   Created: ${post.createdAt.toISOString()}`)
    console.log(`   Excerpt: ${post.excerpt?.substring(0, 100)}...`)
    console.log('')
  })
  
  // Update all DRAFT posts to PUBLISHED with staggered publish dates
  console.log('\nPublishing all DRAFT posts with staggered dates...')
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const publishDate = new Date(Date.now() + (i * 24 * 60 * 60 * 1000)) // Stagger by 1 day
    
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: publishDate
      }
    })
    
    console.log(`✅ Published: ${post.title} - Scheduled for ${publishDate.toLocaleDateString()}`)
  }
  
  await prisma.$disconnect()
}

checkGeneratedPosts().catch(console.error)