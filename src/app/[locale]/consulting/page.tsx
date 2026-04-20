import Link from 'next/link'
import { Metadata } from 'next'
import { navigationItems } from '@/lib/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'

  return {
    title: isEn ? 'Consulting - Cole' : '컨설팅 - Cole',
    description: isEn 
      ? 'Custom IT consulting and development services by Cole' 
      : 'Cole의 맞춤형 IT 컨설팅 및 개발 서비스',
  }
}

const problems = {
  ko: [
    {
      id: 1,
      problem: "내부 데이터 활용이 어렵나요?",
      solution: "SQL 지식 없이 자연어로 데이터를 조회하고 시각화합니다.",
      description: "DBeaver 기반에 LLM을 결합하여, 모든 팀원이 자연어로 쿼리하고 원하는 결과를 즉시 얻을 수 있는 시스템을 구축합니다.",
    },
    {
      id: 2,
      problem: "광고 소재 제작 리소스가 부족한가요?",
      solution: "기획안만으로 일관성 있는 광고 소재를 자동 생성합니다.",
      description: "기존 광고 소재를 학습한 AI가 마케팅 기획안을 바탕으로 영상/이미지 소재를 대량으로 제작할 수 있게 돕습니다.",
    },
    {
      id: 3,
      problem: "오가닉 트래픽을 늘리고 싶으신가요?",
      solution: "구글 상위 노출에 최적화된 블로그 자동화 시스템을 구축합니다.",
      description: "Lighthouse 100점 만점의 기술적 SEO가 완비된 블로그를 구축하고, AI가 매일 최적화된 콘텐츠를 자동 발행합니다.",
    },
    {
      id: 4,
      problem: "데이터 기반 전략 수립이 막막하신가요?",
      solution: "광고 데이터를 AI가 분석하여 최적의 전략을 제안합니다.",
      description: "마케팅 전문 인스트럭션이 학습된 AI가 광고 데이터를 분석하여 목표 달성을 위한 예산 및 매체 전략을 도출합니다.",
    },
    {
      id: 5,
      problem: "SNS 채널 운영이 부담되시나요?",
      solution: "SNS 포스팅을 AI로 자동화하여 운영 리소스를 최소화합니다.",
      description: "채널 특성에 맞는 AI 페르소나를 설정하고, 매일 자동으로 고퀄리티 포스팅이 업로드되는 시스템을 운영합니다.",
    },
  ],
  en: [
    {
      id: 1,
      problem: "Struggling with internal data access?",
      solution: "Query and visualize data in natural language, no SQL needed.",
      description: "Integrating LLMs with database structures allows any team member to get insights just by asking questions.",
    },
    {
      id: 2,
      problem: "Lack of resources for ad creatives?",
      solution: "Automatically generate consistent ad assets from just a brief.",
      description: "AI trained on your best-performing ads creates new variations, enabling massive scaling without editing skills.",
    },
    {
      id: 3,
      problem: "Want to grow organic traffic?",
      solution: "Build an automated SEO blog system optimized for Google rankings.",
      description: "Custom-developed blogs with perfect Lighthouse scores and AI-driven daily content generation.",
    },
    {
      id: 4,
      problem: "Unsure about your marketing strategy?",
      solution: "AI analyzes ad data to propose optimal growth strategies.",
      description: "Specialized AI instructions process your data to suggest budget allocation and media strategies based on real performance.",
    },
    {
      id: 5,
      problem: "Overwhelmed by SNS management?",
      solution: "Minimize operation resources with AI-driven auto-posting.",
      description: "Setup AI personas that automatically create and schedule high-quality posts tailored to platforms like Threads.",
    },
  ],
};

const profile = {
  ko: {
    name: "Cole (안현준)",
    intro: "비즈니스 실무자가 직접 사용하는 AI와 자동화 시스템을 만듭니다.",
    career: [
      "콜잇AI - AI 실무 교육 유튜버 (2025.08~)",
      "인톡 - Operation Lead (2026.04~)",
      "셀피쉬클럽 - 초기 멤버 (2023.03~)",
      "마켓핏랩 - 그로스PM (2022.03~)",
      "AI 스타트업 초기멤버 & 이사 (2020.03~)",
    ],
    education: [
      "홍익대학교 산업디자인학과 졸업",
      "AC2(애자일 코칭 제곱) 48기 수료",
      "Webflow 전 자격증 취득",
    ],
  },
  en: {
    name: "Cole (Hyunjun An)",
    intro: "Building AI and automation systems that business practitioners actually use.",
    career: [
      "Cole AI - AI Practitioner YouTuber (Aug 2025~)",
      "Intalk - Operation Lead (Apr 2026~)",
      "Selfish Club - Early Member (Mar 2023~)",
      "MarketFitLab - Growth PM (Mar 2022~)",
      "AI Startup Co-founder & Director (Mar 2020~)",
    ],
    education: [
      "B.A. Industrial Design, Hongik University",
      "AC2 (Agile Coaching Squared) 48th Cohort",
      "Webflow Certified Professional",
    ],
  },
};

