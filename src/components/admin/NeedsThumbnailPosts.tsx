'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  createdAt: string
  updatedAt: string
  tags: string[]
  status: string
  originalLanguage: string
  views: number
}

interface NeedsThumbnailData {
  posts: Post[]
  stats: {
    total: number
    byLanguage: {
      ko: number
      en: number
    }
  }
}

export default function NeedsThumbnailPosts() {
  const [data, setData] = useState<NeedsThumbnailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/posts/needs-thumbnail')
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading posts: {error}
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts Needing Thumbnails</h2>
          <p className="mt-1 text-sm text-gray-500">
            Draft posts that need a cover image before publishing
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
          <p className="text-sm text-gray-500">Total Posts</p>
        </div>
      </div>

      {/* Language Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Korean Posts
          </h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.stats.byLanguage.ko}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            English Posts
          </h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {data.stats.byLanguage.en}
          </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Posts</h3>
        </div>
        
        {data.posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg">All posts have thumbnails! 🎉</p>
            <p className="mt-2 text-sm">No action needed at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.posts.map((post) => (
              <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {post.title}
                    </h4>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Language: {post.originalLanguage.toUpperCase()}</span>
                      <span>•</span>
                      <span>Views: {post.views}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>Tags: {post.tags.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Thumbnail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchPosts}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}