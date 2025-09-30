import { prisma } from '../src/lib/prisma'

async function fixPostComprehensive() {
  try {
    const slug = 'hba1c-6-5-5-1-6-1759201897136-1759201897947-774176'
    
    console.log(`Fixing post with slug: ${slug}\n`)
    
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        translations: true
      }
    })
    
    if (!post) {
      console.log('Post not found!')
      return
    }
    
    // Function to extract content from JSON wrapper
    function extractContent(wrappedContent: string): string | null {
      if (!wrappedContent.startsWith('```json')) {
        return wrappedContent
      }
      
      // Remove the ```json wrapper
      let jsonStr = wrappedContent.replace(/^```json\n/, '').replace(/\n```$/, '')
      
      // Fix smart quotes
      jsonStr = jsonStr
        .replace(/"/g, '"')  // Left double quote
        .replace(/"/g, '"')  // Right double quote
        .replace(/'/g, "'")  // Left single quote
        .replace(/'/g, "'")  // Right single quote
      
      // Try multiple approaches to parse the content
      
      // Approach 1: Extract just the content field using regex
      const contentMatch = jsonStr.match(/"content"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/s)
      if (contentMatch) {
        let content = contentMatch[1]
        
        // Unescape the content
        content = content
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\t/g, '\t')
        
        return content
      }
      
      // Approach 2: Try to extract title and other metadata too
      const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/)
      const excerptMatch = jsonStr.match(/"excerpt"\s*:\s*"([^"]+)"/)
      const seoTitleMatch = jsonStr.match(/"seoTitle"\s*:\s*"([^"]+)"/)
      const seoDescMatch = jsonStr.match(/"seoDescription"\s*:\s*"([^"]+)"/)
      
      if (titleMatch) {
        // Store metadata for later use
        console.log('Found title:', titleMatch[1])
      }
      
      // If we can't extract content properly, return null
      return null
    }
    
    // Fix the main post content
    const extractedContent = extractContent(post.content)
    
    if (extractedContent && extractedContent !== post.content) {
      console.log('Successfully extracted content from JSON wrapper')
      
      await prisma.post.update({
        where: { id: post.id },
        data: {
          content: extractedContent
        }
      })
      
      console.log('Post content updated successfully!')
    } else if (!extractedContent) {
      console.log('Could not extract content from JSON wrapper')
    }
    
    // Fix translations
    for (const translation of post.translations) {
      if (translation.content) {
        const translationContent = extractContent(translation.content)
        
        if (translationContent && translationContent !== translation.content) {
          console.log(`\nSuccessfully extracted content for translation ${translation.locale}`)
          
          await prisma.postTranslation.update({
            where: { id: translation.id },
            data: {
              content: translationContent
            }
          })
          
          console.log(`Translation ${translation.locale} updated successfully!`)
        }
      }
    }
    
    console.log('\nDone! The post should now display correctly.')
    
  } catch (error) {
    console.error('Error fixing post:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPostComprehensive()