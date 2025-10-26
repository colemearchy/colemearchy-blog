import PageLayout from '@/components/PageLayout'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Temporarily disable static generation to avoid DB quota issues during build
export const dynamic = 'force-dynamic'

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  try {
    const { locale } = await params
    const lang = locale === 'en' ? 'en' : 'ko'

    // 언어별 포스트 가져오기
    const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      // 썸네일이 있는 포스트만 노출
      coverImage: {
        not: null
      },
      OR: [
        { originalLanguage: lang },
        {
          translations: {
            some: {
              locale: lang
            }
          }
        }
      ]
    },
    orderBy: { publishedAt: 'desc' },
    include: {
      translations: {
        where: {
          locale: lang
        }
      }
    }
  })
  
  return (
    <PageLayout locale={locale} currentPath="/archive">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {lang === 'ko' ? '아카이브' : 'Archive'}
      </h1>
      
      <div className="space-y-4">
        {posts.map((post) => {
          const title = lang === 'en' && post.translations?.[0]?.title
            ? post.translations[0].title
            : post.title
            
          return (
            <article key={post.id} className="border-b border-gray-200 pb-4">
              <Link
                href={`/${locale}/posts/${post.slug}`}
                className="block hover:bg-gray-50 -mx-4 px-4 py-2"
              >
                <div className="flex justify-between items-baseline">
                  <h2 className="text-lg font-medium text-gray-900 hover:text-gray-700">
                    {title}
                  </h2>
                  <time className="text-sm text-gray-500">
                    {new Date(post.publishedAt!).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </PageLayout>
  )
  } catch (error) {
    console.error('Error loading archive page:', error)

    // Emergency fallback during DB quota or connection issues
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('connection') ||
      error.message.includes('database') ||
      error.name === 'PrismaClientInitializationError'
    )) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Temporarily Unavailable</h1>
            <p className="text-gray-600 mb-4">We're experiencing high traffic. Please try again in a few minutes.</p>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Return to Home</a>
          </div>
        </div>
      )
    }

    // For other errors, show empty archive
    const { locale } = await params
    const lang = locale === 'en' ? 'en' : 'ko'

    return (
      <PageLayout locale={locale} currentPath="/archive">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {lang === 'ko' ? '아카이브' : 'Archive'}
        </h1>

        <p className="text-gray-600">
          {lang === 'ko' ? '아카이브를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' : 'Unable to load archive. Please try again later.'}
        </p>
      </PageLayout>
    )
  }
}