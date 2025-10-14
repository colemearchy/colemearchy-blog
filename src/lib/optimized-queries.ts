import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Optimized post query with caching
export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.post.findUnique({
      where: { 
        slug,
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: new Date()
        }
      },
      select: {
        // Only select required fields
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: true,
        tags: true,
        seoTitle: true,
        seoDescription: true,
        views: true,
        status: true,
        youtubeVideoId: true,
        originalLanguage: true,
        translations: {
          select: {
            id: true,
            locale: true,
            title: true,
            content: true,
            excerpt: true,
            seoTitle: true,
            seoDescription: true,
          }
        }
      }
    })
  },
  ['post-by-slug'],
  {
    revalidate: 3600, // 1 hour
    tags: ['posts']
  }
)

// Optimized related posts query
export const getRelatedPosts = unstable_cache(
  async (postId: string, tags: string[], limit: number = 3) => {
    if (!tags.length) return []
    
    return prisma.post.findMany({
      where: {
        id: { not: postId },
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: new Date()
        },
        // 썸네일이 있는 포스트만 노출
        coverImage: {
          not: null
        },
        tags: {
          hasSome: tags
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        tags: true,
        views: true,
      },
      orderBy: [
        { views: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit
    })
  },
  ['related-posts'],
  {
    revalidate: 3600,
    tags: ['posts']
  }
)

// Get comments without caching (dynamic data)
export async function getPostComments(postId: string) {
  return prisma.comment.findMany({
    where: {
      postId,
      isApproved: true,
      isDeleted: false,
      parentId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      replies: {
        where: {
          isApproved: true,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })
}