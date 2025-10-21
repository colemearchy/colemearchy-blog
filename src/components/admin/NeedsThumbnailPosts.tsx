'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/components/GoogleAnalytics'
import { uploadWithRetry, validateImageFile } from '@/lib/upload-utils'

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
  postNumber: number // 실제 글 번호 (1-based, 생성일 순)
  englishTitle?: string // 영어 제목 (영어 썸네일 탭에서만 사용)
}

interface LanguageData {
  posts: Post[]
  stats: {
    total: number
    totalAvailable: number // Total non-YouTube posts in database
    byLanguage: {
      ko: number
      en: number
    }
  }
}

interface NeedsThumbnailData {
  korean: LanguageData
  english: LanguageData
}

// 이미지 미리보기 컴포넌트
function ImagePreview({ image, alt, className }: { image: File; alt: string; className: string }) {
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    const url = URL.createObjectURL(image)
    setImageUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [image])

  return <img src={imageUrl} alt={alt} className={className} />
}

export default function NeedsThumbnailPosts() {
  const [data, setData] = useState<NeedsThumbnailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>('korean')

  // 일괄 업로드 상태
  const [images, setImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 제목 복사 기능
  const copyTitle = async (title: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedId(postId)
      setTimeout(() => setCopiedId(null), 2000)
      trackEvent('copy_post_title', 'admin', title)
    } catch (err) {
      alert('복사 실패')
    }
  }

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  // 파일 처리 및 정렬
  const processFiles = (files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    // 파일명에서 숫자 추출하여 정렬
    const sortedFiles = validFiles.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0')
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0')
      return numA - numB
    })

    setImages(sortedFiles)
    trackEvent('bulk_thumbnail_select', 'admin', `${sortedFiles.length} images`)
  }

  // 일괄 썸네일 업로드
  const handleBulkUpload = async () => {
    if (!data) {
      alert('데이터를 불러오는 중입니다.')
      return
    }

    const currentPosts = activeTab === 'korean' ? data.korean.posts : data.english.posts

    if (currentPosts.length === 0) {
      alert('썸네일이 필요한 게시물이 없습니다.')
      return
    }

    if (images.length === 0) {
      alert('이미지를 선택해주세요.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const totalImages = Math.min(images.length, currentPosts.length)
      let successCount = 0

      for (let i = 0; i < totalImages; i++) {
        const image = images[i]
        const post = currentPosts[i]

        try {
          const formData = new FormData()
          formData.append('image', image)
          formData.append('postId', post.id)

          // 이미지 업로드
          const uploadResponse = await uploadWithRetry(async () => {
            return await fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData
            })
          })

          if (uploadResponse.ok) {
            const { imageUrl } = await uploadResponse.json()

            // 한글/영어 탭에 따라 다른 API 호출
            let updateResponse
            if (activeTab === 'korean') {
              // 한글 썸네일: Post.coverImage 업데이트
              updateResponse = await fetch(`/api/admin/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverImage: imageUrl })
              })
            } else {
              // 영어 썸네일: PostTranslation.coverImage 업데이트
              updateResponse = await fetch(`/api/posts/${post.id}/translation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  locale: 'en',
                  coverImage: imageUrl
                })
              })
            }

            if (updateResponse.ok) {
              successCount++
            }
          }
        } catch (error) {
          console.error(`Failed to upload thumbnail for post ${post.id}:`, error)
        }

        setUploadProgress(Math.round(((i + 1) / totalImages) * 100))
      }

      alert(`${successCount}/${totalImages}개 썸네일 업로드 완료!`)

      // 목록 새로고침
      await fetchPosts()
      setImages([])

      trackEvent('bulk_thumbnail_upload_complete', 'admin', `${activeTab}:${successCount}/${totalImages} success`)
    } catch (error) {
      console.error('Bulk upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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

  // 현재 탭의 데이터 가져오기
  const currentData = activeTab === 'korean' ? data.korean : data.english
  const currentPosts = currentData.posts
  const currentStats = currentData.stats

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts Needing Thumbnails</h2>
          <p className="mt-1 text-sm text-gray-500">
            Posts that need a cover image before publishing
          </p>
          <p className="mt-1 text-xs text-blue-600">
            💡 팁: 제목 클릭하면 복사됩니다 (피그마에서 바로 사용 가능)
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{currentStats.total}</p>
          <p className="text-sm text-gray-500">Total Posts</p>
        </div>
      </div>

      {/* 한글/영어 탭 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab('korean')
              setImages([]) // 탭 변경 시 선택된 이미지 초기화
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'korean'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🇰🇷 한글 썸네일 ({data.korean.stats.total}개)
          </button>
          <button
            onClick={() => {
              setActiveTab('english')
              setImages([]) // 탭 변경 시 선택된 이미지 초기화
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'english'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🇬🇧 영어 썸네일 ({data.english.stats.total}개)
          </button>
        </div>

        {/* Unified Ranking Explanation */}
        {activeTab === 'english' && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  📊 Unified Numbering System
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Posts are numbered chronologically across all languages ({currentStats.totalAvailable} total non-YouTube posts).
                  English translations use the <strong>same numbers</strong> as Korean originals
                  (e.g., Post #74 is always Post #74 in both languages).
                  {currentStats.totalAvailable > 0 && currentStats.total > 0 && (
                    <> Numbers may appear non-sequential (e.g., #74, #76, #78) because only {currentStats.total} of {currentStats.totalAvailable} posts have English translations.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 일괄 썸네일 업로드 섹션 */}
      {currentPosts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ 일괄 썸네일 업로드 (숫자 매칭)
          </h3>

          <div className="space-y-4">
            {/* 파일 선택 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 bg-white transition-colors"
            >
              <svg className="mx-auto h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-700 font-medium">
                피그마 이미지를 1.png, 2.png... 순서로 저장하고 한번에 업로드
              </p>
              <p className="text-xs text-gray-500 mt-1">
                파일명 숫자와 글 순서가 자동 매칭됩니다
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* 선택된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">
                    선택된 이미지: {images.length}개 (상위 {Math.min(images.length, currentPosts.length)}개 글에 매칭)
                  </p>
                  <button
                    onClick={() => setImages([])}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    전체 삭제
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto bg-white p-2 rounded">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <ImagePreview
                        image={image}
                        alt={image.name}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-1 rounded-br font-bold">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="text-xs text-center truncate mt-0.5">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBulkUpload}
                  disabled={isUploading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isUploading ? `업로드 중... ${uploadProgress}%` : '일괄 업로드 시작'}
                </button>

                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 사용 방법 */}
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">사용 방법:</p>
              <ol className="text-xs text-blue-800 space-y-0.5 list-decimal list-inside">
                <li>제목 클릭으로 복사 → 피그마에서 썸네일 디자인</li>
                <li>피그마에서 1.png, 2.png... 순서대로 저장</li>
                <li>모든 이미지 한번에 선택 → 자동 매칭 업로드</li>
                <li>이미지 개수가 글보다 적으면 상위 글만 업데이트</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Language Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Korean Original
          </h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {currentStats.byLanguage.ko}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            English Original
          </h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {currentStats.byLanguage.en}
          </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'korean' ? '한글 썸네일 필요' : '영어 썸네일 필요'}
          </h3>
        </div>

        {currentPosts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg">All posts have thumbnails! 🎉</p>
            <p className="mt-2 text-sm">No action needed at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentPosts.map((post, index) => (
              <div key={post.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold cursor-help group relative"
                        title={activeTab === 'english' ? `Global rank #${post.postNumber} of ${currentStats.totalAvailable} total posts` : `Post #${post.postNumber}`}
                      >
                        {post.postNumber}
                        {activeTab === 'english' && (
                          <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            Global rank #{post.postNumber} of {currentStats.totalAvailable}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-col gap-1">
                        <h4
                          onClick={() => copyTitle(activeTab === 'english' && post.englishTitle ? post.englishTitle : post.title, post.id)}
                          className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors relative group"
                        >
                          {activeTab === 'english' && post.englishTitle ? post.englishTitle : post.title}
                          <span className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedId === post.id ? '✓ 복사됨!' : '📋 클릭하여 복사'}
                          </span>
                        </h4>
                        {activeTab === 'english' && post.englishTitle && (
                          <p className="text-sm text-gray-500">원본: {post.title}</p>
                        )}
                      </div>
                    </div>
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
                      {activeTab === 'korean' ? '한글 썸네일 추가' : '영어 썸네일 추가'}
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