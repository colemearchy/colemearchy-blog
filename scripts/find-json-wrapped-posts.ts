import { prisma } from '../src/lib/prisma'

async function findJsonWrappedPosts() {
  try {
    console.log('Searching for posts with JSON-wrapped content...\n')
    
    // Find all posts where content starts with ```json
    const posts = await prisma.post.findMany({
      where: {
        content: {
          startsWith: '```json'
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true
      }
    })
    
    console.log(`Found ${posts.length} posts with JSON-wrapped content:`)
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`)
      console.log(`   - Slug: ${post.slug}`)
      console.log(`   - Status: ${post.status}`)
      console.log(`   - ID: ${post.id}`)
    })
    
    // Also check translations
    const translations = await prisma.postTranslation.findMany({
      where: {
        content: {
          startsWith: '```json'
        }
      },
      select: {
        id: true,
        locale: true,
        title: true,
        postId: true
      }
    })
    
    if (translations.length > 0) {
      console.log(`\n\nFound ${translations.length} translations with JSON-wrapped content:`)
      
      translations.forEach((translation, index) => {
        console.log(`\n${index + 1}. ${translation.title} (${translation.locale})`)
        console.log(`   - Post ID: ${translation.postId}`)
        console.log(`   - Translation ID: ${translation.id}`)
      })
    }
    
    if (posts.length > 0 || translations.length > 0) {
      console.log('\n⚠️  These posts/translations need to be fixed!')
      console.log('You can run a batch fix script to clean them all up.')
    } else {
      console.log('\n✅ No posts with JSON-wrapped content found!')
    }
    
  } catch (error) {
    console.error('Error searching posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findJsonWrappedPosts()