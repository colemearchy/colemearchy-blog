'use client'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  aspectRatio?: '16:9' | '4:3'
}

export default function YouTubeEmbed({ 
  videoId, 
  title = 'YouTube video', 
  aspectRatio = '16:9' 
}: YouTubeEmbedProps) {
  const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
  
  return (
    <div className={`relative w-full ${aspectClass} my-8 rounded-lg overflow-hidden bg-black`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        loading="lazy"
      />
    </div>
  )
}

// Helper function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Regular YouTube URLs
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (youtubeMatch) return youtubeMatch[1]
  
  // YouTube Shorts
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]
  
  // If it's already just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  
  return null
}