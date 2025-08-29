/**
 * 애플리케이션 전역 상수
 */

// SEO 관련 상수
export const SEO = {
  DEFAULT_TITLE: 'Colemearchy - Biohacking, Tech Leadership, and Sovereign Living',
  DEFAULT_DESCRIPTION: 'Raw insights on biohacking, tech leadership, and building a sovereign life. From a tech director who refuses to follow the script.',
  DEFAULT_KEYWORDS: ['biohacking', 'tech leadership', 'startup growth', 'SEO', 'AI', 'personal freedom', 'investing'],
  SITE_NAME: 'Colemearchy',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://colemearchy.com',
  TWITTER_HANDLE: '@colemearchy',
  DEFAULT_OG_IMAGE: '/og-image.png',
} as const

// 페이지네이션 상수
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

// 파일 업로드 상수
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  IMAGE_QUALITY: 0.85,
} as const

// API 상수
export const API = {
  TIMEOUT: 30000, // 30초
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1초
} as const

// 캐시 상수
export const CACHE = {
  POST_TTL: 60 * 60, // 1시간
  ANALYTICS_TTL: 5 * 60, // 5분
  YOUTUBE_TTL: 15 * 60, // 15분
} as const

// 날짜 포맷 상수
export const DATE_FORMATS = {
  DISPLAY: 'MMMM d, yyyy',
  SHORT: 'MMM d, yyyy',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// YouTube 상수
export const YOUTUBE = {
  DEFAULT_THUMBNAIL_QUALITY: 'hqdefault',
  VIDEO_ID_LENGTH: 11,
  MAX_VIDEOS_FETCH: 50,
} as const

// 태그 상수
export const TAGS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
  MAX_COUNT: 10,
} as const

// 콘텐츠 상수
export const CONTENT = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  EXCERPT_MAX_LENGTH: 500,
  SEO_TITLE_MAX_LENGTH: 70,
  SEO_DESCRIPTION_MAX_LENGTH: 160,
  MIN_READING_TIME: 1,
} as const