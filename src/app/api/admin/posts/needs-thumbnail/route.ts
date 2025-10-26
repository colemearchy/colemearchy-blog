import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // 2. Get posts with English translation but no English thumbnail
    // Use globalRank for numbering (same unified ranking)
    // Include both PUBLISHED and DRAFT posts
    // Filter to only show posts that have English translations (not Korean-only posts)
    const englishThumbnailPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: { in: ['PUBLISHED', 'DRAFT'] },
        translations: {
          some: {
            locale: 'en',
            OR: [
              { coverImage: null },
              { coverImage: '' }
            ]
          }
        }
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
        translations: {
          where: {
            locale: 'en'
          },
          select: {
            title: true,
            coverImage: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Changed to creation date for clear sequential numbering
      }
    })

    // 3. Format response with sequential numbering (1, 2, 3...)
    // Simple sequential numbering based on creation date order
    const koreanPostsWithNumbers = koreanThumbnailPosts.map((post, index) => ({
      ...post,
      postNumber: index + 1 // Simple 1, 2, 3... numbering
    }))

    // 4. Format English posts with sequential numbering
    const englishPostsWithNumbers = englishThumbnailPosts.map((post, index) => ({
      ...post,
      postNumber: index + 1, // Simple 1, 2, 3... numbering
      englishTitle: post.translations[0]?.title || ''
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
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}