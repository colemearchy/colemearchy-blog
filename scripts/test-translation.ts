import { createPostTranslation } from '../src/lib/translation'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function testTranslation() {
  const postId = 'cmdjyddc700028jgn3yeimbw6'
  
  try {
    console.log('Testing translation for post:', postId)
    console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No')
    console.log('API Key first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...')
    
    // Test API key directly
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    const testResponse = await fetch(testUrl)
    console.log('API Key test status:', testResponse.status)
    
    const testPost = {
      title: 'Biohacking Sleep: How I Increased My REM Cycles by 30%',
      content: 'This is a test content about sleep optimization.',
      excerpt: 'Test excerpt about sleep',
      seoTitle: null,
      seoDescription: null,
    }
    
    console.log('Translating to Korean...')
    const translation = await createPostTranslation(testPost, 'ko')
    
    console.log('Translation result:', translation)
  } catch (error) {
    console.error('Translation failed:', error)
  }
}

testTranslation()