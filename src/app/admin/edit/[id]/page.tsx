'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PostEditor from '@/components/PostEditor'

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data)
        setLoading(false)
      })
  }, [params.id])

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/posts/${params.id}`, {
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Post</h1>
      <PostEditor initialData={post} onSubmit={handleSubmit} isEdit />
    </div>
  )
}