export default async function ConsultingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  const isEn = lang === 'en'

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href={`/${locale}`} className="text-2xl font-bold tracking-tight">
              CMA
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                <Link
                  href={`/ko/consulting`}
                  className={`px-3 py-1 text-xs font-semibold rounded ${lang === 'ko' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  KO
                </Link>
                <Link
                  href={`/en/consulting`}
                  className={`px-3 py-1 text-xs font-semibold rounded ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  EN
                </Link>
              </div>
            </div>
          </div>
          <nav className="flex gap-6 pb-4">
            {navigationItems[lang].map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href === '/' ? '' : item.href}`}
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/consulting`}
              className="text-sm font-bold text-gray-900 border-b-2 border-gray-900 pb-4 -mb-4"
            >
              {isEn ? 'Consulting' : '컨설팅'}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-gray-400 mb-4 tracking-widest uppercase">
                {isEn ? 'IT Consulting & Development' : 'IT 컨설팅 & 외주 개발'}
              </h2>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8 leading-tight">
                {isEn 
                  ? 'Solving complex business problems with AI and technology.' 
                  : '비즈니스의 복잡한 문제를\nAI와 기술로 해결합니다.'}
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed break-keep">
                {isEn
                  ? 'We design and build custom automation systems that eliminate repetitive tasks and create new business opportunities.'
                  : '반복적인 업무는 줄이고, 데이터와 기술을 통해 새로운 비즈니스 기회를 창출하는 맞춤형 자동화 시스템을 설계하고 구축합니다.'}
              </p>
              <Link 
                href="mailto:cole.hkg@gmail.com"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                {isEn ? 'Get in Touch' : '문의하기'}
              </Link>
            </div>
          </div>
        </section>

        {/* Problems & Solutions Section */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {isEn ? 'What can we solve?' : '어떤 고민이 있으신가요?'}
              </h2>
              <p className="text-gray-500 text-lg">
                {isEn 
                  ? 'We provide tailored solutions for common business growth bottlenecks.' 
                  : '비즈니스 성장의 병목이 되는 지점들을 맞춤형으로 해결합니다.'}
              </p>
            </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {problems[lang].map((item) => (
                  <div key={item.id} className="group p-8 rounded-2xl border border-gray-100 bg-white hover:border-gray-900 hover:text-white transition-all duration-300">
                    <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold group-hover:bg-white/10 group-hover:text-white transition-colors">
                      0{item.id}
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-tight group-hover:text-gray-300">
                      {item.problem}
                    </h3>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-white transition-colors">
                      {item.solution}
                    </h4>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                ))}
              
              {/* Additional Service Card */}
              <div className="p-8 rounded-2xl border border-dashed border-gray-300 flex flex-col justify-center items-center text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {isEn ? 'Something else?' : '그 외의 고민이 있으신가요?'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {isEn ? 'Tell us about your specific business process.' : '귀사의 구체적인 비즈니스 프로세스를 말씀해 주세요.'}
                </p>
                <Link href="mailto:cole.hkg@gmail.com" className="text-gray-900 font-bold underline underline-offset-4">
                  {isEn ? 'Custom Inquiry' : '별도 문의하기'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Profile & Achievements Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-400 mb-4 tracking-widest uppercase">
                  {isEn ? 'About Cole' : '성과 및 이력'}
                </h2>
                <h3 className="text-4xl font-extrabold mb-8">
                  {profile[lang].name}
                </h3>
                <p className="text-xl text-gray-300 mb-12 break-keep">
                  {profile[lang].intro}
                </p>
                
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{isEn ? 'Career' : '경력'}</h4>
                    <ul className="space-y-3">
                      {profile[lang].career.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-gray-500 mt-1">•</span>
                          <span className="text-gray-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{isEn ? 'Education & Skills' : '학력 및 활동'}</h4>
                    <ul className="space-y-3">
                      {profile[lang].education.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-gray-500 mt-1">•</span>
                          <span className="text-gray-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-8 sm:p-12 rounded-3xl">
                <h3 className="text-2xl font-bold mb-8">{isEn ? 'Ready to work together?' : '함께 시작할 준비가 되셨나요?'}</h3>
                <p className="text-gray-400 mb-10 leading-relaxed">
                  {isEn 
                    ? 'Book a consultation to discuss how we can automate your workflow and scale your business with custom tech solutions.'
                    : '귀사의 워크플로우를 자동화하고, 맞춤형 기술 솔루션을 통해 비즈니스를 확장하는 방법을 상담해 보세요.'}
                </p>
                <div className="space-y-4">
                  <Link 
                    href="mailto:cole.hkg@gmail.com"
                    className="flex items-center justify-center w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    cole.hkg@gmail.com
                  </Link>
                  <Link 
                    href="https://www.linkedin.com/in/hyunjun-an-5426aa196/"
                    target="_blank"
                    className="flex items-center justify-center w-full py-4 bg-transparent border border-gray-700 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    LinkedIn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Cole • CMA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
