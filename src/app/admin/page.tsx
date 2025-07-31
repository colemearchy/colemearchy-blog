import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BulkImageUrlUploader } from '@/components/admin/BulkImageUrlUploader'
import { AdminPostsTable } from '@/components/admin/AdminPostsTable'

export const dynamic = 'force-dynamic'

interface Post {
  id: string
  title: string
  slug: string
  publishedAt: Date | null
  views: number
  coverImage: string | null
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
    }
  })

  return (
    <div className="space-y-8">
      {/* 대량 이미지 URL 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUrlUploader />
      </div>

      {/* 게시물 목록 섹션 - Client Component로 분리 */}
      <AdminPostsTable posts={posts} />
    </div>
  )
}