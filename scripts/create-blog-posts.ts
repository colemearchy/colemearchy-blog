import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI('AIzaSyB3J13kN0Q5pOPrwpFM7CN8V8rOO5v7rV8')
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

// Colemearchy Golden Triangle 주제들
const blogTopics = [
  {
    category: '바이오해킹 & 최적화된 자아',
    title: 'Wegovy로 3개월 만에 15kg 감량: 솔직한 부작용과 효과 리뷰',
    tags: ['biohacking', 'wegovy', 'weight-loss', 'glp1', 'health'],
    focus: '개인적인 Wegovy 사용 경험, 부작용, 실제 체중 감량 데이터'
  },
  {
    category: '바이오해킹 & 최적화된 자아',
    title: 'ADHD 약물치료 6개월 후기: Adderall vs Concerta 직접 비교',
    tags: ['adhd', 'mental-health', 'productivity', 'biohacking'],
    focus: 'ADHD 진단 과정, 약물 비교, 생산성 변화'
  },
  {
    category: '스타트업 아키텍트',
    title: 'GPT-4로 SEO 콘텐츠 자동화하기: 월 1000만 트래픽 달성 전략',
    tags: ['seo', 'ai', 'content-marketing', 'automation', 'startup'],
    focus: 'AI 콘텐츠 생성 파이프라인 구축, SEO 최적화 팁'
  },
  {
    category: '스타트업 아키텍트',
    title: '스타트업 MVP를 2주 만에 런칭하는 No-Code 스택 가이드',
    tags: ['startup', 'no-code', 'mvp', 'bubble', 'webflow'],
    focus: 'No-code 툴 선택, MVP 개발 프로세스, 실제 사례'
  },
  {
    category: '주권적 마음',
    title: '디지털 노마드로 연 $200K 벌기: 세금 최적화 전략',
    tags: ['digital-nomad', 'tax', 'investment', 'freedom', 'finance'],
    focus: '해외 법인 설정, 세금 최적화, 투자 전략'
  },
  {
    category: '바이오해킹 & 최적화된 자아',
    title: '케토제닉 다이어트 90일: 혈당과 인슐린 저항성 개선 데이터',
    tags: ['keto', 'diet', 'health', 'biohacking', 'data'],
    focus: '케토 실험 데이터, 혈액 검사 결과, 실제 식단'
  },
  {
    category: '스타트업 아키텍트',
    title: 'Y Combinator가 가르쳐준 것: 실패한 스타트업의 5가지 교훈',
    tags: ['yc', 'startup', 'failure', 'lessons', 'entrepreneurship'],
    focus: 'YC 경험, 실패 원인 분석, 다시 시작하는 법'
  },
  {
    category: '주권적 마음',
    title: '비트코인과 무정부주의: 탈중앙화가 가져올 진짜 자유',
    tags: ['bitcoin', 'crypto', 'anarchism', 'freedom', 'philosophy'],
    focus: '암호화폐 철학, 정부 독립성, 개인 주권'
  },
  {
    category: '바이오해킹 & 최적화된 자아',
    title: '목 디스크 수술 없이 치료하기: 6개월 재활 프로토콜',
    tags: ['health', 'neck-pain', 'rehabilitation', 'biohacking'],
    focus: '목 통증 원인, 재활 운동, 자세 교정 팁'
  },
  {
    category: '스타트업 아키텍트',
    title: 'Claude 3.5로 코딩 생산성 10배 높이기: 실전 프롬프트 엔지니어링',
    tags: ['ai', 'claude', 'productivity', 'coding', 'prompt-engineering'],
    focus: '실제 사용 사례, 프롬프트 템플릿, 워크플로우 최적화'
  }
]

async function generateBlogPost(topic: typeof blogTopics[0], retries = 3): Promise<any> {
  const prompt = `
너는 Colemearchy라는 블로그의 저자야. 너의 페르소나는:
- 30대 중반 테크 기업가/개발자
- 날것의 솔직함, 지적이고 약간 반항적(무정부주의 철학)
- 개인적 일화(불안, ADHD, 목 통증, 다이어트 여정)와 전문적 통찰력의 결합
- 25-40대 테크/금융/창의 산업 종사자가 타겟

다음 주제로 블로그 글을 작성해줘:
제목: ${topic.title}
카테고리: ${topic.category}
포커스: ${topic.focus}
태그: ${topic.tags.join(', ')}

요구사항:
1. 개인적인 경험과 데이터를 결합한 스토리텔링
2. 실행 가능한 구체적인 조언 포함
3. SEO 최적화된 구조 (H2, H3 헤딩 사용)
4. 2000-3000 단어 분량
5. 자연스러운 제휴 제품 언급 (관련 있을 경우)
6. Markdown 형식으로 작성

반드시 포함할 것:
- 도입부: 개인적인 고민이나 문제 제시
- 본문: 구체적인 해결 과정과 데이터
- 결론: 핵심 인사이트와 행동 지침
`

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const content = result.response.text()
      
      // Extract excerpt (first paragraph without markdown)
      const excerptMatch = content.match(/^[^#\n]+/m)
      const excerpt = excerptMatch 
        ? excerptMatch[0].trim().substring(0, 200) + '...'
        : topic.focus

      // Generate SEO optimized title and description
      const seoTitle = `${topic.title} | Colemearchy`
      const seoDescription = excerpt.substring(0, 160)

      // Create slug from title
      const slug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      return {
        title: topic.title,
        slug,
        content,
        excerpt,
        tags: topic.tags,
        seoTitle,
        seoDescription,
        publishedAt: null, // Will be scheduled later
        status: 'DRAFT'
      }
    } catch (error: any) {
      console.error(`Failed to generate post for topic: ${topic.title} (attempt ${attempt}/${retries})`, error)
      
      if (attempt < retries && error.status === 503) {
        // Wait longer between retries for 503 errors
        console.log(`Waiting ${attempt * 5} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 5000))
      } else {
        throw error
      }
    }
  }
}

async function createBlogPosts() {
  console.log('📡 블로그 포스트 생성 시작...')
  
  for (let i = 0; i < blogTopics.length; i++) {
    const topic = blogTopics[i]
    console.log(`\n🔍 [${i + 1}/10] "${topic.title}" 글 생성 중...`)
    
    try {
      // Generate blog post content
      const postData = await generateBlogPost(topic)
      
      // Create post via API
      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      const createdPost = await response.json()
      console.log(`✅ 포스트 생성 완료: ${createdPost.slug}`)
      
      // Rate limiting - wait 5 seconds between posts to avoid overloading
      if (i < blogTopics.length - 1) {
        console.log('⏳ 다음 포스트 생성까지 5초 대기 중...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    } catch (error) {
      console.error(`❌ 포스트 생성 실패:`, error)
    }
  }
  
  console.log('\n🎉 모든 블로그 포스트 생성 완료!')
}

// Run if called directly
if (require.main === module) {
  createBlogPosts().catch(console.error)
}

export { createBlogPosts }