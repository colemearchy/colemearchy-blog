import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateAffiliateContentPrompt } from '@/lib/ai-prompts'
import { injectAffiliateLinks } from '@/lib/utils/affiliate-link-injector'
import { generateUniqueSlugWithTimestamp } from '@/lib/utils/slug'

const turso = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Vercel Cron Job: 쿠팡 베스트셀러/핫딜 자동 포스팅
 *
 * 전략:
 * 1. 쿠팡 API 또는 스크래핑으로 베스트셀러/타임딜 가져오기
 * 2. Colemearchy 페르소나에 맞는 상품 필터링
 * 3. AI로 "오늘의 추천템" 스타일 콘텐츠 생성
 * 4. 자동 발행
 *
 * Schedule: 매일 자정 0 0 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // 1. CRON_SECRET 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔥 쿠팡 핫딜 자동 포스팅 시작...')

    // 2. Gemini에게 "오늘의 추천템" 요청
    // 실제로는 쿠팡 API를 사용하지만, 여기서는 Gemini가 트렌드 상품 추천
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const trendPrompt = `
당신은 15년차 블로그 성장 전략가이자 쿠팡 파트너스 전문가입니다.

**미션**: 2025년 1월 ${new Date().getDate()}일 기준, Colemearchy 블로그 독자(PM, 개발자, 디지털 노마드, 바이오해커)에게 추천할 쿠팡 상품 3개를 선정하세요.

**선정 기준**:
1. 타겟 독자에게 실용적
2. 현재 시즌/트렌드 반영 (예: 겨울 → 가습기, 연말 → 플래너)
3. 가성비 또는 프리미엄 양극단 (중간 제품 제외)
4. ADHD, 생산성, 바이오해킹, 재택근무와 연관성

**출력 형식 (JSON)**:
\`\`\`json
{
  "date": "2025-01-${new Date().getDate()}",
  "theme": "오늘의 테마 (예: 겨울 재택근무 필수템)",
  "products": [
    {
      "name": "상품명 (실제 쿠팡 상품)",
      "category": "카테고리",
      "keywords": "키워드1, 키워드2, 키워드3",
      "why": "추천 이유 (1줄)",
      "estimatedPrice": "예상 가격대 (예: 3만원대)"
    }
  ],
  "postTitle": "SEO 최적화된 포스트 제목",
  "postContent": "Colemearchy 페르소나로 작성한 3개 상품 소개 콘텐츠 (마크다운, 2000자 이상)"
}
\`\`\`

**중요**:
- 실제 존재하는 쿠팡 상품만 추천
- Colemearchy 톤 유지 (솔직, 날것, 데이터 기반)
- 각 상품에 [AFFILIATE_LINK_PLACEHOLDER_{상품명}] 삽입
`

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: trendPrompt }]
      }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
      }
    })

    const responseText = result.response.text()

    // 3. JSON 파싱
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const parsed = JSON.parse(jsonText)

    console.log(`📅 테마: ${parsed.theme}`)
    console.log(`📦 추천 상품 수: ${parsed.products.length}`)

    // 4. 각 상품을 DB에 임시 저장 (쿠팡 링크는 수동으로 나중에 추가)
    const productIds: string[] = []
    const now = Date.now()

    for (const product of parsed.products) {
      const productId = `hotdeal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await turso.execute({
        sql: `INSERT INTO "AffiliateProduct" (
          id, name, coupangUrl, category, keywords, description, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          productId,
          product.name,
          '[쿠팡 링크 필요]', // 수동으로 나중에 업데이트
          product.category,
          product.keywords,
          product.why,
          now,
          now
        ]
      })

      productIds.push(productId)
      console.log(`✅ 상품 저장: ${product.name}`)
    }

    // 5. 포스트 생성
    const slug = generateUniqueSlugWithTimestamp(parsed.postTitle)
    const postId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 쿠팡 법적 고지 추가
    const contentWithDisclaimer = `${parsed.postContent}

---

**파트너스 활동 고지**
*이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.*`

    await turso.execute({
      sql: `INSERT INTO Post (
        id, title, slug, content, excerpt, tags,
        seoTitle, seoDescription, status, author, originalLanguage,
        createdAt, updatedAt, views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        postId,
        parsed.postTitle,
        slug,
        contentWithDisclaimer,
        `${parsed.theme}: ${parsed.products.map((p: any) => p.name).join(', ')}`,
        parsed.products.map((p: any) => p.keywords).join(', '),
        parsed.postTitle,
        `${parsed.theme} - Colemearchy가 추천하는 ${parsed.products.length}가지 필수템`,
        'DRAFT', // 쿠팡 링크 추가 전까지 DRAFT
        'Colemearchy AI',
        'ko',
        now,
        now,
        0
      ]
    })

    // 6. PostAffiliateProduct 관계 추가
    for (const productId of productIds) {
      await turso.execute({
        sql: `INSERT INTO PostAffiliateProduct (
          id, postId, affiliateProductId, createdAt
        ) VALUES (?, ?, ?, ?)`,
        args: [
          `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          postId,
          productId,
          now
        ]
      })
    }

    console.log('✅ 핫딜 포스트 생성 완료!')
    console.log(`   - Title: ${parsed.postTitle}`)
    console.log(`   - Status: DRAFT (쿠팡 링크 추가 필요)`)
    console.log(`   - 다음 단계: Admin에서 각 상품의 쿠팡 링크 추가 후 발행`)

    turso.close()

    return NextResponse.json({
      success: true,
      post: {
        id: postId,
        title: parsed.postTitle,
        slug,
        theme: parsed.theme,
        productsCount: parsed.products.length
      },
      message: 'Admin에서 쿠팡 링크 추가 필요'
    })

  } catch (error) {
    console.error('💥 에러:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
