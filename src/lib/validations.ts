import { z } from 'zod';

// 공통 검증 규칙
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const tagsSchema = z
  .union([
    z.array(z.string().min(1)),
    z.string()
  ])
  .transform((val) => {
    if (typeof val === 'string') {
      return val.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return val;
  })
  .refine((tags) => tags.length >= 1, { message: 'At least one tag is required' })
  .refine((tags) => tags.length <= 10, { message: 'Maximum 10 tags allowed' });

export const youtubeVideoIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID')
  .nullable()
  .optional();

// Post 검증 스키마
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: slugSchema,
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  coverImage: z.string().url('Invalid image URL').optional(),
  tags: tagsSchema.optional(),
  seoTitle: z.string().max(70, 'SEO title too long').optional(),
  seoDescription: z.string().max(160, 'SEO description too long').optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  youtubeVideoId: youtubeVideoIdSchema,
  socialLinks: z
    .object({
      threads: z.array(z.string().url()).optional(),
      youtube: z.array(z.string().url()).optional(),
    })
    .optional(),
});

export const updatePostSchema = createPostSchema.partial();

// YouTube 검증 스키마
export const youtubeUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
        /^https?:\/\/youtu\.be\/[\w-]{11}/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/,
      ];
      return patterns.some((pattern) => pattern.test(url));
    },
    { message: 'Invalid YouTube URL' }
  );

// AI 생성 검증 스키마
export const generateContentSchema = z.object({
  prompt: z.string().min(10, 'Prompt too short').max(1000, 'Prompt too long'),
  keywords: z.array(z.string()).max(20, 'Too many keywords').optional(),
  affiliateProducts: z.array(z.string()).max(10, 'Too many products').optional(),
  publishDate: z.string().datetime().optional(),
});

// 파일 업로드 검증
export const imageUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z
    .string()
    .refine((type) => type.startsWith('image/'), 'File must be an image'),
});

// 페이지네이션 검증
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .optional()
    .nullable(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional()
    .nullable(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

// 관리자 인증 검증
export const adminAuthSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// 유틸리티 함수: YouTube Video ID 추출
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    // 이미 ID 형태인 경우
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    return null;
  } catch {
    return null;
  }
}

// 타입 추론을 위한 유틸리티
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;