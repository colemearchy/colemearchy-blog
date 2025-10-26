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
}