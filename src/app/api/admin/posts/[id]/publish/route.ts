import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, logger, ApiError } from '@/lib/error-handler'

/**
 * POST /api/admin/posts/[id]/publish
 * Publish a draft post
 */
export const POST = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  logger.info('Publishing post', { postId: id })

  // Check if post exists and is a draft
  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { status: true, title: true }
  })

  if (!existingPost) {
    throw new ApiError(404, 'Post not found', { postId: id })
  }

  if (existingPost.status === 'PUBLISHED') {
    logger.info('Post is already published', { postId: id })
    return NextResponse.json({
      success: true,
      message: 'Post is already published',
      alreadyPublished: true
    })
  }

  // Update post status to PUBLISHED and set publishedAt
  const post = await prisma.post.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  })

  logger.info('Post published successfully', {
    postId: id,
    title: existingPost.title,
    publishedAt: post.publishedAt
  })

  return NextResponse.json({
    success: true,
    message: 'Post published successfully',
    post: {
      id: post.id,
      status: post.status,
      publishedAt: post.publishedAt
    }
  })
})
