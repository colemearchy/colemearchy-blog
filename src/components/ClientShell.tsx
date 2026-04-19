'use client'

import dynamic from 'next/dynamic'

const GoogleAnalytics = dynamic(
  () => import('@/components/GoogleAnalytics').then(m => ({ default: m.GoogleAnalytics })),
  { ssr: false }
)
const ServiceWorkerRegistration = dynamic(
  () => import('@/components/ServiceWorkerRegistration'),
  { ssr: false }
)
const AdBlockerNotice = dynamic(
  () => import('@/components/AdBlockerNotice'),
  { ssr: false }
)

export default function ClientShell() {
  return (
    <>
      <GoogleAnalytics />
      <ServiceWorkerRegistration />
      <AdBlockerNotice />
    </>
  )
}
