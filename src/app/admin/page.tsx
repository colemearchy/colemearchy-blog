import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BulkImageUploader } from '@/components/admin/BulkImageUploader'

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
      {/* 대량 이미지 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUploader />
      </div>

      {/* 게시물 목록 섹션 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
          <p className="mt-1 text-sm text-gray-500">
            총 {posts.length}개 게시물 (발행일 순서대로 정렬)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 border-r">
                  번호
                </th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                  이미지
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  제목
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  상태
                </th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                  조회수
                </th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {posts.map((post, index) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-4 text-sm font-bold text-gray-900 border-r">
                    {index + 1}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {post.coverImage ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900">
                    <div className="font-medium line-clamp-2">
                      {post.title}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    {post.publishedAt ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        발행됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                        초안
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 text-center font-medium">
                    {post.views}
                  </td>
                  <td className="px-3 py-4 text-sm text-center">
                    <Link 
                      href={`/admin/edit/${post.id}`} 
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}