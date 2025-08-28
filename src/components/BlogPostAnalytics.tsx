'use client'

import { useEffect } from 'react'
import { trackBlogPostRead } from './GoogleAnalytics'

interface BlogPostAnalyticsProps {
  title: string
  slug: string
  author?: string
  tags?: string[]
}

export function BlogPostAnalytics({ title, slug, author, tags }: BlogPostAnalyticsProps) {
  useEffect(() => {
    // Track blog post read immediately
    trackBlogPostRead(title, slug)

    // Track scroll depth
    let maxScroll = 0
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent
        
        // Track milestone scroll depths
        if (scrollPercent >= 25 && maxScroll < 25) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_25', {
              event_category: 'engagement',
              event_label: slug,
              value: 25
            })
          }
        }
        if (scrollPercent >= 50 && maxScroll < 50) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_50', {
              event_category: 'engagement',
              event_label: slug,
              value: 50
            })
          }
        }
        if (scrollPercent >= 75 && maxScroll < 75) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_75', {
              event_category: 'engagement',
              event_label: slug,
              value: 75
            })
          }
        }
        if (scrollPercent >= 90 && maxScroll < 90) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_90', {
              event_category: 'engagement',
              event_label: slug,
              value: 90
            })
          }
        }
      }
    }

    // Track time on page
    const startTime = Date.now()
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'time_on_page', {
          event_category: 'engagement',
          event_label: slug,
          value: timeSpent
        })
      }
    }

    // Add scroll listener with passive flag for better performance
    window.addEventListener('scroll', trackScrollDepth, { passive: true })
    
    // Track time on page when user leaves
    window.addEventListener('beforeunload', trackTimeOnPage)

    // Cleanup
    return () => {
      window.removeEventListener('scroll', trackScrollDepth)
      window.removeEventListener('beforeunload', trackTimeOnPage)
      trackTimeOnPage() // Track final time on page
    }
  }, [title, slug])

  return null
}