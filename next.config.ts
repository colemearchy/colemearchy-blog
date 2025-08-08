import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'localhost',
      'colemearchy.com',
      process.env.VERCEL_BLOB_HOST || '', // Vercel Blob Storage 도메인
    ].filter(Boolean),
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

export default nextConfig