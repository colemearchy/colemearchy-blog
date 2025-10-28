import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tagsToArray } from '@/lib/utils/tags'

export async function GET() {
  try {
    // 1. Get posts without Korean thumbnails (coverImage)
    // Use globalRank for numbering (unified ranking system)
    // Include both PUBLISHED and DRAFT posts (user needs to add thumbnails before publishing)
    const koreanThumbnailPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: { in: ['PUBLISHED', 'DRAFT'] },
        originalLanguage: 'ko', // Only Korean posts for Korean thumbnail section
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        status: true,
        originalLanguage: true,
        views: true,
        globalRank: true,
      },
      orderBy: {
        createdAt: 'asc' // Changed to creation date for clear sequential numbering
      }
    })

    // 2. Get English original posts that need English thumbnails
    // Use globalRank for numbering (same unified ranking)
    // Include both PUBLISHED and DRAFT posts
    // Only show English original posts missing thumbnails (not Korean posts with English translations)
    const englishThumbnailPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: { in: ['PUBLISHED', 'DRAFT'] },
        originalLanguage: 'en', // Only English original posts for English thumbnail section
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        status: true,
        originalLanguage: true,
        views: true,
        globalRank: true,
      },
      orderBy: {
        createdAt: 'asc' // Changed to creation date for clear sequential numbering
      }
    })

    // 3. Format response with sequential numbering (1, 2, 3...)
    // Simple sequential numbering based on creation date order
    // Convert tags to array for client-side compatibility
    const koreanPostsWithNumbers = koreanThumbnailPosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags), // Convert string tags to array
      postNumber: index + 1 // Simple 1, 2, 3... numbering
    }))

    // 4. Format English posts with sequential numbering
    // Convert tags to array for client-side compatibility
    const englishPostsWithNumbers = englishThumbnailPosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags), // Convert string tags to array
      postNumber: index + 1 // Simple 1, 2, 3... numbering
    }))

    // Get total count of all non-YouTube posts (PUBLISHED + DRAFT) for context
    const totalNonYoutubePosts = await prisma.post.count({
      where: {
        youtubeVideoId: null,
        status: { in: ['PUBLISHED', 'DRAFT'] }
      }
    })

    const koreanStats = {
      total: koreanPostsWithNumbers.length,
      totalAvailable: totalNonYoutubePosts,
      byLanguage: {
        ko: koreanPostsWithNumbers.filter(p => p.originalLanguage === 'ko').length,
        en: koreanPostsWithNumbers.filter(p => p.originalLanguage === 'en').length,
      },
      byStatus: {
        DRAFT: koreanPostsWithNumbers.filter(p => p.status === 'DRAFT').length,
        PUBLISHED: koreanPostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
      }
    }

    const englishStats = {
      total: englishPostsWithNumbers.length,
      totalAvailable: totalNonYoutubePosts,
      byLanguage: {
        ko: englishPostsWithNumbers.filter(p => p.originalLanguage === 'ko').length,
        en: englishPostsWithNumbers.filter(p => p.originalLanguage === 'en').length,
      },
      byStatus: {
        DRAFT: englishPostsWithNumbers.filter(p => p.status === 'DRAFT').length,
        PUBLISHED: englishPostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
      }
    }

    return NextResponse.json({
      korean: {
        posts: koreanPostsWithNumbers,
        stats: koreanStats
      },
      english: {
        posts: englishPostsWithNumbers,
        stats: englishStats
      }
    })
  } catch (error) {
    console.error('Failed to fetch posts needing thumbnail:', error)

    // Emergency fallback during DB quota or connection issues
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('connection') ||
      error.message.includes('database') ||
      error.name === 'PrismaClientInitializationError'
    )) {
      return NextResponse.json({
        korean: {
          posts: [],
          stats: {
            total: 0,
            totalAvailable: 0,
            byLanguage: { ko: 0, en: 0 },
            byStatus: { DRAFT: 0, PUBLISHED: 0 }
          }
        },
        english: {
          posts: [],
          stats: {
            total: 0,
            totalAvailable: 0,
            byLanguage: { ko: 0, en: 0 },
            byStatus: { DRAFT: 0, PUBLISHED: 0 }
          }
        },
        message: 'Database quota exceeded. Please check back later.'
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}