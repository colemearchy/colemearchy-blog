import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'
import YouTubeThumbnail from '@/components/YouTubeThumbnail'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPostBySlug, getPostComments } from '@/lib/optimized-queries'
import LazyBlogPostAnalytics from '@/components/LazyBlogPostAnalytics'
import MarkdownContent from '@/components/MarkdownContent'
import RelatedPosts from '@/components/RelatedPosts'
import TableOfContents from '@/components/TableOfContents'
import Breadcrumb from '@/components/Breadcrumb'
import YouTubeEmbed from '@/components/YouTubeEmbed'
import LazyCommentSection from '@/components/LazyCommentSection'
import { LazyAdSense } from '@/components/LazyAdSense'
import { CoupangBannerMidContent, CoupangBannerEndPost } from '@/components/CoupangBanner'
import { calculateReadingTime, formatReadingTime } from '@/lib/reading-time'
import ViewCounter from '@/components/ViewCounter'
import { navigationItems } from '@/lib/navigation'
import { shouldUseNextImage } from '@/lib/image-utils'
import { tagsToArray } from '@/lib/utils/tags'

interface PostPageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Temporarily use dynamic rendering to avoid DB quota issues during build
export const dynamic = 'force-dynamic'
// Will revert to static generation once DB quota is resolved:
// export const dynamic = 'force-static'
// export const dynamicParams = true
// export const revalidate = 3600 // 1 hour ISR

