import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // 동적 렌더링으로 변경
export const revalidate = 3600 // Revalidate every hour

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  tags: string[]
}

export default async function HomePage() {
  const posts: Post[] = await prisma.post.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      tags: true,
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-xl font-medium tracking-tight text-gray-900">
              Colemearchy
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Text */}
          <div className="mb-20">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
              Thoughts on technology,<br />philosophy, and life
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              A collection of essays exploring the intersection of modern tech, ancient wisdom, and the human experience.
            </p>
          </div>

          {/* Posts Grid - Minimal Card Design */}
          {posts.length > 0 && (
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/posts/${post.slug}`} className="block">
                    {/* Image */}
                    {post.coverImage && (
                      <div className="relative aspect-[16/10] mb-5 overflow-hidden bg-gray-50">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="space-y-3">
                      {/* Date */}
                      <time className="text-xs text-gray-500 uppercase tracking-wider">
                        {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      
                      {/* Title */}
                      <h2 className="text-xl font-medium text-gray-900 leading-tight group-hover:text-gray-600 transition-colors">
                        {post.title}
                      </h2>
                      
                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      
                      {/* Tags - Minimal Style */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-gray-500">
                              #{tag.toLowerCase().replace(/\s+/g, '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500">No posts published yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Colemearchy
            </p>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="/rss" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">RSS</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
