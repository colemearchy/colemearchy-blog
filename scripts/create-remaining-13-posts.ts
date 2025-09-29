import fetch from 'node-fetch'

// 기존 스크립트에서 처음 2개는 이미 생성되었으므로 나머지 13개 주제만 사용
const topics = [
  {
    prompt: "Supabase vs Firebase: 스타트업이 선택해야 할 백엔드 서비스 비교 분석. 실제 마이그레이션 경험과 비용 분석.",
    keywords: ["supabase", "firebase", "backend", "baas", "startup"],
  },
  {
    prompt: "크레아틴 복용 6개월 후기: 근력, 인지 능력, 그리고 예상치 못한 부작용들. 혈액 검사 결과와 함께.",
    keywords: ["크레아틴", "creatine", "supplement", "근력", "cognitive"],
  },
  {
    prompt: "GitHub Copilot X vs Cursor: AI 코딩 도구 전격 비교. 실제 프로젝트에서의 생산성 측정 결과.",
    keywords: ["github copilot", "cursor", "ai coding", "productivity", "개발도구"],
  },
  {
    prompt: "발리에서 한 달 살기: 디지털 노마드의 현실적인 비용과 인프라 가이드. 코워킹 스페이스부터 비자까지.",
    keywords: ["발리", "디지털노마드", "bali", "remote work", "cost of living"],
  },
  {
    prompt: "Rust로 웹 개발하기: Actix-web vs Rocket 프레임워크 비교. Go에서 마이그레이션한 이유와 성능 벤치마크.",
    keywords: ["rust", "actix-web", "rocket", "web development", "performance"],
  },
  {
    prompt: "우울증과 창업: 정신 건강을 지키며 회사를 성장시키는 방법. 번아웃 예방과 지속 가능한 성장 전략.",
    keywords: ["우울증", "창업", "mental health", "burnout", "startup life"],
  },
  {
    prompt: "Web3와 AI의 결합: 탈중앙화 AI 프로젝트들의 가능성과 한계. 투자 관점에서 본 미래 전망.",
    keywords: ["web3", "ai", "blockchain", "decentralized ai", "투자"],
  },
  {
    prompt: "맨발 걷기와 접지(Grounding)의 과학: 염증 감소와 수면 개선 효과. 6개월간의 자가 실험 결과.",
    keywords: ["맨발걷기", "grounding", "earthing", "inflammation", "sleep"],
  },
  {
    prompt: "Tailwind CSS 4.0 알파 버전 사용기: 새로운 기능과 마이그레이션 가이드. 실제 프로젝트 적용 경험.",
    keywords: ["tailwind css", "css", "frontend", "web design", "tailwind 4"],
  },
  {
    prompt: "스타트업 M&A 실패 경험담: 실사 과정에서 놓친 것들과 배운 교훈. 다음을 위한 체크리스트.",
    keywords: ["m&a", "스타트업", "exit", "실사", "due diligence"],
  },
  {
    prompt: "NAD+ 보충제와 노화 방지: NMN vs NR 직접 비교 실험. 3개월 복용 후 바이오마커 변화 분석.",
    keywords: ["nad+", "nmn", "nr", "anti-aging", "노화방지"],
  },
  {
    prompt: "Prisma vs Drizzle ORM: Next.js 프로젝트를 위한 최적의 선택. 성능, DX, 타입 안정성 비교.",
    keywords: ["prisma", "drizzle", "orm", "nextjs", "database"],
  },
  {
    prompt: "소셜 미디어 디톡스 100일: 도파민 시스템 리셋과 집중력 회복 과정. 생산성과 정신 건강의 극적인 변화.",
    keywords: ["디지털디톡스", "도파민", "소셜미디어", "집중력", "productivity"],
  },
]

async function generateContent(prompt: string, keywords: string[]) {
  const response = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      keywords: keywords,
      affiliateProducts: [],
    }),
  })

  if (!response.ok) {
    throw new Error(`API 응답 오류: ${response.status}`)
  }

  return await response.json()
}

async function createPost(data: any) {
  const uniqueSlug = `${data.slug}-${Date.now()}`
  
  const postData = {
    title: data.title,
    slug: uniqueSlug,
    content: data.content,
    excerpt: data.excerpt,
    author: data.author,
    tags: data.tags,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    status: 'PUBLISHED', // 바로 발행 상태로 설정
    originalLanguage: 'ko',
    publishedAt: new Date().toISOString(),
  }

  const response = await fetch('http://localhost:3001/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`포스트 생성 실패: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createPosts() {
  console.log('📡 블로그 포스트 13개 추가 생성 시작...\n')
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    console.log(`🔍 [${i + 1}/${topics.length}] "${topic.prompt.substring(0, 60)}..." 생성 중...`)
    
    try {
      // 콘텐츠 생성
      const generatedContent = await generateContent(topic.prompt, topic.keywords)
      console.log(`✅ 콘텐츠 생성 완료: ${generatedContent.title}`)
      
      // 포스트 생성 (PUBLISHED 상태로)
      const post = await createPost(generatedContent)
      console.log(`✅ 포스트 발행 완료: ${post.title} (${post.slug})\n`)
      successCount++
      
      // API 레이트 리밋 방지를 위한 딜레이
      await delay(3000)
      
    } catch (error) {
      console.error(`❌ 오류 발생: ${error}`)
      failCount++
      // 에러 발생 시에도 계속 진행
      continue
    }
  }
  
  console.log(`\n🎉 작업 완료!`)
  console.log(`✅ 성공: ${successCount}개`)
  console.log(`❌ 실패: ${failCount}개`)
  console.log(`📊 총계: ${successCount + failCount}개 중 ${successCount}개 발행됨`)
}

// 실행
createPosts().catch(console.error)