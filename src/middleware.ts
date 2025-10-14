import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n'

export async function middleware(request: NextRequest) {
  try {
    let pathname = request.nextUrl.pathname

    // Remove trailing slash (except for root) to avoid extra redirects
    if (pathname !== '/' && pathname.endsWith('/')) {
      return NextResponse.redirect(
        new URL(pathname.slice(0, -1) + request.nextUrl.search, request.url),
        { status: 308 } // Permanent redirect
      )
    }

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

    // Redirect to default locale if no locale is present
    if (!pathnameHasLocale && !skipLocaleRedirect) {
      const locale = request.cookies.get('locale')?.value || defaultLocale
      // Use 307 for temporary redirect (preserves method)
      return NextResponse.redirect(
        new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url),
        { status: 307 }
      )
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
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|ads.txt).*)',
  ]
}