import fetch from 'node-fetch'

const topics = [
  {
    prompt: "Claude AI로 코드 리뷰 자동화하여 개발 생산성 3배 높인 방법. PR 리뷰 시간을 하루 3시간에서 30분으로 줄인 실제 사례와 프롬프트 공유.",
    keywords: ["claude ai", "code review", "개발 생산성", "automation", "pr review"],
  },
  {
    prompt: "불면증 극복기: 수면제 없이 자연스럽게 잠드는 7가지 바이오해킹. Magnesium, L-theanine, 블루라이트 차단까지 직접 실험한 결과.",
    keywords: ["불면증", "수면", "바이오해킹", "magnesium", "sleep optimization"],
  },
  {
    prompt: "Vercel Edge Functions로 서버리스 API 구축하여 월 비용 0원 달성. AWS Lambda 대비 장단점과 실전 마이그레이션 가이드.",
    keywords: ["vercel", "edge functions", "serverless", "api", "cost optimization"],
  },
  {
    prompt: "테스토스테론 수치 400에서 800으로 올린 자연적인 방법들. 운동, 영양, 수면 최적화로 활력 되찾은 6개월 프로젝트.",
    keywords: ["testosterone", "테스토스테론", "남성건강", "hormone", "biohacking"],
  },
  {
    prompt: "ChatGPT vs Claude vs Gemini: 실제 업무에서 6개월간 사용해본 비교 분석. 각 AI의 강점과 약점, 그리고 최적의 활용법.",
    keywords: ["chatgpt", "claude", "gemini", "ai tools", "productivity"],
  },
  {
    prompt: "원격근무 5년차가 알려주는 디지털 노마드 현실. 발리, 리스본, 서울을 오가며 일한 경험과 실용적인 팁.",
    keywords: ["remote work", "digital nomad", "원격근무", "노마드", "work life balance"],
  },
  {
    prompt: "Notion에서 Obsidian으로 갈아탄 이유. Second Brain 구축을 위한 최적의 도구 선택과 마이그레이션 과정.",
    keywords: ["notion", "obsidian", "second brain", "pkm", "knowledge management"],
  },
  {
    prompt: "스타트업 Exit 후 번아웃. 성공 뒤에 찾아온 공허함과 새로운 의미 찾기. 돈이 행복을 가져다주지 않는 이유.",
    keywords: ["startup exit", "번아웃", "burnout", "성공후우울증", "meaning"],
  },
  {
    prompt: "TypeScript 5.0 신기능으로 코드베이스 30% 줄이기. Decorators, const type parameters 실전 활용법.",
    keywords: ["typescript", "typescript 5", "코드 최적화", "decorators", "type safety"],
  },
  {
    prompt: "간헐적 단식 2년 후기: 16:8에서 OMAD까지. 체중 감량을 넘어선 정신적 명료함과 에너지 레벨의 변화.",
    keywords: ["간헐적단식", "intermittent fasting", "omad", "fasting", "health"],
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
  // 고유한 slug 생성을 위해 timestamp 추가
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
    status: 'DRAFT',
    originalLanguage: 'ko',
    publishedAt: new Date().toISOString(),
  }

  console.log('Creating post with data:', {
    title: postData.title,
    slug: postData.slug,
    youtubeVideoId: data.youtubeVideoId,
    tags: postData.tags,
    publishedAt: postData.publishedAt,
  })

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
  console.log('📡 블로그 포스트 생성 시작...\n')
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    console.log(`🔍 [${i + 1}/${topics.length}] "${topic.prompt.substring(0, 60)}..." 생성 중...`)
    
    try {
      // 콘텐츠 생성
      const generatedContent = await generateContent(topic.prompt, topic.keywords)
      console.log(`✅ 콘텐츠 생성 완료: ${generatedContent.title}\n`)
      
      // 포스트 생성
      const post = await createPost(generatedContent)
      console.log(`✅ 포스트 생성 완료: ${post.title} (${post.slug})\n`)
      
      // API 레이트 리밋 방지를 위한 딜레이
      await delay(2000)
      
    } catch (error) {
      console.error(`❌ 오류 발생: ${error}`)
      // 에러 발생 시 계속 진행
      continue
    }
  }
  
  console.log('\n🎉 모든 블로그 포스트 생성 완료!')
}

// 실행
createPosts().catch(console.error)