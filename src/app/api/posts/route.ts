import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPostTranslation, detectLanguage } from '@/lib/translation'
import { withErrorHandler, logger } from '@/lib/error-handler'
import { createPostSchema } from '@/lib/validations'

export const GET = withErrorHandler(async () => {
  logger.info('Fetching all posts');

  // Select only necessary fields for list view
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      publishedAt: true,
      createdAt: true,
      author: true,
      status: true,
      views: true,
      youtubeVideoId: true,
      originalLanguage: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(posts);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate input data
  const data = createPostSchema.parse(body);

  logger.info('Creating post', {
    title: data.title,
    slug: data.slug,
    youtubeVideoId: data.youtubeVideoId,
    tags: data.tags,
    publishedAt: data.publishedAt
  });

  // Check if slug already exists
  const existingPost = await prisma.post.findUnique({
    where: { slug: data.slug }
  });

  if (existingPost) {
    logger.warn('Slug already exists', { slug: data.slug });
    return NextResponse.json(
      { error: 'Slug already exists.' },
      { status: 409 }
    );
  }

  // Detect source language
  const sourceLang = detectLanguage(data.title + ' ' + data.content);

  // Use transaction to ensure data consistency
  const post = await prisma.$transaction(async (tx) => {
    // Create post
    const createdPost = await tx.post.create({
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
        originalLanguage: sourceLang,
        status: data.publishedAt ? 'PUBLISHED' : 'DRAFT',
      },
    });

    // Create translations
    try {
      const targetLang = sourceLang === 'ko' ? 'en' : 'ko';

      const translation = await createPostTranslation({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      }, targetLang);

      await tx.postTranslation.create({
        data: {
          postId: createdPost.id,
          ...translation,
        },
      });

      await tx.postTranslation.create({
        data: {
          postId: createdPost.id,
          locale: sourceLang,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
        },
      });

      logger.info('Translation created successfully', { postId: createdPost.id });
    } catch (translationError) {
      logger.error('Translation failed', translationError, { postId: createdPost.id });
      // Translation failure will rollback the entire transaction
      throw translationError;
    }

    return createdPost;
  });

  // If post is published, trigger sitemap update
  if (post.status === 'PUBLISHED' && post.publishedAt) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sitemap/update`, {
        method: 'POST',
      });
      logger.info('Sitemap update triggered', { postId: post.id });
    } catch (error) {
      logger.error('Failed to trigger sitemap update', error, { postId: post.id });
    }
  }

  logger.info('Post created successfully', { postId: post.id, slug: post.slug });
  return NextResponse.json(post);
});