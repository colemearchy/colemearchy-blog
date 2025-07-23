import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// generateStaticParams를 제거하고 동적 렌더링으로 변경
// 빌드 시점에 데이터베이스 접근을 방지
export const dynamic = 'force-dynamic'

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
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
  })

  if (!post || !post.publishedAt) {
    notFound()
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'Colemearchy Blog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Colemearchy Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <span>{post.views} views</span>
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
            <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

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