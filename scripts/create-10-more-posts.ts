import fetch from 'node-fetch'

const topics = [
  {
    prompt: "Perplexity AI로 리서치 시간 90% 단축하기: 학술 논문부터 시장 조사까지. ChatGPT와의 차별화 포인트.",
    keywords: ["perplexity ai", "research", "productivity", "ai tools", "market research"],
  },
  {
    prompt: "아침 루틴 최적화: 새벽 4시 기상에서 얻은 인사이트. 수면 사이클, 운동, 명상의 황금 비율.",
    keywords: ["morning routine", "새벽기상", "productivity", "sleep cycle", "meditation"],
  },
  {
    prompt: "Cloudflare Workers로 엣지 컴퓨팅 입문: 글로벌 레이턴시 문제 해결 사례. Vercel Edge와 비교.",
    keywords: ["cloudflare workers", "edge computing", "latency", "serverless", "performance"],
  },
  {
    prompt: "비타민 D 결핍 해결 프로토콜: 혈중 농도 15에서 50으로 올린 6개월 여정. 용량과 흡수율 최적화.",
    keywords: ["vitamin d", "비타민d", "건강", "보충제", "deficiency"],
  },
  {
    prompt: "Turborepo로 모노레포 구축하기: 스타트업에서 대규모 프로젝트까지. Nx와의 비교 분석.",
    keywords: ["turborepo", "monorepo", "nx", "project management", "development"],
  },
  {
    prompt: "단식과 오토파지: 72시간 단식 경험과 세포 재생 효과. 케톤 수치와 정신적 명료함의 상관관계.",
    keywords: ["fasting", "autophagy", "단식", "오토파지", "ketosis"],
  },
  {
    prompt: "Zod와 TypeScript로 런타임 타입 안정성 확보하기: API 검증부터 폼 핸들링까지 실전 가이드.",
    keywords: ["zod", "typescript", "type safety", "api validation", "runtime"],
  },
  {
    prompt: "창업 3년차의 정신건강 관리법: 불확실성과 스트레스 속에서 균형 찾기. 실패와 성공의 감정 롤러코스터.",
    keywords: ["startup", "mental health", "창업", "스트레스관리", "founder"],
  },
  {
    prompt: "Neovim 설정 완벽 가이드: VS Code에서 갈아탄 이유와 생산성 향상 팁. LSP와 플러그인 추천.",
    keywords: ["neovim", "vim", "vscode", "editor", "productivity"],
  },
  {
    prompt: "미토콘드리아 건강과 에너지 대사: NAD+, CoQ10, PQQ 보충제 스택의 시너지 효과. 3개월 실험 결과.",
    keywords: ["mitochondria", "nad+", "coq10", "pqq", "energy metabolism"],
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
  const uniqueSlug = `${data.slug}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  
  const postData = {
    title: data.title,
    slug: uniqueSlug,
    content: data.content,
    excerpt: data.excerpt,
    author: data.author,
    tags: data.tags,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    status: 'PUBLISHED',
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
  console.log('📡 블로그 포스트 10개 추가 생성 시작...\n')
  
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