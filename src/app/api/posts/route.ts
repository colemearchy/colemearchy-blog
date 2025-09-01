import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('Creating post with data:', {
      title: data.title,
      slug: data.slug,
      youtubeVideoId: data.youtubeVideoId,
      tags: data.tags,
      publishedAt: data.publishedAt
    })
    
    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: data.slug }
    })
    
    if (existingPost) {
      console.error('Post with slug already exists:', data.slug)
      return NextResponse.json(
        { error: 'Post with this slug already exists' },
        { status: 400 }
      )
    }
    
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        tags: data.tags || [],
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        youtubeVideoId: data.youtubeVideoId || null,
        // If publishedAt is set, automatically set status to PUBLISHED
        status: data.publishedAt ? 'PUBLISHED' : 'DRAFT',
      },
    })
    
    // If post is published, trigger sitemap update
    if (post.status === 'PUBLISHED' && post.publishedAt) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sitemap/update`, {
          method: 'POST',
        })
      } catch (error) {
        console.error('Failed to trigger sitemap update:', error)
      }
    }
    
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create post', details: errorMessage },
      { status: 500 }
    )
  }
}