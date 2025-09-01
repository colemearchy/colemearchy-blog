import { prisma } from '../src/lib/prisma'
import { detectLanguage } from '../src/lib/translation'

async function updateOriginalLanguage() {
  console.log('Updating original language for all posts...')
  
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        originalLanguage: true,
      }
    })
    
    let updatedCount = 0
    
    for (const post of posts) {
      const detectedLang = detectLanguage(post.title + ' ' + post.content)
      
      if (post.originalLanguage !== detectedLang) {
        await prisma.post.update({
          where: { id: post.id },
          data: { originalLanguage: detectedLang }
        })
        updatedCount++
        console.log(`Updated post ${post.id}: ${post.originalLanguage} -> ${detectedLang}`)
      }
    }
    
    console.log(`✅ Updated ${updatedCount} posts out of ${posts.length} total posts`)
  } catch (error) {
    console.error('Error updating posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateOriginalLanguage()