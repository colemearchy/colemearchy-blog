// Simple script to create blog posts using the existing API

const blogTopics = [
  {
    prompt: "Wegovy로 3개월 만에 15kg 감량한 솔직한 후기. 부작용, 실제 효과, 비용 분석.",
    keywords: ["wegovy", "glp-1", "체중감량", "비만치료", "위고비 후기"],
  },
  {
    prompt: "ADHD 약물치료 6개월 경험. Adderall vs Concerta 직접 비교 분석.",
    keywords: ["adhd", "adderall", "concerta", "집중력", "adhd 치료"],
  },
  {
    prompt: "GPT-4로 SEO 콘텐츠 자동화하여 월 1000만 트래픽 달성한 전략 공개",
    keywords: ["gpt-4", "seo", "콘텐츠 자동화", "트래픽", "ai 마케팅"],
  },
  {
    prompt: "스타트업 MVP를 2주 만에 런칭하는 No-Code 스택 가이드",
    keywords: ["no-code", "mvp", "스타트업", "bubble", "webflow"],
  },
  {
    prompt: "디지털 노마드로 연 $200K 벌면서 세금 최적화하는 방법",
    keywords: ["디지털노마드", "세금최적화", "해외법인", "원격근무", "프리랜서"],
  },
  {
    prompt: "케토제닉 다이어트 90일 실험. 혈당과 인슐린 저항성 개선 데이터 공개",
    keywords: ["케토", "keto", "저탄고지", "혈당", "인슐린저항성"],
  },
  {
    prompt: "Y Combinator가 가르쳐준 것: 실패한 스타트업의 5가지 교훈",
    keywords: ["yc", "y combinator", "스타트업 실패", "창업", "교훈"],
  },
  {
    prompt: "비트코인과 무정부주의: 탈중앙화가 가져올 진짜 자유에 대한 철학적 고찰",
    keywords: ["비트코인", "bitcoin", "무정부주의", "탈중앙화", "암호화폐"],
  },
  {
    prompt: "목 디스크 수술 없이 치료한 6개월 재활 프로토콜 상세 가이드",
    keywords: ["목디스크", "거북목", "재활운동", "목통증", "일자목"],
  },
  {
    prompt: "Claude 3.5로 코딩 생산성 10배 높이기: 실전 프롬프트 엔지니어링 가이드",
    keywords: ["claude", "ai coding", "프롬프트 엔지니어링", "개발 생산성", "코딩"],
  }
]

async function createPosts() {
  console.log('📡 블로그 포스트 생성 시작...')
  
  // First, let's check if the server is running
  try {
    const healthCheck = await fetch('http://localhost:3001/api/posts')
    if (!healthCheck.ok) {
      console.error('❌ 서버가 응답하지 않습니다. 서버가 실행 중인지 확인해주세요.')
      return
    }
  } catch (error) {
    console.error('❌ 서버에 연결할 수 없습니다. 다음 명령으로 서버를 실행해주세요:')
    console.error('   pnpm dev')
    return
  }

  for (let i = 0; i < blogTopics.length; i++) {
    const topic = blogTopics[i]
    console.log(`\n🔍 [${i + 1}/10] "${topic.prompt.substring(0, 50)}..." 생성 중...`)
    
    try {
      const response = await fetch('http://localhost:3001/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: topic.prompt,
          keywords: topic.keywords,
          affiliateProducts: [], // 필요시 제휴 상품 추가
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const content = await response.json()
      console.log(`✅ 콘텐츠 생성 완료: ${content.title}`)
      
      // Save the post
      const postResponse = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: content.title,
          slug: content.slug,
          content: content.content,
          excerpt: content.excerpt,
          tags: content.tags,
          seoTitle: content.seoTitle,
          seoDescription: content.seoDescription,
          coverImage: content.coverImage,
          publishedAt: new Date().toISOString(), // 즉시 발행
        }),
      })

      if (!postResponse.ok) {
        const error = await postResponse.json()
        throw new Error(error.error || 'Failed to create post')
      }

      const savedPost = await postResponse.json()
      console.log(`✅ 포스트 저장 완료: ${savedPost.slug}`)
      
      // Rate limiting
      if (i < blogTopics.length - 1) {
        console.log('⏳ 다음 포스트까지 3초 대기...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`❌ 오류 발생:`, error)
    }
  }
  
  console.log('\n🎉 모든 블로그 포스트 생성 완료!')
}

// Run the script
createPosts().catch(console.error)