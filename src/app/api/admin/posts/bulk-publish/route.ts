import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, logger, ApiError } from '@/lib/error-handler'
import { z } from 'zod'

const bulkPublishSchema = z.object({
  postIds: z.array(z.string()).min(1, 'At least one post ID is required')
})

/**
 * POST /api/admin/posts/bulk-publish
 * Publish multiple draft posts at once
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()

  logger.info('Bulk publish request received', { body })

  // Validate input
  const { postIds } = bulkPublishSchema.parse(body)

  logger.info('Publishing multiple posts', { count: postIds.length, postIds })

  const results = []

  for (const postId of postIds) {
    try {
      // Check if post exists and get its status
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, status: true }
      })

      if (!existingPost) {
        results.push({
          postId,
          status: 'error',
          message: 'Post not found'
        })
        continue
      }

      if (existingPost.status === 'PUBLISHED') {
        results.push({
          postId,
          title: existingPost.title,
          status: 'skipped',
          message: 'Already published'
        })
        continue
      }

      // Update post to PUBLISHED
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      })

      results.push({
        postId,
        title: existingPost.title,
        status: 'success',
        message: 'Published successfully'
      })

      logger.info('Post published', { postId, title: existingPost.title })
    } catch (error) {
      logger.error('Error publishing post', { postId, error })
      results.push({
        postId,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const skippedCount = results.filter(r => r.status === 'skipped').length
  const errorCount = results.filter(r => r.status === 'error').length

  logger.info('Bulk publish completed', {
    total: postIds.length,
    success: successCount,
    skipped: skippedCount,
    errors: errorCount
  })

  return NextResponse.json({
    success: true,
    summary: {
      total: postIds.length,
      published: successCount,
      skipped: skippedCount,
      errors: errorCount
    },
    results
  })
})
