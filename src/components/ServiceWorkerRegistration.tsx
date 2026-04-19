'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      }
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(register, { timeout: 5000 })
      } else {
        setTimeout(register, 3000)
      }
    }
  }, [])

  return null
}