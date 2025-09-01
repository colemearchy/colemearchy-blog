import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPostTranslation } from '@/lib/translation'

export async function POST(request: NextRequest) {
  try {
    const { postIds, targetLang = 'en' } = await request.json()
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'Invalid post IDs' }, { status: 400 })
    }
    
    // Get posts that need translation
    const posts = await prisma.post.findMany({
      where: {
        id: {
          in: postIds
        }
      },
      include: {
        translations: true
      }
    })
    
    const translationResults = []
    
    for (const post of posts) {
      // Skip if already has translation for target language
      if (post.translations.some(t => t.locale === targetLang)) {
        translationResults.push({
          postId: post.id,
          status: 'skipped',
          message: `Already has ${targetLang === 'en' ? 'English' : 'Korean'} translation`
        })
        continue
      }
      
      try {
        // Create translation
        console.log(`Translating post ${post.id} to ${targetLang}...`)
        const translation = await createPostTranslation({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
        }, targetLang as 'en' | 'ko')
        
        console.log(`Translation result for ${post.id}:`, {
          locale: translation.locale,
          titleLength: translation.title.length,
          contentLength: translation.content.length,
          hasExcerpt: !!translation.excerpt
        })
        
        const created = await prisma.postTranslation.create({
          data: {
            postId: post.id,
            ...translation,
          },
        })
        
        console.log(`PostTranslation created with id: ${created.id}`)
        
        translationResults.push({
          postId: post.id,
          status: 'success',
          message: 'Translation created successfully'
        })
      } catch (error) {
        console.error(`Failed to translate post ${post.id}:`, error)
        let errorMessage = 'Translation failed'
        
        if (error instanceof Error) {
          if (error.message.includes('API_KEY_INVALID')) {
            errorMessage = 'Gemini API key is invalid. Please check your API key in .env file.'
          } else if (error.message.includes('Failed to translate')) {
            errorMessage = error.message
          } else {
            errorMessage = `Translation error: ${error.message}`
          }
        }
        
        translationResults.push({
          postId: post.id,
          status: 'error',
          message: errorMessage
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      results: translationResults
    })
  } catch (error) {
    console.error('Error in bulk translation:', error)
    return NextResponse.json({ 
      error: 'Failed to translate posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}