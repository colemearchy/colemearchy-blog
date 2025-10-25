import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') || 'Colemearchy'
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Use system font for English (no font loading needed)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            position: 'relative',
            padding: '0 100px',
          }}
        >
          <h1
            style={{
              color: '#fff',
              fontSize: 64,
              fontWeight: 400,
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '900px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {title}
          </h1>

          {/* 캐릭터 이미지 */}
          <img
            src={`${baseUrl}/images/character.png`}
            width={200}
            height={200}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 40,
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error('OG Image generation error:', e)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}
