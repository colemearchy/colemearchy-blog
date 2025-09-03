import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import LazyNewsletterAnalytics from '@/components/LazyNewsletterAnalytics'
import { Metadata } from 'next'
import { navigationItems } from '@/lib/navigation'

// Static generation with ISR (Incremental Static Regeneration)
export const revalidate = 3600 // Revalidate every hour

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
    other: {
      'naver-site-verification': 'b6f99c40e119f35973da1ab8da181dd5ccf28734'
    }
  }
}

interface Translation {
  id: string
  locale: string
  title: string
  excerpt: string | null
}

type Post = Awaited<ReturnType<typeof prisma.post.findMany>>[number] & {
  translations?: Translation[]
}

function parseExcerpt(excerpt: string | null): string | null {
  if (!excerpt) return null;
  
  // Handle potentially truncated JSON content
  if (excerpt.includes('```json') || excerpt.includes('"excerpt":')) {
    // 1. Try to extract from ```json block
    const jsonMatch = excerpt.match(/```json\s*([\s\S]*?)(?:```|$)/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.excerpt || parsed.description || null;
      } catch (e) {
        // JSON might be truncated, continue to fallback methods
      }
    }
    
    // 2. Try to extract excerpt value directly from JSON string
    const excerptMatch = excerpt.match(/"excerpt"\s*:\s*"([^"]+)"/);
    if (excerptMatch) {
      return excerptMatch[1];
    }
    
    // 3. If it's clearly JSON but we can't parse it, return a default message
    if (excerpt.startsWith('```json') || excerpt.startsWith('{')) {
      // Extract title if possible as fallback
      const titleMatch = excerpt.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch) {
        return `Read about: ${titleMatch[1]}`;
      }
      return "Click to read more...";
    }
  }
  
  return excerpt;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  let posts: Post[] = []
  
  try {
    posts = await prisma.post.findMany({
      where: { 
        status: 'PUBLISHED',
        publishedAt: { 
          not: null,
          lte: new Date() // Only show posts that should be published by now
        },
        // 언어별 포스트 필터링: 정확한 언어 매칭
        ...(lang === 'ko' ? {
          // 한국어 페이지: originalLanguage가 'ko'인 경우만
          originalLanguage: 'ko'
        } : {
          // 영어 페이지: originalLanguage가 'en'이거나 영어 번역이 있는 경우만
          OR: [
            { originalLanguage: 'en' },
            {
              AND: [
                { originalLanguage: 'ko' },
                {
                  translations: {
                    some: {
                      locale: 'en'
                    }
                  }
                }
              ]
            }
          ]
        })
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
  } catch (error) {
    console.error('Database error:', error)
    // Return empty array if database fails
    posts = []
  }

  const featuredPost = posts[0]
  const recentPosts = posts.slice(1, 5)
  const morePosts = posts.slice(5)

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <Link href={`/${locale}`} className="text-3xl font-serif italic">
              Cole IT AI
            </Link>
            <div className="flex gap-2">
              <Link
                href="/ko"
                className={`px-3 py-1 rounded font-medium ${lang === 'ko' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                KOR
              </Link>
              <Link
                href="/en"
                className={`px-3 py-1 rounded font-medium ${lang === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ENG
              </Link>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex justify-center items-center gap-6 pb-4" aria-label="Main navigation">
            {navigationItems[lang].map((item, index) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href === '/' ? '' : item.href}`}
                className={`text-sm font-medium pb-2 ${
                  index === 0 
                    ? 'text-gray-900 border-b-2 border-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 && (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <section className="mb-16">
                <article className="bg-gray-50 rounded-2xl p-8 lg:p-12">
                  <Link href={`/${locale}/posts/${featuredPost.slug}`} className="block">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                      {featuredPost.coverImage && (
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-white">
                          <Image
                            src={featuredPost.coverImage}
                            alt={featuredPost.title}
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxQf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                            fetchPriority="high"
                          />
                        </div>
                      )}
                      <div className="space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight hover:text-gray-700 transition-colors">
                          {lang === 'en' && featuredPost.translations?.[0]?.title
                            ? featuredPost.translations[0].title
                            : featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="text-lg text-gray-600 leading-relaxed">
                            {lang === 'en' && featuredPost.translations?.[0]?.excerpt
                              ? parseExcerpt(featuredPost.translations[0].excerpt)
                              : parseExcerpt(featuredPost.excerpt)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <time>
                            {new Date(featuredPost.publishedAt!).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                          <span>•</span>
                          <span>FEATURED</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              </section>
            )}

            {/* Most Popular Section */}
            {recentPosts.length > 0 && (
              <section className="mb-16">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Most Popular</h2>
                  <Link href={`/${locale}/archive`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    VIEW ALL
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentPosts.map((post) => (
                    <article key={post.id} className="group">
                      <Link href={`/${locale}/posts/${post.slug}`} className="block">
                        <div className="space-y-3">
                          {post.coverImage && (
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                              <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                loading="lazy"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxQf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
                              {lang === 'en' && post.translations?.[0]?.title
                                ? post.translations[0].title
                                : post.title}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <time>
                                {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </time>
                              <span>•</span>
                              <span>{post.tags[0] || 'ARTICLE'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Latest Section */}
            {morePosts.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-8">Latest</h2>
                <div className="space-y-8">
                  {morePosts.map((post) => (
                    <article key={post.id} className="group">
                      <Link href={`/${locale}/posts/${post.slug}`} className="block">
                        <div className="grid md:grid-cols-3 gap-6 items-start">
                          {post.coverImage && (
                            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
                              <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                loading="lazy"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}
                          <div className="md:col-span-2 space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                              {lang === 'en' && post.translations?.[0]?.title
                                ? post.translations[0].title
                                : post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-gray-600 line-clamp-2">
                                {lang === 'en' && post.translations?.[0]?.excerpt
                                  ? parseExcerpt(post.translations[0].excerpt)
                                  : parseExcerpt(post.excerpt)}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <time>
                                {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </time>
                              <span>•</span>
                              <span>{post.tags[0] || 'ARTICLE'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <Link href={`/${locale}/archive`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700">
                    See all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No posts published yet.</p>
          </div>
        )}
      </main>

      {/* Newsletter Signup */}
      <section className="bg-gray-50 py-16 mt-20" aria-label="Newsletter signup">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cole IT AI</h2>
          <p className="text-gray-600 mb-8">
            A weekly advice column about building product, driving growth, and accelerating your career.
          </p>
          <LazyNewsletterAnalytics />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Cole IT AI</h3>
            </div>
            <div>
              <ul className="space-y-2">
                <li><Link href={`/${locale}/about`} className="text-gray-600 hover:text-gray-900">About</Link></li>
                <li><Link href={`/${locale}/archive`} className="text-gray-600 hover:text-gray-900">Archive</Link></li>
                <li><Link href={`/${locale}/recommendations`} className="text-gray-600 hover:text-gray-900">Recommendations</Link></li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2">
                <li><Link href={`/${locale}/sitemap`} className="text-gray-600 hover:text-gray-900">Sitemap</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Colemearchy • 
              <Link href={`/${locale}/privacy`} className="hover:text-gray-900 underline underline-offset-2"> Privacy</Link> • 
              <Link href={`/${locale}/terms`} className="hover:text-gray-900 underline underline-offset-2"> Terms</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
