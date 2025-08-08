import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // 부분 업데이트만 수행
    const updateData: any = {}
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null
    
    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}