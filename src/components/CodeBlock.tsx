'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'prismjs/themes/prism-tomorrow.css'

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

// Dynamically import Prism to reduce initial bundle size
const loadPrism = () => import('prismjs')

// Map of supported languages and their imports
const languageLoaders: Record<string, () => Promise<any>> = {
  javascript: () => import('prismjs/components/prism-javascript'),
  typescript: () => import('prismjs/components/prism-typescript'),
  jsx: () => import('prismjs/components/prism-jsx'),
  tsx: () => import('prismjs/components/prism-tsx'),
  css: () => import('prismjs/components/prism-css'),
  python: () => import('prismjs/components/prism-python'),
  bash: () => import('prismjs/components/prism-bash'),
  json: () => import('prismjs/components/prism-json'),
  markdown: () => import('prismjs/components/prism-markdown'),
  sql: () => import('prismjs/components/prism-sql'),
}

export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [Prism, setPrism] = useState<any>(null)
  
  // Extract language from className (e.g., "language-javascript")
  const language = className?.replace(/language-/, '') || 'text'
  
  useEffect(() => {
    if (!inline) {
      // Load Prism and the specific language component
      loadPrism().then(async (prismModule) => {
        const prism = prismModule.default
        setPrism(prism)
        
        // Load language component if available
        if (languageLoaders[language]) {
          await languageLoaders[language]()
        }
        
        // Highlight the code
        setTimeout(() => {
          prism.highlightAll()
        }, 0)
      })
    }
  }, [inline, children, language])
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (inline) {
    return (
      <code 
        style={{
          backgroundColor: '#f3f4f6',
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}
      >
        {children}
      </code>
    )
  }
  
  return (
    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: '0.5rem 1rem',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        <span>{language}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#10b981' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = '#334155'
              e.currentTarget.style.color = '#e2e8f0'
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94a3b8'
            }
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        borderBottomLeftRadius: '0.5rem',
        borderBottomRightRadius: '0.5rem',
        overflow: 'auto',
        maxHeight: '600px'
      }}>
        <code className={`language-${language}`}>
          {children}
        </code>
      </pre>
    </div>
  )
}