import { prisma } from '../src/lib/prisma'

async function fixAllJsonPosts() {
  try {
    console.log('Starting batch fix for all JSON-wrapped posts...\n')
    
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
      
      // Try to extract just the content field using regex
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
      
      return null
    }
    
    // Find all posts with JSON-wrapped content
    const posts = await prisma.post.findMany({
      where: {
        content: {
          startsWith: '```json'
        }
      }
    })
    
    console.log(`Found ${posts.length} posts to fix\n`)
    
    let successCount = 0
    let failCount = 0
    
    // Fix each post
    for (const post of posts) {
      console.log(`Processing: ${post.title} (${post.slug})`)
      
      const extractedContent = extractContent(post.content)
      
      if (extractedContent && extractedContent !== post.content) {
        try {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              content: extractedContent
            }
          })
          console.log(`✅ Fixed successfully`)
          successCount++
        } catch (error) {
          console.log(`❌ Failed to update: ${error}`)
          failCount++
        }
      } else {
        console.log(`⚠️  Could not extract content`)
        failCount++
      }
    }
    
    console.log(`\n--- Post Fix Summary ---`)
    console.log(`✅ Successfully fixed: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    
    // Now fix translations
    console.log(`\n\nProcessing translations...`)
    
    const translations = await prisma.postTranslation.findMany({
      where: {
        content: {
          startsWith: '```json'
        }
      }
    })
    
    console.log(`Found ${translations.length} translations to fix\n`)
    
    let translationSuccessCount = 0
    let translationFailCount = 0
    
    for (const translation of translations) {
      console.log(`Processing translation: ${translation.title} (${translation.locale})`)
      
      const extractedContent = extractContent(translation.content!)
      
      if (extractedContent && extractedContent !== translation.content) {
        try {
          await prisma.postTranslation.update({
            where: { id: translation.id },
            data: {
              content: extractedContent
            }
          })
          console.log(`✅ Fixed successfully`)
          translationSuccessCount++
        } catch (error) {
          console.log(`❌ Failed to update: ${error}`)
          translationFailCount++
        }
      } else {
        console.log(`⚠️  Could not extract content`)
        translationFailCount++
      }
    }
    
    console.log(`\n--- Translation Fix Summary ---`)
    console.log(`✅ Successfully fixed: ${translationSuccessCount}`)
    console.log(`❌ Failed: ${translationFailCount}`)
    
    console.log(`\n\n🎉 Batch fix complete!`)
    console.log(`Total fixed: ${successCount + translationSuccessCount}`)
    console.log(`Total failed: ${failCount + translationFailCount}`)
    
  } catch (error) {
    console.error('Error in batch fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run first 5 as a test
async function testFixFivePosts() {
  try {
    console.log('Testing fix on first 5 posts...\n')
    
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
      
      // Try to extract just the content field using regex
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
      
      return null
    }
    
    // Find first 5 posts with JSON-wrapped content
    const posts = await prisma.post.findMany({
      where: {
        content: {
          startsWith: '```json'
        }
      },
      take: 5
    })
    
    console.log(`Testing on ${posts.length} posts\n`)
    
    for (const post of posts) {
      console.log(`\nProcessing: ${post.title}`)
      console.log(`Slug: ${post.slug}`)
      
      const extractedContent = extractContent(post.content)
      
      if (extractedContent) {
        console.log(`✅ Content extracted successfully`)
        console.log(`Preview: ${extractedContent.substring(0, 100)}...`)
        
        // Actually update the post
        await prisma.post.update({
          where: { id: post.id },
          data: {
            content: extractedContent
          }
        })
        console.log(`✅ Post updated successfully`)
      } else {
        console.log(`❌ Failed to extract content`)
      }
    }
    
  } catch (error) {
    console.error('Error in test fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test first
console.log('Running test fix on first 5 posts...')
console.log('To run full batch fix, uncomment the last line of this script\n')

testFixFivePosts()

// Uncomment this line to run the full batch fix:
// fixAllJsonPosts()