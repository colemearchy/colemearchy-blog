import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  return {
    title: locale === 'en' ? 'Cole IT AI - Tech & AI Blog' : 'Cole IT AI - 기술 및 AI 블로그',
    description: locale === 'en' 
      ? 'A blog about AI, technology, and software development'
      : 'AI, 기술, 소프트웨어 개발에 관한 블로그',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' }
      ],
      apple: [
        { url: '/favicon.svg' }
      ]
    },
    openGraph: {
      title: locale === 'en' ? 'Cole IT AI - Tech & AI Blog' : 'Cole IT AI - 기술 및 AI 블로그',
      description: locale === 'en' 
        ? 'A blog about AI, technology, and software development'
        : 'AI, 기술, 소프트웨어 개발에 관한 블로그',
      siteName: 'Cole IT AI',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: locale === 'en' ? 'Cole IT AI - Tech & AI Blog' : 'Cole IT AI - 기술 및 AI 블로그',
      description: locale === 'en' 
        ? 'A blog about AI, technology, and software development'
        : 'AI, 기술, 소프트웨어 개발에 관한 블로그',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }
  
  return (
    <>
      {children}
    </>
  )
}