// Temporarily disabled to avoid DB quota issues during build
/*
export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null
          // 🔧 HOTFIX: Remove lte condition to include all published posts
          // lte: new Date()
        }
      },
      select: {
        slug: true
      }
    })

    if (posts.length === 0) {
      console.warn('⚠️ [generateStaticParams] No posts found for static generation!')
      return []
    }

    const locales = ['ko', 'en']
    const params = posts.flatMap((post) =>
      locales.map((locale) => ({
        slug: post.slug,
        locale,
      }))
    )

    return params
  } catch (error) {
    console.error('❌ [generateStaticParams] Error:', error)
    return []
  }
}
*/

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  try {
    const { slug: rawSlug, locale } = await params
    // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
    const slug = decodeURIComponent(rawSlug)
    const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      translations: {
        where: {
          locale: locale === 'en' ? 'en' : 'ko'
        }
      }
    }
  })

  if (!post || !post.publishedAt) {
    return {
      title: 'Post Not Found',
    }
  }

  // Parse content if it's in JSON format
  let content = post.content
  
  // Check if content starts with ```json block
  if (content.startsWith('```json')) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.content) {
          content = parsed.content
        }
      } catch (e) {
        console.error('Failed to parse JSON block:', e)
      }
    }
  } else {
    // Try direct JSON parse
    try {
      const parsed = JSON.parse(post.content)
      if (parsed.content) {
        content = parsed.content
      }
    } catch (e) {
      // Content is already in markdown format
    }
  }

  const readingTime = calculateReadingTime(content)
  
  // Use translated content if available
  const translation = post.translations?.[0]
  const displayTitle = locale === 'en' && translation?.title ? translation.title : post.title
  const displayExcerpt = locale === 'en' && translation?.excerpt ? translation.excerpt : post.excerpt
  const displayCoverImage = translation?.coverImage || post.coverImage
  
  const ogImageUrl = displayCoverImage ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(displayTitle)}&author=${encodeURIComponent(post.author || 'Cole IT AI')}&date=${encodeURIComponent(new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`

  return {
    title: post.seoTitle || displayTitle,
    description: post.seoDescription || displayExcerpt || undefined,
    alternates: {
      languages: {
        'ko': `/ko/posts/${post.slug}`,
        'en': `/en/posts/${post.slug}`,
      }
    },
    openGraph: {
      title: post.seoTitle || displayTitle,
      description: post.seoDescription || displayExcerpt || undefined,
      type: 'article',
      publishedTime: new Date(post.publishedAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      tags: post.tags,
      images: [{ url: ogImageUrl }],
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || displayTitle,
      description: post.seoDescription || displayExcerpt || undefined,
      images: [ogImageUrl],
    },
  }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Post - Colemearchy Blog',
      description: 'Blog post content unavailable'
    }
  }
}

export default async function PostPage({
  params
}: PostPageProps) {
  try {
    const { slug: rawSlug, locale } = await params
    const lang = locale === 'en' ? 'en' : 'ko'

    // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
    const slug = decodeURIComponent(rawSlug)

    const post = await getPostBySlug(slug)

  if (!post || !post.publishedAt || post.status !== 'PUBLISHED') {
    console.warn('⚠️ [PostPage] Post not found or not published, returning 404')
    notFound()
  }
  
  // Check if post is scheduled for future
  if (post.publishedAt > new Date()) {
    notFound()
  }

  // View count is now tracked client-side via ViewCounter component
  
  // Use translated content if available
  const translation = post.translations?.find(t => t.locale === lang)
  const displayTitle = lang === 'en' && translation?.title ? translation.title : post.title
  const displayContent = lang === 'en' && translation?.content ? translation.content : post.content
  const displayExcerpt = lang === 'en' && translation?.excerpt ? translation.excerpt : post.excerpt
  
  // Parse content if it's in JSON format
  let content = displayContent
  
  // Check if content starts with ```json block
  if (content.startsWith('```json')) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.content) {
          content = parsed.content
        }
      } catch (e) {
        console.error('Failed to parse JSON block:', e)
      }
    }
  } else {
    // Try direct JSON parse
    try {
      const parsed = JSON.parse(post.content)
      if (parsed.content) {
        content = parsed.content
      }
    } catch (e) {
      // Content is already in markdown format
    }
  }
  
  // Calculate reading time
  const readingTime = calculateReadingTime(content)
  const youtubeVideoId = extractYouTubeVideoId(post.youtubeVideoId || '')
  
  // Fetch comments separately (no caching for dynamic data)
  const comments = await getPostComments(post.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || 'Colemearchy')}&date=${encodeURIComponent(new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'Cole IT AI',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cole IT AI',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${post.slug}`,
    },
    keywords: tagsToArray(post.tags).join(', '),
    articleSection: tagsToArray(post.tags)[0] || 'Blog',
    wordCount: content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
    inLanguage: lang === 'en' ? 'en-US' : 'ko-KR',
  }
  
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Posts',
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/posts`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${post.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <div className="min-h-screen bg-white">
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-100">
            <div className="flex justify-between items-center py-8">
              <Link href={`/${locale}`} className="text-3xl font-serif italic">
                Cole IT AI
              </Link>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/ko/posts/${slug}`}
                  className={`px-3 py-1 rounded font-medium whitespace-nowrap ${lang === 'ko' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  KOR
                </Link>
                <Link
                  href={`/en/posts/${slug}`}
                  className={`px-3 py-1 rounded font-medium whitespace-nowrap ${lang === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                    item.href === '/posts' 
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full overflow-x-hidden">
          <div className="xl:flex xl:gap-8">
            <article className="xl:flex-1 max-w-4xl mx-auto xl:mx-0">
              <Breadcrumb postTitle={displayTitle} postSlug={post.slug} />
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayTitle}</h1>
                <div className="flex items-center text-gray-600 space-x-4">
                  <time dateTime={new Date(post.publishedAt).toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span>{formatReadingTime(readingTime)}</span>
                  <span>•</span>
                  <ViewCounter postId={post.id} initialViews={post.views} />
                  {post.author && (
                    <>
                      <span>•</span>
                      <span>By {post.author}</span>
                    </>
                  )}
                </div>
            {tagsToArray(post.tags).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tagsToArray(post.tags).map((tag: string) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="relative w-full max-w-4xl mb-8 rounded-lg overflow-hidden bg-gray-100">
              <div className="relative aspect-[16/9] w-full">
                {(() => {
                  const isYouTubeThumbnail = post.coverImage.includes('ytimg.com') || post.coverImage.includes('img.youtube.com')
                  const youtubeVideoIdMatch = post.coverImage.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
                  const youtubeVideoId = youtubeVideoIdMatch ? youtubeVideoIdMatch[1] : null

                  if (isYouTubeThumbnail && youtubeVideoId) {
                    return (
                      <YouTubeThumbnail
                        videoId={youtubeVideoId}
                        alt={displayTitle}
                        fill
                        className="object-contain bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }

                  // Use conditional rendering based on image source to avoid 402 Payment Required errors
                  if (shouldUseNextImage(post.coverImage)) {
                    return (
                      <Image
                        src={post.coverImage}
                        alt={displayTitle}
                        fill
                        className="object-cover bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }

                  // Use regular img tag for Vercel Blob Storage and other problematic images
                  return (
                    <img
                      src={post.coverImage}
                      alt={displayTitle}
                      className="absolute inset-0 w-full h-full object-cover bg-gray-100"
                      loading="eager"
                    />
                  )
                })()}
              </div>
            </div>
          )}
          
          {post.youtubeVideoId && (
            <YouTubeEmbed 
              videoId={post.youtubeVideoId} 
              title={post.title}
            />
          )}

              {/* First Ad - After header, before content */}
              <div className="my-8">
                <LazyAdSense slot="8561234146" />
              </div>

              {(() => {
                // Check if content is long enough (500+ characters) to insert mid-content ad
                const shouldInsertMidAd = content.length >= 500

                if (!shouldInsertMidAd) {
                  // Short content - render normally without mid-content ad
                  return <MarkdownContent content={content} />
                }

                // Split content into paragraphs
                const paragraphs = content.split('\n\n')

                // Find mid-point by character count (aim for ~50% through content)
                let charCount = 0
                const midPoint = content.length / 2
                let splitIndex = Math.floor(paragraphs.length / 2) // fallback to middle paragraph

                for (let i = 0; i < paragraphs.length; i++) {
                  charCount += paragraphs[i].length + 2 // +2 for \n\n
                  if (charCount >= midPoint) {
                    splitIndex = i
                    break
                  }
                }

                // Split content at mid-point
                const firstHalf = paragraphs.slice(0, splitIndex).join('\n\n')
                const secondHalf = paragraphs.slice(splitIndex).join('\n\n')

                return (
                  <>
                    <MarkdownContent content={firstHalf} />

                    {/* Mid-content Ad - Only for content 500+ chars */}
                    <div className="my-8">
                      <LazyAdSense slot="8561234146" />
                    </div>

                    {/* Coupang Dynamic Banner - Mid Content */}
                    <CoupangBannerMidContent />

                    <MarkdownContent content={secondHalf} />
                  </>
                )
              })()}

              {/* Second Ad - After content, before comments */}
              <div className="my-12">
                <LazyAdSense slot="8561234146" />
              </div>

              {/* Coupang Dynamic Banner - End of Post (Carousel) */}
              <CoupangBannerEndPost />

              <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded mt-8" />}>
                <LazyCommentSection postSlug={post.slug} locale={locale} />
              </Suspense>
              
              <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded mt-8" />}>
                <RelatedPosts postId={post.id} />
              </Suspense>

              <Suspense fallback={null}>
                <LazyBlogPostAnalytics 
                  title={post.title} 
                  slug={post.slug} 
                  author={post.author || undefined}
                  tags={tagsToArray(post.tags)}
                />
              </Suspense>
            </article>
            
            <aside className="hidden xl:block">
              <TableOfContents content={content} />
              {/* Sidebar Ad - Sticky ad below table of contents */}
              <div className="mt-8 sticky top-24">
                <LazyAdSense slot="8561234146" style={{ minHeight: '300px' }} />
              </div>
            </aside>
          </div>
        </div>

        <footer className="bg-gray-50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Cole IT AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
  } catch (error) {
    console.error('Error loading post page:', error)

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

    // For other errors, show 404
    notFound()
  }
}