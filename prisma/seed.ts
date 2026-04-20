import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dummyPosts = [
  {
    title: '블로그 템플릿 시작하기: 5분 만에 기업 블로그 런칭하는 방법',
    slug: 'getting-started-with-blog-template',
    content: `# 블로그 템플릿 시작하기

이 글은 블로그 템플릿의 데모 포스트입니다. 실제 운영 시 이 콘텐츠를 교체하세요.

## 왜 기업 블로그가 필요한가

기업 블로그는 단순한 콘텐츠 채널이 아닙니다. SEO 트래픽을 확보하고, 브랜드 신뢰도를 높이며, 잠재 고객과의 접점을 만드는 핵심 마케팅 자산입니다.

### 이 템플릿의 장점

- **SEO 최적화**: Schema.org, OG 태그, 사이트맵, canonical URL 등 모든 SEO 요소가 내장
- **고성능**: Lighthouse 400점 만점을 목표로 설계된 아키텍처
- **다국어 지원**: 한국어/영어 자동 라우팅
- **관리자 대시보드**: 코드 수정 없이 포스트 작성/편집 가능

## 시작하는 방법

1. \`src/config/site.config.ts\`에서 사이트 정보 설정
2. \`src/config/brand.config.ts\`에서 브랜딩 자산 설정
3. 관리자 대시보드(\`/admin\`)에서 첫 번째 포스트 작성
4. 배포

## 다음 단계

콘텐츠 전략을 수립하고, 타겟 키워드를 선정한 뒤, 꾸준히 양질의 콘텐츠를 발행하세요.
`,
    excerpt: '5분 만에 SEO 최적화된 기업 블로그를 런칭하는 방법을 알아봅니다.',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop',
    tags: 'getting-started,tutorial,blog',
    author: 'Template Author',
    seoTitle: '블로그 템플릿 시작 가이드 | 5분 만에 기업 블로그 런칭',
    seoDescription: 'SEO 최적화된 기업 블로그를 5분 만에 런칭하는 방법. Schema.org, OG 태그, 사이트맵 등 모든 SEO 요소가 내장된 템플릿.',
    originalLanguage: 'ko',
  },
  {
    title: 'SEO 체크리스트: 검색 엔진 최적화 완벽 가이드',
    slug: 'seo-checklist-complete-guide',
    content: `# SEO 체크리스트: 검색 엔진 최적화 완벽 가이드

검색 엔진 최적화(SEO)는 블로그 트래픽의 핵심입니다.

## 기술적 SEO

### Meta 태그
- 페이지별 고유한 title 태그 (70자 이내)
- 매력적인 meta description (160자 이내)
- 적절한 키워드 설정

### 구조화된 데이터
Schema.org 마크업은 Google 리치 결과 노출에 필수적입니다.

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "포스트 제목",
  "author": {
    "@type": "Organization",
    "name": "회사명"
  }
}
\`\`\`

### 사이트맵과 Robots
- sitemap.xml 자동 생성
- robots.txt 동적 생성
- Google Search Console 등록

## 콘텐츠 SEO

### E-E-A-T 원칙
- **Experience (경험)**: 실제 경험에 기반한 콘텐츠
- **Expertise (전문성)**: 분야 전문 지식 전달
- **Authoritativeness (권위)**: 신뢰할 수 있는 출처
- **Trustworthiness (신뢰성)**: 정확하고 투명한 정보

## 성능 최적화

Core Web Vitals를 "우수" 등급으로 유지하세요:
- LCP < 2.5초
- INP < 200ms
- CLS < 0.1
`,
    excerpt: '블로그 트래픽을 폭발시키는 SEO 체크리스트. 기술적 SEO부터 콘텐츠 전략까지 완벽 가이드.',
    coverImage: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&h=630&fit=crop',
    tags: 'SEO,guide,marketing',
    author: 'Template Author',
    seoTitle: 'SEO 체크리스트 2025: 검색 엔진 최적화 완벽 가이드',
    seoDescription: '블로그 SEO 완벽 가이드. 기술적 SEO, 콘텐츠 전략, Core Web Vitals 최적화 방법을 단계별로 설명합니다.',
    originalLanguage: 'ko',
  },
  {
    title: '콘텐츠 마케팅 전략: B2B 기업을 위한 블로그 운영 가이드',
    slug: 'content-marketing-strategy-b2b',
    content: `# 콘텐츠 마케팅 전략: B2B 기업을 위한 블로그 운영 가이드

B2B 기업에게 블로그는 가장 효과적인 인바운드 마케팅 채널입니다.

## 왜 B2B 블로그인가

- 검색 트래픽을 통한 잠재 고객 확보
- 전문성 입증으로 신뢰 구축
- 영업 지원 콘텐츠 자산 축적
- 장기적 SEO 자산 형성

## 콘텐츠 전략 프레임워크

### 1. 타겟 오디언스 정의
누구를 위해 쓰는가? 의사결정자, 실무자, 기술팀 각각에 맞는 콘텐츠가 필요합니다.

### 2. 키워드 리서치
검색량은 많고 경쟁은 낮은 '황금 키워드'를 찾으세요.

### 3. 콘텐츠 캘린더
주 1-2회 발행을 목표로, 최소 3개월 분량의 콘텐츠를 계획하세요.

### 4. 내부 링크 전략
포스트 간 유기적 연결을 통해 체류 시간을 높이세요.

## 성과 측정

- 오가닉 트래픽 추이
- 키워드 순위 변화
- 페이지별 체류 시간
- 전환율 (리드 생성)

## 마무리

꾸준함보다 중요한 건 구조입니다. 전략 없는 블로그는 시간 낭비입니다.
`,
    excerpt: 'B2B 기업을 위한 블로그 콘텐츠 마케팅 전략. 타겟 오디언스 정의부터 성과 측정까지.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    tags: 'marketing,B2B,content-strategy',
    author: 'Template Author',
    seoTitle: 'B2B 콘텐츠 마케팅 전략: 기업 블로그 운영 완벽 가이드',
    seoDescription: 'B2B 기업을 위한 블로그 콘텐츠 마케팅 전략 가이드. 키워드 리서치, 콘텐츠 캘린더, 내부 링크 전략까지.',
    originalLanguage: 'ko',
  },
  {
    title: 'Next.js 블로그 성능 최적화: Lighthouse 100점 달성 전략',
    slug: 'nextjs-blog-performance-optimization',
    content: `# Next.js 블로그 성능 최적화

Lighthouse Performance 100점은 SEO 순위와 사용자 경험 모두에 직접적인 영향을 줍니다.

## 이미지 최적화

### next/image 활용
\`\`\`tsx
<Image
  src="/hero.jpg"
  alt="설명적인 대체 텍스트"
  width={1200}
  height={630}
  priority // LCP 이미지에만 사용
  sizes="(max-width: 768px) 100vw, 50vw"
/>
\`\`\`

### 이미지 포맷
- AVIF > WebP > JPEG 순으로 자동 변환
- 반응형 이미지 sizes 속성 필수

## 폰트 최적화

\`next/font\`를 사용하면 CLS를 방지하고 로딩 속도를 개선합니다.

## JavaScript 최적화

### 코드 스플리팅
- 페이지별 자동 코드 스플리팅
- \`dynamic()\` 임포트로 비필수 컴포넌트 지연 로딩

### 서드파티 스크립트
- Google Analytics: 5초 지연 로딩
- AdSense: Intersection Observer로 lazy load

## 캐싱 전략

- 정적 자산: 1년 immutable 캐시
- ISR: 1시간 단위 재검증
- API 응답: 적절한 Cache-Control 헤더

## 결과

이 전략을 적용하면 Lighthouse Performance 95점 이상을 안정적으로 유지할 수 있습니다.
`,
    excerpt: 'Next.js 블로그의 Lighthouse 성능 점수를 100점으로 끌어올리는 구체적인 최적화 전략.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
    tags: 'Next.js,performance,Lighthouse,web-development',
    author: 'Template Author',
    seoTitle: 'Next.js 성능 최적화: Lighthouse 100점 달성하는 방법',
    seoDescription: 'Next.js 블로그 Lighthouse Performance 100점 달성 전략. 이미지, 폰트, JS 최적화와 캐싱 전략.',
    originalLanguage: 'ko',
  },
  {
    title: 'How to Build a High-Performance Blog with Next.js',
    slug: 'build-high-performance-blog-nextjs',
    content: `# How to Build a High-Performance Blog with Next.js

Building a blog that ranks on Google requires more than great content. It requires technical excellence.

## Architecture Decisions

### App Router vs Pages Router
The App Router provides better SEO capabilities with built-in metadata API and server components.

### Database Choice
SQLite for development, LibSQL/Turso for production. Simple, fast, and cost-effective.

### Styling
Tailwind CSS v4 for utility-first styling with minimal CSS bundle size.

## SEO Implementation

### Structured Data
Every page should include appropriate Schema.org markup:
- \`WebSite\` on homepage
- \`BlogPosting\` on articles
- \`BreadcrumbList\` for navigation

### Sitemap Generation
Combine static sitemap (next-sitemap) with dynamic server-sitemap for real-time updates.

### Meta Tags
Use Next.js Metadata API for type-safe, component-level meta tag management.

## Deployment

Vercel provides the best developer experience for Next.js:
- Automatic preview deployments
- Edge functions for OG image generation
- Built-in analytics

## Conclusion

A well-optimized blog is a long-term asset. Invest in the foundation, and the content will compound.
`,
    excerpt: 'A comprehensive guide to building a high-performance, SEO-optimized blog using Next.js App Router.',
    coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=630&fit=crop',
    tags: 'Next.js,performance,SEO,tutorial',
    author: 'Template Author',
    seoTitle: 'Build a High-Performance Blog with Next.js | Complete Guide',
    seoDescription: 'Step-by-step guide to building a high-performance, SEO-optimized blog using Next.js App Router, Prisma, and Tailwind CSS.',
    originalLanguage: 'en',
  },
  {
    title: '디지털 전환 시대의 기업 성장 전략',
    slug: 'digital-transformation-growth-strategy',
    content: `# 디지털 전환 시대의 기업 성장 전략

디지털 전환은 더 이상 선택이 아닌 생존의 문제입니다.

## 디지털 전환의 핵심 요소

### 1. 데이터 기반 의사결정
감에 의존하는 경영은 끝났습니다. 데이터가 모든 결정의 근거가 되어야 합니다.

### 2. 고객 경험 혁신
디지털 채널을 통한 원활한 고객 여정을 설계하세요.

### 3. 애자일 조직 문화
빠른 실험과 학습이 가능한 조직 구조가 필요합니다.

## 실행 전략

### 단계별 접근
1. **현재 상태 진단**: 디지털 성숙도 평가
2. **우선순위 설정**: ROI 기반 프로젝트 선정
3. **빠른 실험**: MVP로 검증 후 확대
4. **지속적 개선**: 데이터 기반 최적화

### 기술 스택 선택
- 클라우드 네이티브 아키텍처
- API-first 접근
- 자동화 도구 활용

## 성공 사례

디지털 전환에 성공한 기업들의 공통점은 기술이 아닌 문화의 변화에서 시작했다는 것입니다.

## 결론

디지털 전환의 성패는 기술 도입이 아닌, 조직 전체의 마인드셋 변화에 달려 있습니다.
`,
    excerpt: '디지털 전환 시대에 기업이 성장하기 위한 핵심 전략과 실행 방법.',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop',
    tags: 'digital-transformation,business,strategy',
    author: 'Template Author',
    seoTitle: '디지털 전환 시대의 기업 성장 전략 | 실행 가이드',
    seoDescription: '디지털 전환 시대 기업 성장 전략. 데이터 기반 의사결정, 고객 경험 혁신, 애자일 조직 문화 구축 방법.',
    originalLanguage: 'ko',
  },
]

