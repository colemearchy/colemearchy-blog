import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BulkImageUrlUploader } from '@/components/admin/BulkImageUrlUploader'
import { BulkImageUploader } from '@/components/admin/BulkImageUploader'
import { AdminPostsTable } from '@/components/admin/AdminPostsTable'

export const dynamic = 'force-dynamic'

interface Translation {
  locale: string
  title: string
}

interface Post {
  id: string
  title: string
  slug: string
  publishedAt: Date | null
  views: number
  coverImage: string | null
  translations?: Translation[]
}

export default async function AdminPage() {
  const posts: Post[] = await prisma.post.findMany({
    orderBy: { publishedAt: 'asc' },  // 발행일 순으로 변경
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      views: true,
      coverImage: true,
      translations: {
        select: {
          locale: true,
          title: true,
        }
      }
    }
  })

  return (
    <div className="space-y-8">
      {/* 대량 이미지 파일 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUploader />
      </div>

      {/* 대량 이미지 URL 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUrlUploader />
      </div>

      {/* 게시물 목록 섹션 - Client Component로 분리 */}
      <AdminPostsTable posts={posts} />
    </div>
  )
}