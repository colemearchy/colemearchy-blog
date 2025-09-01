import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPostTranslation } from '@/lib/translation'

export async function POST(request: NextRequest) {
  try {
    const { postIds } = await request.json()
    
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
        translations: {
          where: {
            locale: 'en'
          }
        }
      }
    })
    
    const translationResults = []
    
    for (const post of posts) {
      // Skip if already has English translation
      if (post.translations.length > 0) {
        translationResults.push({
          postId: post.id,
          status: 'skipped',
          message: 'Already has English translation'
        })
        continue
      }
      
      try {
        // Create translation
        const translation = await createPostTranslation({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
        })
        
        await prisma.postTranslation.create({
          data: {
            postId: post.id,
            ...translation,
          },
        })
        
        translationResults.push({
          postId: post.id,
          status: 'success',
          message: 'Translation created successfully'
        })
      } catch (error) {
        console.error(`Failed to translate post ${post.id}:`, error)
        translationResults.push({
          postId: post.id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Translation failed'
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