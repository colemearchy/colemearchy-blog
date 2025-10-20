import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Get all non-YouTube posts ordered by createdAt to calculate ranks
    const allNonYoutubePosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Create a map of post ID to rank (한글 썸네일용)
    const postRankMap = new Map<string, number>()
    allNonYoutubePosts.forEach((post, index) => {
      postRankMap.set(post.id, index + 1) // 1-based ranking
    })

    // 2. Get posts without Korean thumbnails (coverImage)
    const koreanThumbnailPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 3. Get all posts with English translations
    const allPostsWithEnglishTranslation = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: 'PUBLISHED',
        translations: {
          some: {
            locale: 'en'
          }
        }
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Create a map for English translation rank
    const englishRankMap = new Map<string, number>()
    allPostsWithEnglishTranslation.forEach((post, index) => {
      englishRankMap.set(post.id, index + 1)
    })

    // 4. Get posts with English translation but no English thumbnail
    const englishThumbnailPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
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
        createdAt: 'asc'
      }
    })

    // 5. Add postNumber to Korean thumbnail posts
    const koreanPostsWithNumbers = koreanThumbnailPosts.map(post => ({
      ...post,
      postNumber: postRankMap.get(post.id) || 0
    }))

    // 6. Add postNumber to English thumbnail posts
    const englishPostsWithNumbers = englishThumbnailPosts.map(post => ({
      ...post,
      postNumber: englishRankMap.get(post.id) || 0,
      englishTitle: post.translations[0]?.title || ''
    }))

    const koreanStats = {
      total: koreanPostsWithNumbers.length,
      byLanguage: {
        ko: koreanPostsWithNumbers.filter(p => p.originalLanguage === 'ko').length,
        en: koreanPostsWithNumbers.filter(p => p.originalLanguage === 'en').length,
      }
    }

    const englishStats = {
      total: englishPostsWithNumbers.length,
      byLanguage: {
        ko: englishPostsWithNumbers.filter(p => p.originalLanguage === 'ko').length,
        en: englishPostsWithNumbers.filter(p => p.originalLanguage === 'en').length,
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