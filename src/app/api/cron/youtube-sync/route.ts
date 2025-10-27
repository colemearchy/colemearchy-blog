import { NextRequest, NextResponse } from 'next/server'
import { syncNewVideos } from '../../../../../scripts/auto-youtube-sync'

/**
 * YouTube 자동 동기화 크론 작업 API
 * 매일 실행되어 새로운 YouTube 영상을 블로그 포스트로 변환
 */

// Cron secret 검증
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // 크론 시크릿 검증
    if (!verifyCronSecret(request)) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 YouTube 자동 동기화 크론 작업 시작...')

    // YouTube 동기화 실행
    const result = await syncNewVideos()

    // 결과 로깅
    console.log('📊 YouTube 동기화 완료:')
    console.log(`  - 총 영상: ${result.totalVideos}개`)
    console.log(`  - 새로운 영상: ${result.newVideos}개`)
    console.log(`  - 성공한 변환: ${result.successfulConversions}개`)
    console.log(`  - 실패한 변환: ${result.failedConversions}개`)

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'YouTube sync completed successfully',
      result: {
        totalVideos: result.totalVideos,
        newVideos: result.newVideos,
        successfulConversions: result.successfulConversions,
        failedConversions: result.failedConversions,
        processedVideos: result.processedVideos
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ YouTube 동기화 크론 작업 실패:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // POST 요청도 같은 방식으로 처리 (수동 트리거용)
  return GET(request)
}