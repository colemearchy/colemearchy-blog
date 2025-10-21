'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import CodeBlock from './CodeBlock'
import LazyImage from './LazyImage'
import type { Components } from 'react-markdown'

interface MarkdownContentProps {
  content: string
}

function childrenToString(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(childrenToString).join('')
  return ''
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  let headingIndex = 0

  const createHeadingId = (text: React.ReactNode, level: number) => {
    const textString = childrenToString(text)
    const id = `heading-${headingIndex}-${textString.toLowerCase().replace(/[^\w]+/g, '-')}`
    headingIndex++
    return id
  }
  
  return (
    <div style={{ maxWidth: '65ch', margin: '0 auto' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({children}) => {
            const id = createHeadingId(children, 1)
            return <h1 id={id} style={{fontSize: '2.25rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', lineHeight: 1.2}}>{children}</h1>
          },
          h2: ({children}) => {
            const id = createHeadingId(children, 2)
            return <h2 id={id} style={{fontSize: '1.875rem', fontWeight: 600, marginTop: '1.75rem', marginBottom: '0.75rem', lineHeight: 1.3}}>{children}</h2>
          },
          h3: ({children}) => {
            const id = createHeadingId(children, 3)
            return <h3 id={id} style={{fontSize: '1.5rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem', lineHeight: 1.3}}>{children}</h3>
          },
          p: ({children}) => <p style={{marginBottom: '1.25rem', lineHeight: 1.75}}>{children}</p>,
          strong: ({children}) => <strong style={{fontWeight: 700}}>{children}</strong>,
          em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
          ul: ({children}) => <ul style={{listStyleType: 'disc', marginBottom: '1.25rem', paddingLeft: '1.5rem'}}>{children}</ul>,
          ol: ({children}) => <ol style={{listStyleType: 'decimal', marginBottom: '1.25rem', paddingLeft: '1.5rem'}}>{children}</ol>,
          li: ({children}) => <li style={{marginBottom: '0.5rem', lineHeight: 1.75}}>{children}</li>,
          blockquote: ({children}) => <blockquote style={{borderLeft: '4px solid #e5e7eb', paddingLeft: '1rem', margin: '1.5rem 0', fontStyle: 'italic', color: '#6b7280'}}>{children}</blockquote>,
          code: ({children, className, node}) => {
            const isInline = !node?.position?.start?.line || node?.position?.start?.line === node?.position?.end?.line;
            return <CodeBlock inline={isInline} className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
          },
          pre: ({children}) => <>{children}</>,
          a: ({children, href}) => <a href={href} style={{color: '#3b82f6', textDecoration: 'underline'}} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>,
          img: ({src, alt}) => <LazyImage src={typeof src === 'string' ? src : ''} alt={alt || ''} />,
          hr: () => <hr style={{borderColor: '#e5e7eb', margin: '2rem 0'}} />,
          table: ({children}) => <table style={{width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0'}}>{children}</table>,
          th: ({children}) => <th style={{border: '1px solid #e5e7eb', padding: '0.5rem 1rem', textAlign: 'left', backgroundColor: '#f9fafb', fontWeight: 600}}>{children}</th>,
          td: ({children}) => <td style={{border: '1px solid #e5e7eb', padding: '0.5rem 1rem', textAlign: 'left'}}>{children}</td>,
          iframe: ({src, title}) => {
            // Add privacy-enhanced mode for YouTube embeds
            let enhancedSrc = src || '';
            if (src && src.includes('youtube.com/embed/')) {
              enhancedSrc = src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
              // Add parameters to reduce cookies and improve performance
              const separator = enhancedSrc.includes('?') ? '&' : '?';
              enhancedSrc += `${separator}modestbranding=1&rel=0&showinfo=0&controls=1`;
            }

            return (
              <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', margin: '2rem 0'}}>
                <iframe
                  src={enhancedSrc}
                  title={title || 'Embedded content'}
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, borderRadius: '0.5rem'}}
                  loading="lazy"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            );
          },
        } as Components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}