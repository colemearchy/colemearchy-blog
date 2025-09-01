'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Translation {
  locale: string
  title: string
}

interface Post {
  id: string
  title: string
  slug: string
  publishedAt: Date | null
  views: number
  coverImage: string | null
  translations?: Translation[]
}

interface AdminPostsTableProps {
  posts: Post[]
}

export function AdminPostsTable({ posts: initialPosts }: AdminPostsTableProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [languageFilter, setLanguageFilter] = useState<'all' | 'ko' | 'en' | 'no-en'>('all')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isTranslating, setIsTranslating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/posts?orderBy=publishedAt&order=asc')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleCopyUrl = async (slug: string) => {
    try {
      const url = `https://colemearchy.com/posts/${slug}`
      await navigator.clipboard.writeText(url)
      setCopiedUrl(slug)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('정말로 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setDeletingPostId(postId)
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Remove the post from the local state
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('글 삭제에 실패했습니다.')
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)))
    }
  }

  const handleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const handleBulkTranslate = async () => {
    if (selectedPosts.size === 0) {
      alert('번역할 포스트를 선택해주세요.')
      return
    }

    if (!confirm(`${selectedPosts.size}개의 포스트를 영어로 번역하시겠습니까?`)) {
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch('/api/admin/translate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postIds: Array.from(selectedPosts)
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const successCount = result.results.filter((r: any) => r.status === 'success').length
        const skippedCount = result.results.filter((r: any) => r.status === 'skipped').length
        const errorCount = result.results.filter((r: any) => r.status === 'error').length
        
        alert(`번역 완료!\n성공: ${successCount}개\n이미 번역됨: ${skippedCount}개\n실패: ${errorCount}개`)
        
        // Refresh posts
        await fetchPosts()
        setSelectedPosts(new Set())
      } else {
        throw new Error(result.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Error translating posts:', error)
      alert('번역 중 오류가 발생했습니다.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Filter posts based on language
  const filteredPosts = posts.filter(post => {
    if (languageFilter === 'all') return true
    if (languageFilter === 'ko') return true // All posts are in Korean by default
    if (languageFilter === 'en') return post.translations?.some(t => t.locale === 'en')
    if (languageFilter === 'no-en') return !post.translations?.some(t => t.locale === 'en')
    return true
  })

  const postsWithoutEnglish = posts.filter(post => !post.translations?.some(t => t.locale === 'en'))

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
            <p className="mt-1 text-sm text-gray-500">
              총 {posts.length}개 게시물 중 {filteredPosts.length}개 표시
              {postsWithoutEnglish.length > 0 && (
                <span className="text-orange-600 font-medium">
                  {' '}(영어 번역 필요: {postsWithoutEnglish.length}개)
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 언어 필터 */}
            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value as any)
                setSelectedPosts(new Set())
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">모든 언어</option>
              <option value="ko">한국어만</option>
              <option value="en">영어 번역 있음</option>
              <option value="no-en">영어 번역 없음</option>
            </select>
            
            {/* 일괄 번역 버튼 */}
            {languageFilter === 'no-en' && selectedPosts.size > 0 && (
              <button
                onClick={handleBulkTranslate}
                disabled={isTranslating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    번역 중...
                  </>
                ) : (
                  <>영어로 번역 ({selectedPosts.size}개)</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {(languageFilter === 'no-en' || languageFilter === 'all') && (
                <th className="w-4 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
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
                번역
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
            {filteredPosts.map((post, index) => {
              const postNumber = sortOrder === 'asc' ? index + 1 : filteredPosts.length - index
              const hasEnglishTranslation = post.translations?.some(t => t.locale === 'en')
              
              return (
                <tr key={post.id} className="hover:bg-gray-50">
                  {(languageFilter === 'no-en' || languageFilter === 'all') && (
                    <td className="px-3 py-4">
                      {!hasEnglishTranslation && (
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post.id)}
                          onChange={() => handleSelectPost(post.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      )}
                    </td>
                  )}
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
                  <td className="px-3 py-4 text-sm text-center">
                    <div className="flex justify-center gap-1">
                      <span className="text-sm" title="한국어">🇰🇷</span>
                      {hasEnglishTranslation ? (
                        <span className="text-sm" title="영어 번역 있음">🇬🇧</span>
                      ) : (
                        <span className="text-sm text-gray-300" title="영어 번역 없음">🇬🇧</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 text-center font-medium">
                    {post.views}
                  </td>
                  <td className="px-3 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-3">
                      {/* 미리보기 */}
                      <Link 
                        href={`/posts/${post.slug}`} 
                        target="_blank"
                        className="text-gray-600 hover:text-gray-900 font-medium"
                        title="미리보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      
                      {/* URL 복사 */}
                      <button
                        onClick={() => handleCopyUrl(post.slug)}
                        className="relative text-gray-600 hover:text-gray-900"
                        title="URL 복사"
                      >
                        {copiedUrl === post.slug ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </button>
                      
                      {/* 수정 */}
                      <Link 
                        href={`/admin/edit/${post.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      
                      {/* 삭제 */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingPostId === post.id}
                        className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                        title="삭제"
                      >
                        {deletingPostId === post.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
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