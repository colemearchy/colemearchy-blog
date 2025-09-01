'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PostEditor from '@/components/PostEditor'
import ThreadsContentGenerator from '@/components/ThreadsContentGenerator'
import TranslationEditor from '@/components/TranslationEditor'

interface Translation {
  id: string
  locale: string
  title: string
  content: string
  excerpt?: string | null
  coverImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

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
  originalLanguage?: string
  translations?: Translation[]
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
  const [activeTab, setActiveTab] = useState<'ko' | 'en'>('ko')
  const [isTranslating, setIsTranslating] = useState(false)

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
      alert('저장이 완료되었습니다!')
      router.push('/admin')
    } else {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!post) {
    return <div>Post not found</div>
  }

  const hasEnglishTranslation = post.translations?.some(t => t.locale === 'en')
  const hasKoreanTranslation = post.translations?.some(t => t.locale === 'ko')
  const englishTranslation = post.translations?.find(t => t.locale === 'en')
  const koreanTranslation = post.translations?.find(t => t.locale === 'ko')
  
  const isOriginalKorean = post.originalLanguage === 'ko'
  const isOriginalEnglish = post.originalLanguage === 'en'
  
  // 원본 언어에 따라 초기 탭 설정
  useEffect(() => {
    if (post.originalLanguage) {
      setActiveTab(post.originalLanguage as 'ko' | 'en')
    }
  }, [post.originalLanguage])
  
  const needsKoreanTranslation = isOriginalEnglish && !hasKoreanTranslation
  const needsEnglishTranslation = isOriginalKorean && !hasEnglishTranslation
  const targetLang = isOriginalEnglish ? 'ko' : 'en'
  const targetLangName = isOriginalEnglish ? '한국어' : '영어'

  const handleTranslate = async () => {
    const needsTranslation = isOriginalEnglish ? needsKoreanTranslation : needsEnglishTranslation
    if (!needsTranslation) {
      alert(`이미 ${targetLangName} 번역이 있습니다.`)
      return
    }

    if (!confirm(`이 포스트를 ${targetLangName}로 번역하시겠습니까?`)) {
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
          postIds: [id],
          targetLang
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const successCount = result.results?.filter((r: any) => r.status === 'success').length || 0
        const errorCount = result.results?.filter((r: any) => r.status === 'error').length || 0
        
        if (successCount > 0) {
          alert('번역이 완료되었습니다!')
          // Refresh the page to show the translation
          window.location.reload()
        } else if (errorCount > 0) {
          const errorMessages = result.results
            ?.filter((r: any) => r.status === 'error')
            .map((r: any) => r.message)
            .join('\n')
          throw new Error(errorMessages || 'Translation failed')
        }
      } else {
        throw new Error(result.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Error translating post:', error)
      if (error instanceof Error) {
        alert(`번역 중 오류가 발생했습니다:\n${error.message}`)
      } else {
        alert('번역 중 오류가 발생했습니다.')
      }
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 -ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            목록으로
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Post</h1>
          
          {/* 원본 언어 태그 */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isOriginalKorean ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {isOriginalKorean ? '🇰🇷 한국어 원본' : '🇬🇧 영어 원본'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 언어 탭 */}
          <div className="flex rounded-lg shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveTab('ko')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                activeTab === 'ko'
                  ? 'bg-indigo-600 text-white border-indigo-600 z-10'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              한국어 🇰🇷
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l-0 border ${
                activeTab === 'en'
                  ? 'bg-indigo-600 text-white border-indigo-600 z-10'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              English 🇬🇧
            </button>
          </div>
          
          {/* 번역 버튼 - 현재 탭에 따라 표시 */}
          {((activeTab === 'ko' && isOriginalEnglish && !hasKoreanTranslation) ||
            (activeTab === 'en' && isOriginalKorean && !hasEnglishTranslation)) && (
            <button
              onClick={handleTranslate}
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
                `${activeTab === 'ko' ? '한국어' : '영어'}로 번역하기`
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* 원본 언어의 탭에서는 PostEditor, 번역 언어의 탭에서는 TranslationEditor */}
      {(activeTab === 'ko' && isOriginalKorean) || (activeTab === 'en' && isOriginalEnglish) ? (
        <PostEditor initialData={post} onSubmit={handleSubmit} isEdit />
      ) : (
        <div>
          {/* 번역 편집기 또는 번역 버튼 */}
          {(activeTab === 'ko' && hasKoreanTranslation) || (activeTab === 'en' && hasEnglishTranslation) ? (
            <TranslationEditor
              postId={id}
              translation={activeTab === 'ko' ? (koreanTranslation || null) : (englishTranslation || null)}
              locale={activeTab}
              onSave={() => window.location.reload()}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">
                {activeTab === 'ko' ? '한국어' : '영어'} 번역이 아직 없습니다.
              </p>
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {isTranslating ? '번역 중...' : '지금 번역하기'}
              </button>
            </div>
          )}
        </div>
      )}
      
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