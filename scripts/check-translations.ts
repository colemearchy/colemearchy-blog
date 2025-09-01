import { prisma } from '../src/lib/prisma'

async function checkTranslations() {
  const postId = 'cmdjyddc700028jgn3yeimbw6'
  
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        translations: true
      }
    })
    
    if (!post) {
      console.log('Post not found')
      return
    }
    
    console.log('Post:', {
      id: post.id,
      title: post.title.substring(0, 50) + '...',
      originalLanguage: post.originalLanguage
    })
    
    console.log('\nTranslations:')
    if (post.translations.length === 0) {
      console.log('No translations found')
    } else {
      post.translations.forEach(t => {
        console.log(`- ${t.locale}: ${t.title}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTranslations()