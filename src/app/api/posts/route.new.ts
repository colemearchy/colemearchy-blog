import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, logger } from '@/lib/error-handler'
import { createPostSchema, paginationSchema } from '@/lib/validations'
import { getPaginatedPosts, buildPostWhereClause, getPostOrderBy } from '@/lib/utils/prisma'
import { postDetailSelect } from '@/types/prisma'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const params = paginationSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search'),
    tag: searchParams.get('tag'),
  })

  const where = buildPostWhereClause({
    search: params.search,
    tag: params.tag,
    published: true, // Only show published posts in public API
  })

  const orderBy = getPostOrderBy('newest')
  
  const result = await getPaginatedPosts(prisma, {
    where,
    orderBy,
    page: params.page || 1,
    limit: params.limit || 10,
    select: postDetailSelect,
  })

  logger.info('Posts fetched', {
    count: result.posts.length,
    page: result.page,
    total: result.total,
  })

  return NextResponse.json(result)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = createPostSchema.parse(body)

  const post = await prisma.post.create({
    data: {
      title: validatedData.title,
      slug: validatedData.slug,
      content: validatedData.content,
      excerpt: validatedData.excerpt || null,
      coverImage: validatedData.coverImage || null,
      tags: validatedData.tags || [],
      seoTitle: validatedData.seoTitle || validatedData.title,
      seoDescription: validatedData.seoDescription || validatedData.excerpt || '',
      publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
      youtubeVideoId: validatedData.youtubeVideoId || null,
      socialLinks: validatedData.socialLinks || null,
      // If publishedAt is set, automatically set status to PUBLISHED
      status: validatedData.publishedAt ? 'PUBLISHED' : 'DRAFT',
    },
    select: postDetailSelect,
  })
  
  logger.info('Post created', { postId: post.id, slug: post.slug })

  // If post is published, trigger sitemap update
  if (post.status === 'PUBLISHED' && post.publishedAt) {
    triggerSitemapUpdate().catch(error => {
      logger.error('Failed to trigger sitemap update', error)
    })
  }
  
  return NextResponse.json(post, { status: 201 })
})

async function triggerSitemapUpdate() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    logger.warn('NEXT_PUBLIC_SITE_URL not set, skipping sitemap update')
    return
  }

  const response = await fetch(`${siteUrl}/api/sitemap/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Sitemap update failed with status ${response.status}`)
  }
}