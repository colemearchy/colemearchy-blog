import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, logger, ApiError } from '@/lib/error-handler'
import { updatePostSchema } from '@/lib/validations'

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  logger.info('Fetching post by ID', { postId: id });

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      translations: true
    }
  });

  if (!post) {
    throw new ApiError(404, 'Post not found', { postId: id });
  }

  return NextResponse.json(post);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  // Validate input data
  const data = updatePostSchema.parse(body);

  logger.info('Updating post', { postId: id });

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      tags: data.tags,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
    },
  });

  logger.info('Post updated successfully', { postId: id });
  return NextResponse.json(post);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  logger.info('Deleting post', { postId: id });

  await prisma.post.delete({
    where: { id },
  });

  logger.info('Post deleted successfully', { postId: id });
  return NextResponse.json({ success: true });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const data = await request.json();

  logger.info('Patching post', { postId: id, fields: Object.keys(data) });

  // 부분 업데이트만 수행
  const updateData: Record<string, any> = {};
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
  if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
  });

  logger.info('Post patched successfully', { postId: id });
  return NextResponse.json(post);
});