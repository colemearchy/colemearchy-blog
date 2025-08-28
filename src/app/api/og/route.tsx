import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Colemearchy Blog';
    const author = searchParams.get('author') || 'Colemearchy';
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const readTime = searchParams.get('readTime') || '5 min read';
    const tags = searchParams.get('tags')?.split(',').slice(0, 3) || [];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // slate-900
            backgroundImage: 'linear-gradient(45deg, #0f172a 0%, #1e293b 100%)', // slate-900 to slate-800
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.02) 2%, transparent 0%), 
                               radial-gradient(circle at 75px 75px, rgba(255,255,255,0.02) 2%, transparent 0%)`,
              backgroundSize: '100px 100px',
            }}
          />
          
          {/* Brand logo/name */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '50px',
              display: 'flex',
              alignItems: 'center',
              color: '#3b82f6', // blue-500
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            COLEMEARCHY
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              margin: '0 60px',
              maxWidth: '900px',
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: title.length > 50 ? '48px' : '56px',
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1.2,
                margin: '0 0 30px 0',
                textAlign: 'center',
                wordWrap: 'break-word',
              }}
            >
              {title}
            </h1>

            {/* Subtitle/tagline */}
            <p
              style={{
                fontSize: '24px',
                color: '#94a3b8', // slate-400
                margin: '0',
                opacity: 0.8,
              }}
            >
              바이오해킹 · 스타트업 · 주권적 삶
            </p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100px',
                left: '50px',
                display: 'flex',
                gap: '10px',
              }}
            >
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Author and metadata */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50px',
              right: '50px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#64748b', // slate-500
              fontSize: '20px',
            }}
          >
            <div>by {author}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>{date}</span>
              <span>•</span>
              <span>{readTime}</span>
            </div>
          </div>

          {/* Decorative element */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a simple fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
          }}
        >
          Colemearchy Blog
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}