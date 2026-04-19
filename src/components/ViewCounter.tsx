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

    // Track view after idle to reduce TBT
    const idleId = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => trackView(), { timeout: 3000 })
      : undefined
    const fallbackId = typeof requestIdleCallback === 'undefined'
      ? setTimeout(trackView, 1500)
      : undefined

    return () => {
      if (idleId !== undefined) cancelIdleCallback(idleId)
      if (fallbackId !== undefined) clearTimeout(fallbackId)
    }
  }, [postId])

  return <span>{views} views</span>
}