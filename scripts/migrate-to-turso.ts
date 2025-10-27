#!/usr/bin/env tsx

/**
 * Turso 데이터베이스로 데이터 마이그레이션 스크립트
 * 백업된 데이터를 Turso SQLite 데이터베이스에 안전하게 마이그레이션
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 환경변수 로드
dotenv.config({ override: true })

// 환경변수 값을 직접 설정
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "libsql://colemearchy-blog-coleitai.aws-ap-northeast-1.turso.io"
}
if (!process.env.DATABASE_AUTH_TOKEN) {
  process.env.DATABASE_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1NDYyMDIsImlkIjoiYThmYjNmNmMtZDEyYS00NDhiLTkyOGQtOTA0ODc4ZTc4OTI2IiwicmlkIjoiNmQwZGNjNGMtOGI4OC00MzdjLTk5ZmQtMzgzNTEyYWUxNzY5In0.1fkgOf0PkLEe0pkaQksyxXrZUoSPDxLwXfJae4nAgD2snm5CMTnXsvT9OcQHCMJ4obDZ7o6Z4mt_sCXDhpweCw"
}

// 환경변수 확인
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_AUTH_TOKEN exists:', !!process.env.DATABASE_AUTH_TOKEN)
console.log('DATABASE_URL value:', process.env.DATABASE_URL)

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

async function migrateToTurso() {
  try {
    console.log('🚀 Turso 데이터베이스 마이그레이션 시작...')

    // libSQL 클라이언트 생성 (하드코딩)
    const libsql = createClient({
      url: "libsql://colemearchy-blog-coleitai.aws-ap-northeast-1.turso.io",
      authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1NDYyMDIsImlkIjoiYThmYjNmNmMtZDEyYS00NDhiLTkyOGQtOTA0ODc4ZTc4OTI2IiwicmlkIjoiNmQwZGNjNGMtOGI4OC00MzdjLTk5ZmQtMzgzNTEyYWUxNzY5In0.1fkgOf0PkLEe0pkaQksyxXrZUoSPDxLwXfJae4nAgD2snm5CMTnXsvT9OcQHCMJ4obDZ7o6Z4mt_sCXDhpweCw",
    })

    // Prisma adapter 생성
    const adapter = new PrismaLibSQL({
      url: "libsql://colemearchy-blog-coleitai.aws-ap-northeast-1.turso.io",
      authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1NDYyMDIsImlkIjoiYThmYjNmNmMtZDEyYS00NDhiLTkyOGQtOTA0ODc4ZTc4OTI2IiwicmlkIjoiNmQwZGNjNGMtOGI4OC00MzdjLTk5ZmQtMzgzNTEyYWUxNzY5In0.1fkgOf0PkLEe0pkaQksyxXrZUoSPDxLwXfJae4nAgD2snm5CMTnXsvT9OcQHCMJ4obDZ7o6Z4mt_sCXDhpweCw",
    })

    // Prisma 클라이언트 생성
    const prisma = new PrismaClient({
      adapter,
      log: ['query', 'error', 'warn'],
    })

    // 백업 파일 읽기
    const backupDir = path.join(__dirname, 'backup-data')
    const backupFile = path.join(backupDir, 'manual-backup-1761544536709.json')

    if (!fs.existsSync(backupFile)) {
      console.error('❌ 백업 파일을 찾을 수 없습니다:', backupFile)
      return
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
    console.log(`📊 백업 데이터 로드 완료: ${backupData.posts.length}개 포스트`)

    // 1. 연결 테스트
    console.log('🔍 Turso 데이터베이스 연결 테스트...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Turso 연결 성공!')

    // 2. 기존 데이터 확인
    const existingPosts = await prisma.post.count()
    console.log(`📄 기존 포스트 수: ${existingPosts}개`)

    // 3. 포스트 데이터 마이그레이션
    console.log('📝 포스트 데이터 마이그레이션 중...')

    for (const postData of backupData.posts) {
      try {
        // tags를 문자열로 변환 (SQLite는 배열을 지원하지 않음)
        const tagsString = Array.isArray(postData.tags)
          ? postData.tags.join(',')
          : postData.tags || ''

        // socialLinks를 문자열로 변환
        const socialLinksString = postData.socialLinks
          ? JSON.stringify(postData.socialLinks)
          : null

        await prisma.post.upsert({
          where: { slug: postData.slug },
          update: {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            coverImage: postData.coverImage,
            publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : null,
            author: postData.author,
            tags: tagsString,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
            views: postData.views || 0,
            status: postData.status || 'PUBLISHED',
            socialLinks: socialLinksString,
            youtubeVideoId: postData.youtubeVideoId,
            originalLanguage: postData.originalLanguage || 'ko',
            globalRank: postData.globalRank
          },
          create: {
            id: postData.id,
            title: postData.title,
            slug: postData.slug,
            content: postData.content,
            excerpt: postData.excerpt,
            coverImage: postData.coverImage,
            publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : null,
            createdAt: postData.createdAt ? new Date(postData.createdAt) : new Date(),
            updatedAt: postData.updatedAt ? new Date(postData.updatedAt) : new Date(),
            author: postData.author,
            tags: tagsString,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
            views: postData.views || 0,
            status: postData.status || 'PUBLISHED',
            socialLinks: socialLinksString,
            youtubeVideoId: postData.youtubeVideoId,
            originalLanguage: postData.originalLanguage || 'ko',
            globalRank: postData.globalRank
          }
        })

        console.log(`✅ 포스트 마이그레이션 완료: ${postData.title}`)
      } catch (error) {
        console.error(`❌ 포스트 마이그레이션 실패 (${postData.title}):`, error)
      }
    }

    // 4. 마이그레이션 결과 확인
    const finalPostCount = await prisma.post.count()
    console.log(`📊 마이그레이션 완료: 총 ${finalPostCount}개 포스트`)

    // 5. 데이터 검증
    console.log('🔍 데이터 검증 중...')
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true
      }
    })

    console.log('📋 마이그레이션된 포스트 목록:')
    posts.forEach(post => {
      console.log(`  - ${post.title} (${post.slug}) [${post.status}]`)
    })

    console.log('🎉 Turso 마이그레이션 성공!')

    await prisma.$disconnect()

    return {
      success: true,
      migratedPosts: finalPostCount,
      posts: posts
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    // Prisma 연결 해제는 try 블록에서 처리
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateToTurso()
    .then(result => {
      if (result?.success) {
        console.log('✅ 마이그레이션 성공!')
        process.exit(0)
      } else {
        console.error('❌ 마이그레이션 실패:', result?.error || 'Unknown error')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { migrateToTurso }