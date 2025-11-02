import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAndSanitizeComment } from '@/lib/comment-validation'
import { checkCommentRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/posts/[id]/comments - 게시물의 댓글 조회
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  try {
    const comments = await prisma.comment.findMany({
      where: {
        post: {
          slug: id,
        },
        isDeleted: false,
        isApproved: true,
        parentId: null, // 최상위 댓글만 조회
      },
      include: {
        replies: {
          where: {
            isDeleted: false,
            isApproved: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id]/comments - 새 댓글 작성
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  try {
    // 💰 Rate Limiting (IP 기반 스팸 방지)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkCommentRateLimit(ip)

    if (!rateLimit.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimit.resetTime),
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      )
    }

    const body = await request.json()

    // 🛡️ 입력 검증 및 Sanitization
    const validation = validateAndSanitizeComment(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { authorName, authorEmail, sanitizedContent, parentId } = validation.data!

    // 게시물 확인
    const post = await prisma.post.findUnique({
      where: { slug: id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // 댓글 생성 (sanitized content 사용)
    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        authorName,
        authorEmail,
        content: sanitizedContent, // XSS 방지된 콘텐츠
        parentId,
        isApproved: true, // 자동 승인
      },
    })

    // AI Devil's Advocate 응답 생성 (비동기로 처리)
    if (!parentId) {
      // 최상위 댓글에만 AI 응답 생성
      generateAIResponse(comment.id, content)
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

// AI 응답 생성 함수 (비동기 처리)
async function generateAIResponse(commentId: string, userContent: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-ai-response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userContent }),
      }
    )

    if (response.ok) {
      const { aiResponse } = await response.json()
      
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          aiResponse,
          aiGeneratedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Failed to generate AI response:', error)
  }
}