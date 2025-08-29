'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PostEditor from '@/components/PostEditor'
import ThreadsContentGenerator from '@/components/ThreadsContentGenerator'

interface Post {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  publishedAt?: string | null
  youtubeVideoId?: string
}

interface PostFormData {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  publishedAt?: string | null
  youtubeVideoId?: string | null
}

export default function EditPostClient({ id }: { id: string }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data)
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (data: PostFormData) => {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.push('/admin')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Post</h1>
      <PostEditor initialData={post} onSubmit={handleSubmit} isEdit />
      
      {/* Threads content generator - only visible in admin */}
      <div className="mt-8">
        <ThreadsContentGenerator post={{
          title: post.title,
          excerpt: post.excerpt || null,
          content: post.content,
          tags: post.tags || [],
          slug: post.slug
        }} />
      </div>
    </div>
  )
}