'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import CodeBlock from './CodeBlock'
import LazyImage from './LazyImage'

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  let headingIndex = 0
  
  const createHeadingId = (text: string, level: number) => {
    const id = `heading-${headingIndex}-${text.toString().toLowerCase().replace(/[^\w]+/g, '-')}`
    headingIndex++
    return id
  }
  
  return (
    <div style={{ maxWidth: '65ch', margin: '0 auto' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({children}: any) => {
            const id = createHeadingId(children, 1)
            return <h1 id={id} style={{fontSize: '2.25rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', lineHeight: 1.2}}>{children}</h1>
          },
          h2: ({children}: any) => {
            const id = createHeadingId(children, 2)
            return <h2 id={id} style={{fontSize: '1.875rem', fontWeight: 600, marginTop: '1.75rem', marginBottom: '0.75rem', lineHeight: 1.3}}>{children}</h2>
          },
          h3: ({children}: any) => {
            const id = createHeadingId(children, 3)
            return <h3 id={id} style={{fontSize: '1.5rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem', lineHeight: 1.3}}>{children}</h3>
          },
          p: ({children}: any) => <p style={{marginBottom: '1.25rem', lineHeight: 1.75}}>{children}</p>,
          strong: ({children}: any) => <strong style={{fontWeight: 700}}>{children}</strong>,
          em: ({children}: any) => <em style={{fontStyle: 'italic'}}>{children}</em>,
          ul: ({children}: any) => <ul style={{listStyleType: 'disc', marginBottom: '1.25rem', paddingLeft: '1.5rem'}}>{children}</ul>,
          ol: ({children}: any) => <ol style={{listStyleType: 'decimal', marginBottom: '1.25rem', paddingLeft: '1.5rem'}}>{children}</ol>,
          li: ({children}: any) => <li style={{marginBottom: '0.5rem', lineHeight: 1.75}}>{children}</li>,
          blockquote: ({children}: any) => <blockquote style={{borderLeft: '4px solid #e5e7eb', paddingLeft: '1rem', margin: '1.5rem 0', fontStyle: 'italic', color: '#6b7280'}}>{children}</blockquote>,
          code: ({children, className, ...props}: any) => {
            const isInline = !props.node?.position?.start?.line || props.node?.position?.start?.line === props.node?.position?.end?.line;
            return <CodeBlock inline={isInline} className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
          },
          pre: ({children}: any) => <>{children}</>,
          a: ({children, href}: any) => <a href={href} style={{color: '#3b82f6', textDecoration: 'underline'}} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>,
          img: ({src, alt}: any) => <LazyImage src={src} alt={alt || ''} />,
          hr: () => <hr style={{borderColor: '#e5e7eb', margin: '2rem 0'}} />,
          table: ({children}: any) => <table style={{width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0'}}>{children}</table>,
          th: ({children}: any) => <th style={{border: '1px solid #e5e7eb', padding: '0.5rem 1rem', textAlign: 'left', backgroundColor: '#f9fafb', fontWeight: 600}}>{children}</th>,
          td: ({children}: any) => <td style={{border: '1px solid #e5e7eb', padding: '0.5rem 1rem', textAlign: 'left'}}>{children}</td>,
          iframe: ({src, title, ...props}: any) => {
            // Add privacy-enhanced mode for YouTube embeds
            let enhancedSrc = src;
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
                  {...props}
                />
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}