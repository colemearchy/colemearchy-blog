import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n'

export async function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl.clone()
    let pathname = url.pathname
    const hostname = request.headers.get('host') || ''


    // Handle www redirect + other redirects in a single hop
    const isWww = hostname.startsWith('www.')
    const hasTrailingSlash = pathname !== '/' && pathname.endsWith('/')

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // Skip locale redirect for special routes
    const skipLocaleRedirect = [
      '/api',
      '/admin',
      '/_next',
      '/icon',
      '/apple-icon',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/ads.txt'
    ].some(path => pathname.startsWith(path))

    // If we need multiple redirects, combine them into one
    let needsRedirect = false
    let newUrl = url.clone()

    // NOTE: Vercel redirects non-www to www, so we don't handle www removal here
    // This prevents redirect loops

    // Remove trailing slash
    if (hasTrailingSlash) {
      newUrl.pathname = pathname.slice(0, -1)
      pathname = newUrl.pathname // Update pathname for subsequent checks
      needsRedirect = true
    }

    // Add locale (default to Korean for Korean speakers, English for others)
    if (!pathnameHasLocale && !skipLocaleRedirect) {
      // Detect language from Accept-Language header
      const acceptLanguage = request.headers.get('accept-language') || ''
      const isKorean = acceptLanguage.toLowerCase().includes('ko')

      // Default to Korean if Korean language detected, otherwise English
      const locale = isKorean ? 'ko' : 'en'
      newUrl.pathname = `/${locale}${pathname}`
      needsRedirect = true
    }

    // If any redirect is needed, do it in one hop
    if (needsRedirect) {
      return NextResponse.redirect(newUrl, { status: 307 })
    }
    
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"'
          }
        })
      }
      
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
      const [username, password] = credentials.split(':')
      
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
      
      if (username !== 'admin' || password !== adminPassword) {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"'
          }
        })
      }
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all pathnames except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|ads.txt|fonts|images).*)',
  ]
}