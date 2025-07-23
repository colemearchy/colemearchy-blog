'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface PostEditorProps {
  initialData?: {
    title: string
    slug: string
    content: string
    excerpt?: string
    coverImage?: string
    tags?: string[]
    seoTitle?: string
    seoDescription?: string
    publishedAt?: string | null
  }
  onSubmit: (data: any) => Promise<void>
  isEdit?: boolean
}

export default function PostEditor({ initialData, onSubmit, isEdit = false }: PostEditorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    coverImage: initialData?.coverImage || '',
    tags: initialData?.tags?.join(', ') || '',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    publishedAt: initialData?.publishedAt || null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKeywords, setAiKeywords] = useState('')
  const [affiliateProducts, setAffiliateProducts] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      })
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setFormData({ ...formData, slug })
  }

  const generateWithAI = async () => {
    if (!aiPrompt) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          keywords: aiKeywords.split(',').map(k => k.trim()).filter(Boolean),
          affiliateProducts: affiliateProducts.split(',').map(p => p.trim()).filter(Boolean)
        }),
      })
      
      const data = await response.json()
      
      // Handle structured response
      if (data.title) {
        setFormData({
          ...formData,
          title: data.title || formData.title,
          slug: data.slug || formData.slug,
          content: data.content || '',
          excerpt: data.excerpt || formData.excerpt,
          tags: data.tags?.join(', ') || formData.tags,
          seoTitle: data.seoTitle || data.title || formData.seoTitle,
          seoDescription: data.seoDescription || data.excerpt || formData.seoDescription,
        })
      } else if (data.content) {
        setFormData({ ...formData, content: data.content })
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={generateSlug}
            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
          >
            Generate
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
          Cover Image URL
        </label>
        <input
          type="url"
          id="coverImage"
          value={formData.coverImage}
          onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          AI Content Generation
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="ai-topic" className="block text-sm font-medium text-gray-700">
              Topic & Tone
            </label>
            <input
              type="text"
              id="ai-topic"
              placeholder="e.g., My brutally honest Wegovy review after 6 months"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="ai-keywords" className="block text-sm font-medium text-gray-700">
              Target Keywords (comma-separated)
            </label>
            <input
              type="text"
              id="ai-keywords"
              placeholder="e.g., wegovy review, wegovy side effects, weight loss"
              value={aiKeywords}
              onChange={(e) => setAiKeywords(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="affiliate-products" className="block text-sm font-medium text-gray-700">
              Affiliate Products (comma-separated, optional)
            </label>
            <input
              type="text"
              id="affiliate-products"
              placeholder="e.g., MyFitnessPal Premium, Withings Scale"
              value={affiliateProducts}
              onChange={(e) => setAffiliateProducts(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <button
            type="button"
            onClick={generateWithAI}
            disabled={isGenerating || !aiPrompt}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? 'Generating SEO-Optimized Content...' : 'Generate with AI'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <MDEditor
          value={formData.content}
          onChange={(val) => setFormData({ ...formData, content: val || '' })}
          height={400}
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
            SEO Title
          </label>
          <input
            type="text"
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
            SEO Description
          </label>
          <input
            type="text"
            id="seoDescription"
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!!formData.publishedAt}
            onChange={(e) => setFormData({ 
              ...formData, 
              publishedAt: e.target.checked ? new Date().toISOString() : null 
            })}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>
  )
}