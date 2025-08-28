'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { extractContentFromDescription } from '@/lib/youtube'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  url: string
}

export default function YouTubeManagerPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const fetchVideos = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/youtube/videos?limit=20')
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data = await response.json()
      setVideos(data)
    } catch (err) {
      setError('YouTube API 키를 설정해주세요. YOUTUBE_API_SETUP.md 파일을 확인하세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createPostFromVideo = async (video: YouTubeVideo) => {
    setIsCreating(true)
    
    try {
      // YouTube 설명에서 콘텐츠 추출
      const lines = video.description.split('\n').filter((line: string) => line.trim())
      const excerpt = lines.slice(0, 3).join(' ').substring(0, 200)
      const hashtags = (video.description.match(/#\w+/g) || []).map((tag: string) => tag.slice(1)).slice(0, 5)
      const content = video.description
      
      // 마크다운 콘텐츠 생성
      const postContent = `## ${video.title}

${content}

---

### Watch the Video

This post is based on our YouTube video. Watch it for more details!

---

*Originally published on YouTube: ${new Date(video.publishedAt).toLocaleDateString()}*`

      const postData = {
        title: video.title,
        slug: video.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        content: postContent,
        excerpt: excerpt || video.title,
        coverImage: video.thumbnailUrl,
        youtubeVideoId: video.id,
        tags: hashtags.length > 0 ? hashtags : ['youtube', 'video'],
        publishedAt: new Date().toISOString(),
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      router.push('/admin')
    } catch (err) {
      console.error('Error creating post:', err)
      alert('포스트 생성 실패')
    } finally {
      setIsCreating(false)
      setSelectedVideo(null)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">YouTube 동영상 관리</h1>
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로딩중...' : '새로고침'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && !videos.length ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    포스트 생성
                  </button>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    보기
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 포스트 생성 확인 모달 */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">포스트 생성 확인</h2>
            <p className="mb-6">
              "{selectedVideo.title}" 동영상으로 블로그 포스트를 생성하시겠습니까?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={isCreating}
              >
                취소
              </button>
              <button
                onClick={() => createPostFromVideo(selectedVideo)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isCreating}
              >
                {isCreating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}