'use client'

import { useEffect, useState } from 'react'

interface ViewCounterProps {
  postId: string
  initialViews: number
}

export default function ViewCounter({ postId, initialViews }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    // Track view after component mounts
    const trackView = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/views`, {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          setViews(data.views)
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }

    // Track view after a short delay to ensure it's a real page view
    const timer = setTimeout(trackView, 1000)
    
    return () => clearTimeout(timer)
  }, [postId])

  return <span>{views} views</span>
}