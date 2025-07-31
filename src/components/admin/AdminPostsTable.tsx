'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Post {
  id: string
  title: string
  slug: string
  publishedAt: Date | null
  views: number
  coverImage: string | null
}

interface AdminPostsTableProps {
  posts: Post[]
}

export function AdminPostsTable({ posts: initialPosts }: AdminPostsTableProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null)

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    
    const sortedPosts = [...posts].reverse()
    setPosts(sortedPosts)
  }

  const handleCopyTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedTitle(title)
      setTimeout(() => setCopiedTitle(null), 2000)
    } catch (err) {
      console.error('Failed to copy title:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
        <p className="mt-1 text-sm text-gray-500">
          총 {posts.length}개 게시물 (발행일 순서대로 정렬)
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 border-r">
                <button
                  onClick={handleSort}
                  className="group flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <span>번호</span>
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {sortOrder === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                이미지
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                제목
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                상태
              </th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                조회수
              </th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {posts.map((post, index) => {
              const postNumber = sortOrder === 'asc' ? index + 1 : posts.length - index
              
              return (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-4 text-sm font-bold text-gray-900 border-r">
                    {postNumber}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {post.coverImage ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900">
                    <div className="relative group">
                      <button
                        onClick={() => handleCopyTitle(post.title)}
                        className="font-medium line-clamp-2 text-left hover:text-indigo-600 transition-colors cursor-pointer"
                        title="클릭하여 복사"
                      >
                        {post.title}
                      </button>
                      {copiedTitle === post.title && (
                        <span className="absolute -top-8 left-0 bg-gray-800 text-white text-xs rounded px-2 py-1">
                          복사됨!
                        </span>
                      )}
                      <span className="absolute -top-8 left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        클릭하여 복사
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    {post.publishedAt ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        발행됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                        초안
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 text-center font-medium">
                    {post.views}
                  </td>
                  <td className="px-3 py-4 text-sm text-center">
                    <Link 
                      href={`/admin/edit/${post.id}`} 
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}