async function main() {
  console.log('Seeding database with dummy posts...')

  // 기존 데이터 전부 삭제
  await prisma.postAffiliateProduct.deleteMany()
  await prisma.affiliateProduct.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.postTranslation.deleteMany()
  await prisma.post.deleteMany()
  await prisma.knowledge.deleteMany()

  console.log('Cleared all existing data.')

  // 더미 포스트 생성
  for (const post of dummyPosts) {
    const now = new Date()
    // 각 포스트마다 1일씩 과거로
    const publishedAt = new Date(now.getTime() - dummyPosts.indexOf(post) * 24 * 60 * 60 * 1000)

    await prisma.post.create({
      data: {
        ...post,
        status: 'PUBLISHED',
        publishedAt,
        views: Math.floor(Math.random() * 500) + 50,
      },
    })
    console.log(`  Created: ${post.title}`)
  }

  // 영어 포스트에 한국어 번역 추가 (다국어 데모)
  const englishPost = await prisma.post.findUnique({
    where: { slug: 'build-high-performance-blog-nextjs' },
  })

  if (englishPost) {
    await prisma.postTranslation.create({
      data: {
        postId: englishPost.id,
        locale: 'ko',
        title: 'Next.js로 고성능 블로그 만들기',
        content: '# Next.js로 고성능 블로그 만들기\n\n이 글은 영어 원문의 한국어 번역 데모입니다.',
        excerpt: 'Next.js App Router를 활용한 고성능 SEO 블로그 구축 가이드.',
      },
    })
    console.log('  Added Korean translation for English post.')
  }

  console.log(`\nDone! Seeded ${dummyPosts.length} posts.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
