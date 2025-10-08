const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const blogTopics = [
  "클로드 프로젝트 기능 활용법: AI와 함께 일하는 새로운 방식",
  "v0.dev로 10분만에 MVP 만들기: 실전 가이드",
  "개발자가 알아야 할 프롬프트 엔지니어링 기초",
  "Windsurf IDE vs Cursor: 어떤 AI 코딩 도구를 선택할까",
  "개발자의 생산성을 200% 올리는 AI 도구 모음",
  "LLM 파인튜닝 입문: 나만의 AI 모델 만들기",
  "벡터 데이터베이스 완벽 가이드: RAG 시스템 구축하기",
  "AI 시대의 개발자 커리어 로드맵 2025",
  "노코드 AI 툴로 SaaS 만들어서 월 1000만원 벌기",
  "개발자를 위한 AI 에이전트 활용 실전 가이드"
];

function generateSlug(title) {
  const timestamp = Date.now();
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  
  return `${cleanTitle || 'post'}-${timestamp}`;
}

async function generateBlogPost(title, index) {
  try {
    console.log(`\n[${index + 1}/10] Generating: ${title}`);
    
    const now = new Date();
    const publishDate = new Date(now.getTime() + (index + 1) * 2 * 60 * 60 * 1000);
    
    const prompt = `당신은 Colemearchy 블로그의 작가입니다.

제목: ${title}

이 주제로 블로그 글을 작성해주세요:

요구사항:
1. 마크다운 형식으로 작성
2. 최소 2000자 이상
3. 개인적인 경험과 실전 팁 포함
4. 실용적이고 구체적인 내용
5. 코드 예시나 실제 사례 포함

스타일:
- 솔직하고 직설적인 톤
- 전문적이면서도 친근한 어투
- 실제 경험을 바탕으로 한 조언

구조:
1. 흥미로운 도입부 (개인적 경험)
2. 문제 정의와 중요성
3. 구체적인 해결 방법 (단계별)
4. 실전 팁과 주의사항
5. 미래 전망과 마무리

마크다운 본문만 작성해주세요. JSON이나 다른 형식은 사용하지 마세요.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    
    const content = result.response.text();
    
    // Extract first paragraph as excerpt
    const excerptMatch = content.match(/[^#\n].*?[.!?]/);
    const excerpt = excerptMatch ? excerptMatch[0].substring(0, 160) : content.substring(0, 160);
    
    const slug = generateSlug(title);
    
    const post = await prisma.post.create({
      data: {
        title: title,
        slug: slug,
        content: content,
        excerpt: excerpt,
        tags: ["AI", "개발", "생산성", "기술"],
        seoTitle: title.substring(0, 60),
        seoDescription: excerpt.substring(0, 160),
        status: 'DRAFT',
        scheduledAt: publishDate,
        author: 'Colemearchy',
        originalLanguage: 'ko',
        publishedAt: null
      }
    });

    console.log(`✅ Success: ${post.title}`);
    console.log(`   Scheduled for: ${publishDate.toLocaleString()}`);
    console.log(`   URL: https://colemearchy.com/posts/${post.slug}`);
    
    return { success: true, post };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('📝 Generating 10 blog posts...\n');
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (let i = 0; i < blogTopics.length; i++) {
    const result = await generateBlogPost(blogTopics[i], i);
    
    if (result.success) {
      results.successful.push(result.post);
    } else {
      results.failed.push({ title: blogTopics[i], error: result.error });
    }
    
    // Wait between requests
    if (i < blogTopics.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.successful.length > 0) {
    console.log('\n🔗 Created posts:');
    results.successful.forEach(p => {
      console.log(`   ${p.title}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());