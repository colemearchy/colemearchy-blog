import fetch from 'node-fetch'

// 완전히 새로운 주제 9개
const topics = [
  {
    prompt: "리눅스에서 맥으로 갈아탄 개발자의 1년 후기. 생산성 도구와 워크플로우 최적화 팁. Homebrew부터 Raycast까지.",
    keywords: ["mac", "macos", "linux", "개발환경", "productivity"],
  },
  {
    prompt: "콜드 플런지와 사우나 교대욕의 효과: 면역력 강화와 스트레스 해소. 6개월간의 데이터와 체감 변화.",
    keywords: ["cold plunge", "사우나", "면역력", "스트레스", "biohacking"],
  },
  {
    prompt: "Bun vs Node.js 실전 비교: 프로덕션 환경에서의 성능과 호환성. 마이그레이션 가이드와 주의사항.",
    keywords: ["bun", "nodejs", "javascript runtime", "performance", "backend"],
  },
  {
    prompt: "L-테아닌과 카페인 조합의 최적 비율 찾기: 집중력 향상을 위한 3개월 실험. 용량별 효과 측정.",
    keywords: ["l-theanine", "caffeine", "nootropics", "집중력", "productivity"],
  },
  {
    prompt: "Next.js 15 App Router 마이그레이션 완전 가이드: Pages Router에서 전환 시 겪은 시행착오들.",
    keywords: ["nextjs 15", "app router", "migration", "react", "frontend"],
  },
  {
    prompt: "독립형 AI 에이전트 만들기: AutoGPT와 BabyAGI를 활용한 자동화 시스템 구축 경험.",
    keywords: ["ai agents", "autogpt", "babyagi", "automation", "ai"],
  },
  {
    prompt: "미네랄 보충과 전해질 균형: 케토 플루를 피하고 에너지 레벨 유지하는 방법. 마그네슘, 포타슘, 소금의 황금 비율.",
    keywords: ["minerals", "electrolytes", "keto flu", "에너지", "health"],
  },
  {
    prompt: "Obsidian 플러그인 개발 입문: 나만의 생산성 도구 만들기. TypeScript와 Obsidian API 활용법.",
    keywords: ["obsidian", "plugin development", "typescript", "productivity", "pkm"],
  },
  {
    prompt: "스타트업 원격 문화 구축하기: 비동기 커뮤니케이션과 문서화의 중요성. Notion과 Slack 활용 전략.",
    keywords: ["remote culture", "async communication", "documentation", "startup", "management"],
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
  const uniqueSlug = `${data.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  
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
  console.log('📡 마지막 블로그 포스트 9개 생성 시작...\n')
  
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