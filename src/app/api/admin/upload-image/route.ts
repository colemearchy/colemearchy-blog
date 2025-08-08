import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { optimizeImage } from '@/lib/image-utils'
import { generateUniqueFileName, validateImageFile } from '@/lib/upload-utils'

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

    // Validate image file
    const validation = validateImageFile(image)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Optimize image
    const optimizedBuffer = await optimizeImage(buffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp'
    })

    // Generate unique filename
    const filename = generateUniqueFileName(image.name)

    // Upload to Vercel Blob
    const blob = await put(filename, optimizedBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp'
    })

    // Update post if not temp
    if (!postId.startsWith('temp-')) {
      await prisma.post.update({
        where: { id: postId },
        data: { coverImage: blob.url }
      })
    }

    return NextResponse.json({ 
      imageUrl: blob.url,
      postId 
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    
    // Check if it's a Vercel Blob error
    if (error instanceof Error && error.message.includes('BLOB_')) {
      return NextResponse.json(
        { error: 'Storage service error. Please check your configuration.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}