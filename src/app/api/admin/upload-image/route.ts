import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const postId = formData.get('postId') as string

    if (!image || !postId) {
      return NextResponse.json(
        { error: 'Image and postId are required' },
        { status: 400 }
      )
    }

    // 이미지를 Base64로 변환
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    // MIME 타입 확인
    const mimeType = image.type || 'image/jpeg'
    
    // Data URL 형식으로 저장
    const imageUrl = `data:${mimeType};base64,${base64}`

    // 실제 postId가 있는 경우 데이터베이스 업데이트
    if (!postId.startsWith('temp-')) {
      await prisma.post.update({
        where: { id: postId },
        data: { coverImage: imageUrl }
      })
    }

    return NextResponse.json({ 
      imageUrl,
      postId 
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}