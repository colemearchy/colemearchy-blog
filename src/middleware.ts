import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n'

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    
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
      return NextResponse.redirect(
        new URL(`/${locale}${pathname}`, request.url)
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