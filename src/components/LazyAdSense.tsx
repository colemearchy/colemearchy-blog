'use client'

import { useEffect, useRef, useState } from 'react'

interface LazyAdSenseProps {
  slot: string
  format?: string
  style?: React.CSSProperties
}

export function LazyAdSense({ slot, format = 'auto', style }: LazyAdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            // Only load AdSense when the ad slot is about to be visible
            const loadAdSense = () => {
              if (!(window as any).adsbygoogle) {
                const script = document.createElement('script')
                script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9914003663926064'
                script.async = true
                script.defer = true
                script.crossOrigin = 'anonymous'
                
                script.onload = () => {
                  try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
                  } catch (err) {
                    console.error('AdSense error:', err)
                  }
                }
                
                document.head.appendChild(script)
              } else {
                try {
                  ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
                } catch (err) {
                  console.error('AdSense error:', err)
                }
              }
            }
            
            // Delay loading slightly to prioritize content
            setTimeout(loadAdSense, 100)
            setIsLoaded(true)
            observer.disconnect()
          }
        })
      },
      { 
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01
      }
    )
    
    if (adRef.current) {
      observer.observe(adRef.current)
    }
    
    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [isLoaded])
  
  return (
    <div
      ref={adRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '250px',
        height: '250px',
        maxHeight: '250px',
        ...style
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-600">Advertisement</span>
        </div>
      )}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: '250px',
          height: '250px'
        }}
        data-ad-client="ca-pub-9914003663926064"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}