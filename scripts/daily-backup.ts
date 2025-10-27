#!/usr/bin/env tsx

/**
 * 매일 실행되는 자동 백업 스크립트
 * 전체 데이터베이스를 백업하고 오래된 백업 파일들을 정리
 */

import { backupAllPosts, cleanupOldBackups, getBackupStatus } from '@/lib/auto-backup'

async function main() {
  console.log('🔄 매일 자동 백업 시작...')

  try {
    // 1. 전체 포스트 백업
    console.log('📦 전체 포스트 백업 중...')
    const backupPath = await backupAllPosts('daily-backup')

    if (backupPath) {
      console.log(`✅ 백업 완료: ${backupPath}`)
    } else {
      console.error('❌ 백업 실패')
      process.exit(1)
    }

    // 2. 오래된 백업 파일 정리 (30일 이상)
    console.log('🧹 오래된 백업 파일 정리 중...')
    cleanupOldBackups(30)

    // 3. 백업 상태 출력
    console.log('📊 현재 백업 상태:')
    const status = getBackupStatus()
    console.log(`  - 백업 디렉토리: ${status.backupDir}`)
    console.log(`  - 총 백업 파일: ${status.totalBackups}개`)
    console.log(`  - 총 크기: ${status.totalSize}`)
    console.log(`  - 최신 백업: ${status.latestBackup || 'None'}`)

    console.log('🎉 매일 자동 백업 완료!')
    process.exit(0)

  } catch (error) {
    console.error('❌ 매일 백업 실패:', error)
    process.exit(1)
  }
}

main()