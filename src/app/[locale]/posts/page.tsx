import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import InfinitePostsList from '@/components/InfinitePostsList'
import PageLayout from '@/components/PageLayout'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isKorean = locale === 'ko'
  
  return {
    title: isKorean ? '모든 글 | Cole IT AI' : 'All Posts | Cole IT AI',
    description: isKorean 
      ? 'AI, 기술, 소프트웨어 개발에 관한 모든 블로그 글'
      : 'Explore all blog posts about AI, technology, and software development',
    openGraph: {
      title: isKorean ? '모든 글 | Cole IT AI' : 'All Posts | Cole IT AI',
      description: isKorean 
        ? 'AI, 기술, 소프트웨어 개발에 관한 모든 블로그 글'
        : 'Explore all blog posts about AI, technology, and software development',
      type: 'website',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        lte: new Date(),
      },
      // 언어별 필터링: 정확한 언어 매칭
      ...(lang === 'ko' ? {
        // 한국어 페이지: originalLanguage가 'ko'이거나 null인 경우만
        OR: [
          { originalLanguage: 'ko' },
          { originalLanguage: null }  // 레거시 포스트
        ]
      } : {
        // 영어 페이지: originalLanguage가 'en'이거나 영어 번역이 있는 경우만
        OR: [
          { originalLanguage: 'en' },
          {
            AND: [
              { originalLanguage: { in: ['ko', null] } },
              {
                translations: {
                  some: {
                    locale: 'en'
                  }
                }
              }
            }
          ]
        ]
      })
    },
    orderBy: {
      publishedAt: 'desc',
    },
    include: {
      translations: {
        where: {
          locale: lang
        }
      }
    }
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Cole IT AI',
    description: lang === 'ko' 
      ? 'AI, 기술, 소프트웨어 개발에 관한 블로그'
      : 'A blog about AI, technology, and software development',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/posts`,
    blogPost: posts.map(post => {
      const title = lang === 'en' && post.translations?.[0]?.title
        ? post.translations[0].title
        : post.title
      const excerpt = lang === 'en' && post.translations?.[0]?.excerpt
        ? post.translations[0].excerpt
        : post.excerpt
        
      return {
        '@type': 'BlogPosting',
        headline: title,
        description: excerpt,
        datePublished: post.publishedAt?.toISOString(),
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/posts/${post.slug}`,
        author: {
          '@type': 'Organization',
          name: 'Cole IT AI',
        },
      }
    }),
  }

  return (
    <PageLayout locale={locale} currentPath="/archive">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lang === 'ko' ? '모든 글' : 'All Posts'}
        </h1>
        <p className="text-lg text-gray-600">
          {lang === 'ko' 
            ? 'AI, 기술, 소프트웨어 개발에 관한 모든 글'
            : 'Explore all posts about AI, technology, and software development'}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-600">
          {lang === 'ko' ? '아직 게시물이 없습니다.' : 'No posts found.'}
        </p>
      ) : (
        <InfinitePostsList 
          initialPosts={posts} 
          locale={locale}
        />
      )}
    </PageLayout>
  )
}