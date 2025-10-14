import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 썸네일이 없고 DRAFT 상태인 포스트 조회
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
        status: 'DRAFT'
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
        createdAt: 'desc'
      }
    })

    // 간단한 통계 정보 추가
    const stats = {
      total: posts.length,
      byLanguage: {
        ko: posts.filter(p => p.originalLanguage === 'ko').length,
        en: posts.filter(p => p.originalLanguage === 'en').length,
      }
    }

    return NextResponse.json({
      posts,
      stats
    })
  } catch (error) {
    console.error('Failed to fetch posts needing thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}