import { NextResponse } from 'next/server'

export async function GET() {
  // 테스트 파일들 삭제 예정 표시
  return NextResponse.json({
    message: "테스트 API 파일들:",
    files: [
      "/api/test-blob",
      "/api/test-blob-upload",
      "/api/test-cleanup"
    ],
    note: "배포 성공 후 이 파일들을 삭제하세요"
  })
}