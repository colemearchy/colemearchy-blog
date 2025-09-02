'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Global types are defined in src/types/gtag.d.ts

const GA_MEASUREMENT_ID = 'G-KBJG8YGB9P'

function GoogleAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)
    if (existingScript) return

    // Load gtag script with proper attributes
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.async = true
    script.defer = true
    
    // Add error handling
    script.onerror = () => {
      console.warn('Failed to load Google Analytics')
    }
    
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      cookie_flags: 'SameSite=None;Secure',
      anonymize_ip: true
    })
  }, [])

  useEffect(() => {
    if (!window.gtag) return

    const url = pathname + searchParams.toString()
    
    // Track page views
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href,
    })
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  )
}

// Helper function to track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Helper function to track blog post reads
export function trackBlogPostRead(title: string, slug: string) {
  trackEvent('blog_post_read', 'engagement', title)
  trackEvent('page_view', 'blog', slug)
}

// Helper function to track newsletter signups
export function trackNewsletterSignup(email?: string) {
  trackEvent('newsletter_signup', 'conversion', 'newsletter_form')
}

// Helper function to track external link clicks
export function trackExternalLinkClick(url: string, linkText?: string) {
  trackEvent('external_link_click', 'engagement', linkText || url)
}