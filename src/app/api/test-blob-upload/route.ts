import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function GET() {
  try {
    // 간단한 텍스트 파일로 테스트
    const testContent = 'Hello from Vercel Blob Storage test!'
    const filename = `test-${Date.now()}.txt`
    
    const blob = await put(filename, testContent, {
      access: 'public',
      contentType: 'text/plain'
    })
    
    return NextResponse.json({
      success: true,
      url: blob.url,
      token: process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Not set'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}