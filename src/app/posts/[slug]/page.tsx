import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'
import YouTubeThumbnail from '@/components/YouTubeThumbnail'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BlogPostAnalytics } from '@/components/BlogPostAnalytics'
import MarkdownContent from '@/components/MarkdownContent'
import RelatedPosts from '@/components/RelatedPosts'
import TableOfContents from '@/components/TableOfContents'
import Breadcrumb from '@/components/Breadcrumb'
import YouTubeEmbed from '@/components/YouTubeEmbed'
import CommentSection from '@/components/comments/CommentSection'
import { calculateReadingTime, formatReadingTime } from '@/lib/reading-time'
import ViewCounter from '@/components/ViewCounter'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// Static generation for better performance
export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: new Date()
        }
      },
      select: {
        slug: true
      }
    })
    
    return posts.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
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
  
  const ogImageUrl = post.coverImage || 
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || 'Colemearchy')}&date=${encodeURIComponent(post.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(post.tags.join(','))}`

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: [ogImageUrl],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
  })

  if (!post || !post.publishedAt || post.status !== 'PUBLISHED') {
    notFound()
  }
  
  // Check if post is scheduled for future
  if (post.publishedAt > new Date()) {
    notFound()
  }

  // View count is now tracked client-side via ViewCounter component
  
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
  
  // Calculate reading time
  const readingTime = calculateReadingTime(content)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || 'Colemearchy')}&date=${encodeURIComponent(post.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(post.tags.join(','))}`,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'Colemearchy Blog',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Colemearchy Blog',
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
    keywords: post.tags.join(', '),
    articleSection: post.tags[0] || 'Blog',
    wordCount: content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
    inLanguage: 'ko-KR',
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
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-3xl font-bold text-gray-900">
                Colemearchy Blog
              </Link>
              <nav>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 ml-6">About</Link>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 ml-6">Contact</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex gap-8">
            <article className="flex-1 max-w-4xl">
              <Breadcrumb postTitle={post.title} postSlug={post.slug} />
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
                <div className="flex items-center text-gray-600 space-x-4">
                  <time dateTime={post.publishedAt.toISOString()}>
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
            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="relative w-full mb-8 rounded-lg overflow-hidden">
              <div className="relative aspect-[16/9]">
                {(() => {
                  const isYouTubeThumbnail = post.coverImage.includes('ytimg.com') || post.coverImage.includes('img.youtube.com')
                  const youtubeVideoIdMatch = post.coverImage.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
                  const youtubeVideoId = youtubeVideoIdMatch ? youtubeVideoIdMatch[1] : null
                  
                  if (isYouTubeThumbnail && youtubeVideoId) {
                    return (
                      <YouTubeThumbnail
                        videoId={youtubeVideoId}
                        alt={post.title}
                        fill
                        className="object-contain bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }
                  
                  return (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-contain bg-gray-100"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
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

              <MarkdownContent content={content} />
              
              <CommentSection postSlug={post.slug} />
              
              <RelatedPosts postId={post.id} />

              <BlogPostAnalytics 
                title={post.title} 
                slug={post.slug} 
                author={post.author || undefined}
                tags={post.tags}
              />
            </article>
            
            <aside className="hidden xl:block">
              <TableOfContents content={content} />
            </aside>
          </div>
        </div>

        <footer className="bg-gray-50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Colemearchy Blog. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}