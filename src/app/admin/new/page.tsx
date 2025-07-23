'use client'

import { useRouter } from 'next/navigation'
import PostEditor from '@/components/PostEditor'

export default function NewPostPage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.push('/admin')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Post</h1>
      <PostEditor onSubmit={handleSubmit} />
    </div>
  )
}