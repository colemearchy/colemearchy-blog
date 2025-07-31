import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

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

    // 파일 저장을 위한 버퍼 생성
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 파일명 생성 (postId_timestamp.확장자)
    const fileExtension = image.name.split('.').pop()
    const fileName = `${postId}_${Date.now()}.${fileExtension}`
    
    // public/uploads 디렉토리에 저장
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, fileName)

    // 파일 저장
    await writeFile(filePath, buffer)

    // 웹에서 접근 가능한 URL 반환
    const imageUrl = `/uploads/${fileName}`

    return NextResponse.json({ 
      imageUrl,
      fileName,
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