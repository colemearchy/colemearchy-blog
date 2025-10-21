// Colemearchy 블로그 주제 풀 (110개)
// 카테고리: PM, 디자이너, 바이오해킹, AI 도구, 스타트업, 투자, 개인 개발

export interface BlogTopic {
  prompt: string;
  keywords: string[];
  category: string;
}

export const BLOG_TOPICS_POOL: BlogTopic[] = [
  // === PM & 제품 관리 (25개) ===
  {
    prompt: "PM이 알아야 할 A/B 테스트 설계 완벽 가이드. 통계적 유의성부터 실전 적용까지",
    keywords: ["PM", "A/B 테스트", "통계", "프로덕트", "데이터 분석"],
    category: "PM"
  },
  {
    prompt: "로드맵 우선순위는 이렇게 정한다. RICE, WSJF, Kano Model 실전 비교",
    keywords: ["로드맵", "우선순위", "RICE", "PM", "제품 관리"],
    category: "PM"
  },
  {
    prompt: "Linear vs Jira vs ClickUp. 3년간 다 써본 PM의 솔직한 도구 비교",
    keywords: ["Linear", "Jira", "ClickUp", "PM 도구", "프로젝트 관리"],
    category: "PM"
  },
  {
    prompt: "고객 인터뷰로 실패한 이유. '어떻게' 질문해야 진짜 니즈를 찾는가",
    keywords: ["고객 인터뷰", "PM", "사용자 리서치", "니즈 분석"],
    category: "PM"
  },
  {
    prompt: "PRD 템플릿은 버려라. 상황별로 다른 문서 포맷 전략",
    keywords: ["PRD", "문서화", "PM", "제품 관리", "템플릿"],
    category: "PM"
  },
  {
    prompt: "개발자와 싸우지 않고 협업하는 PM의 커뮤니케이션 기술",
    keywords: ["PM", "개발자 협업", "커뮤니케이션", "팀워크"],
    category: "PM"
  },
  {
    prompt: "OKR 실패 사례 5가지. 스타트업에서 OKR이 망하는 이유",
    keywords: ["OKR", "목표 설정", "PM", "스타트업", "실패"],
    category: "PM"
  },
  {
    prompt: "Mixpanel로 사용자 행동 분석하기. Funnel, Retention, Cohort 실전 가이드",
    keywords: ["Mixpanel", "사용자 분석", "PM", "데이터", "Funnel"],
    category: "PM"
  },
  {
    prompt: "PM 면접에서 꼭 나오는 질문 20개와 모범 답안 전략",
    keywords: ["PM 면접", "인터뷰", "커리어", "취업"],
    category: "PM"
  },
  {
    prompt: "사용자 세그먼트 나누는 법. RFM 분석부터 페르소나까지",
    keywords: ["세그먼트", "RFM", "페르소나", "PM", "사용자 분석"],
    category: "PM"
  },
  {
    prompt: "PM을 위한 SQL 기초. 데이터 분석을 직접 하는 이유",
    keywords: ["SQL", "PM", "데이터 분석", "쿼리"],
    category: "PM"
  },
  {
    prompt: "제품 출시 전 체크리스트. Go-to-Market 전략 수립부터 런칭까지",
    keywords: ["제품 출시", "GTM", "런칭", "PM", "마케팅"],
    category: "PM"
  },
  {
    prompt: "Feature Flag로 안전하게 기능 배포하기. LaunchDarkly 실전 사용기",
    keywords: ["Feature Flag", "LaunchDarkly", "배포", "PM", "A/B 테스트"],
    category: "PM"
  },
  {
    prompt: "사용자 피드백 수집 자동화. Typeform + Slack + Notion 연동 시스템",
    keywords: ["피드백", "자동화", "Typeform", "Notion", "PM"],
    category: "PM"
  },
  {
    prompt: "PM 주간 리포트 템플릿. 경영진에게 신뢰받는 보고 방식",
    keywords: ["주간 리포트", "PM", "보고", "커뮤니케이션"],
    category: "PM"
  },
  {
    prompt: "North Star Metric 찾는 법. 우리 제품의 핵심 지표는 무엇인가",
    keywords: ["North Star Metric", "지표", "PM", "KPI", "성장"],
    category: "PM"
  },
  {
    prompt: "유료 전환율 3배 높인 온보딩 개선 과정. Aha Moment 찾기",
    keywords: ["온보딩", "유료 전환", "Aha Moment", "PM", "UX"],
    category: "PM"
  },
  {
    prompt: "API First 제품 설계. 개발자 도구 PM의 관점",
    keywords: ["API", "제품 설계", "PM", "개발자 도구"],
    category: "PM"
  },
  {
    prompt: "사용자 이탈률 30% 줄인 Retention 전략. Push, Email, In-app 타이밍",
    keywords: ["Retention", "이탈률", "PM", "사용자 유지", "알림"],
    category: "PM"
  },
  {
    prompt: "PM을 위한 머신러닝 기초. AI 기능 기획할 때 알아야 할 것들",
    keywords: ["머신러닝", "AI", "PM", "기획"],
    category: "PM"
  },
  {
    prompt: "프리미엄 요금제 설계하기. Pricing Page 최적화 A/B 테스트 결과",
    keywords: ["Pricing", "요금제", "PM", "A/B 테스트", "수익화"],
    category: "PM"
  },
  {
    prompt: "제품 전략 수립하기. Vision부터 Tactics까지의 프레임워크",
    keywords: ["제품 전략", "Vision", "PM", "전략", "프레임워크"],
    category: "PM"
  },
  {
    prompt: "사용자 여정 지도(Customer Journey Map) 만들기. 실전 워크숍 가이드",
    keywords: ["Customer Journey", "여정 지도", "PM", "UX", "워크숍"],
    category: "PM"
  },
  {
    prompt: "PM 1년차 vs 5년차 차이. 시니어 PM이 되려면 무엇이 필요한가",
    keywords: ["PM", "시니어", "커리어", "성장"],
    category: "PM"
  },
  {
    prompt: "Slack 봇으로 데일리 리포트 자동화. PM의 시간 절약 팁",
    keywords: ["Slack", "자동화", "PM", "생산성", "봇"],
    category: "PM"
  },

  // === 디자이너 & UX/UI (15개) ===
  {
    prompt: "디자이너에서 PM으로 전환한 3년. 피그마 스킬이 프로덕트 씽킹에 도움된 이유",
    keywords: ["커리어 전환", "디자이너", "PM", "피그마", "프로덕트"],
    category: "디자이너"
  },
  {
    prompt: "피그마 플러그인 개발 수익화. 월 300만원 부수입 만든 과정",
    keywords: ["피그마 플러그인", "부수입", "디자이너", "사이드 프로젝트"],
    category: "디자이너"
  },
  {
    prompt: "디자인 시스템 구축하기. Figma Variables + Tokens 실전 가이드",
    keywords: ["디자인 시스템", "피그마", "Tokens", "컴포넌트"],
    category: "디자이너"
  },
  {
    prompt: "UI 디자이너가 알아야 할 CSS 기초. 개발자와 협업을 위한 최소 지식",
    keywords: ["UI 디자이너", "CSS", "협업", "프론트엔드"],
    category: "디자이너"
  },
  {
    prompt: "사용성 테스트로 UX 개선하기. Maze, UserTesting 활용법",
    keywords: ["사용성 테스트", "UX", "Maze", "UserTesting"],
    category: "디자이너"
  },
  {
    prompt: "디자이너 포트폴리오 만들기. 채용 담당자가 보는 관점",
    keywords: ["포트폴리오", "디자이너", "취업", "커리어"],
    category: "디자이너"
  },
  {
    prompt: "Framer로 인터랙티브 프로토타입 만들기. 코드 없이 고급 애니메이션",
    keywords: ["Framer", "프로토타입", "인터랙션", "디자인"],
    category: "디자이너"
  },
  {
    prompt: "디자인 QA 체크리스트. 개발 전 디자이너가 검증해야 할 것들",
    keywords: ["디자인 QA", "체크리스트", "품질 관리"],
    category: "디자이너"
  },
  {
    prompt: "모바일 앱 디자인 가이드. iOS vs Android 플랫폼별 차이점",
    keywords: ["모바일 디자인", "iOS", "Android", "앱"],
    category: "디자이너"
  },
  {
    prompt: "디자이너를 위한 AI 도구 스택. Midjourney, Relume, v0 활용법",
    keywords: ["AI 디자인", "Midjourney", "Relume", "v0"],
    category: "디자이너"
  },
  {
    prompt: "접근성(A11y) 디자인 가이드. WCAG 기준 준수하는 법",
    keywords: ["접근성", "A11y", "WCAG", "디자인"],
    category: "디자이너"
  },
  {
    prompt: "디자인 시스템 문서화. Storybook + Notion 연동 시스템",
    keywords: ["디자인 시스템", "문서화", "Storybook", "Notion"],
    category: "디자이너"
  },
  {
    prompt: "UI 디자인 트렌드 2025. Brutalism부터 Glassmorphism까지",
    keywords: ["UI 트렌드", "디자인", "2025", "Brutalism"],
    category: "디자이너"
  },
  {
    prompt: "디자이너의 사이드 프로젝트 전략. Gumroad로 템플릿 판매하기",
    keywords: ["사이드 프로젝트", "디자이너", "Gumroad", "템플릿"],
    category: "디자이너"
  },
  {
    prompt: "컬러 시스템 설계하기. HSL vs RGB, 접근성 고려한 팔레트 생성",
    keywords: ["컬러 시스템", "팔레트", "접근성", "디자인"],
    category: "디자이너"
  },

  // === 바이오해킹 & 건강 (20개) ===
  {
    prompt: "불안 장애를 극복한 나만의 방법. L-Theanine, 명상, 운동의 시너지",
    keywords: ["불안장애", "멘탈 헬스", "L-Theanine", "명상", "운동"],
    category: "바이오해킹"
  },
  {
    prompt: "간헐적 단식 18:6으로 체지방 15% 달성. 직장인을 위한 현실적 루틴",
    keywords: ["간헐적 단식", "바이오해킹", "체지방", "다이어트"],
    category: "바이오해킹"
  },
  {
    prompt: "뇌 최적화를 위한 영양제 스택. 오메가3, 비타민D, 마그네슘 6개월 실험",
    keywords: ["뇌 최적화", "영양제", "오메가3", "비타민D", "마그네슘"],
    category: "바이오해킹"
  },
  {
    prompt: "Wegovy(세마글루타이드) 3개월 솔직 후기. 부작용과 효과 총정리",
    keywords: ["Wegovy", "세마글루타이드", "GLP-1", "다이어트", "약물"],
    category: "바이오해킹"
  },
  {
    prompt: "목 통증 완치기. 거북목 교정 루틴과 인체공학 책상 세팅",
    keywords: ["목 통증", "거북목", "인체공학", "자세 교정"],
    category: "바이오해킹"
  },
  {
    prompt: "수면 최적화 프로토콜. Whoop 데이터로 분석한 나의 수면 패턴",
    keywords: ["수면 최적화", "Whoop", "수면 추적", "바이오해킹"],
    category: "바이오해킹"
  },
  {
    prompt: "ADHD 성인의 생산성 시스템. 약물 없이 집중력 높이는 법",
    keywords: ["ADHD", "생산성", "집중력", "멘탈 헬스"],
    category: "바이오해킹"
  },
  {
    prompt: "케토제닉 다이어트 30일 실험. 혈당 모니터링과 체성분 변화",
    keywords: ["케토제닉", "저탄수화물", "다이어트", "혈당"],
    category: "바이오해킹"
  },
  {
    prompt: "명상 앱 3개 비교. Headspace vs Calm vs Waking Up 실사용 후기",
    keywords: ["명상", "명상 앱", "Headspace", "Calm", "마음챙김"],
    category: "바이오해킹"
  },
  {
    prompt: "카페인 최적화 전략. 커피 vs 녹차 vs 에너지 드링크 효과 비교",
    keywords: ["카페인", "커피", "생산성", "바이오해킹"],
    category: "바이오해킹"
  },
  {
    prompt: "근력 운동 루틴 설계. 바쁜 직장인을 위한 주 3회 풀바디",
    keywords: ["근력 운동", "헬스", "루틴", "직장인"],
    category: "바이오해킹"
  },
  {
    prompt: "스탠딩 데스크 1년 사용 후기. 실제 건강 개선 효과는?",
    keywords: ["스탠딩 데스크", "인체공학", "건강", "재택근무"],
    category: "바이오해킹"
  },
  {
    prompt: "혈액 검사로 건강 최적화. 주요 마커 해석과 개선 방법",
    keywords: ["혈액 검사", "건강 검진", "바이오마커", "최적화"],
    category: "바이오해킹"
  },
  {
    prompt: "Cold Shower의 과학. 찬물 샤워 3개월 실험 결과",
    keywords: ["찬물 샤워", "Cold Shower", "바이오해킹", "회복"],
    category: "바이오해킹"
  },
  {
    prompt: "프로바이오틱스 선택 가이드. 장 건강과 정신 건강의 연결",
    keywords: ["프로바이오틱스", "장 건강", "마이크로바이옴"],
    category: "바이오해킹"
  },
  {
    prompt: "블루라이트 차단의 진실. 수면의 질을 높이는 조명 전략",
    keywords: ["블루라이트", "수면", "조명", "건강"],
    category: "바이오해킹"
  },
  {
    prompt: "스트레스 관리 프로토콜. HRV 측정과 호흡 운동",
    keywords: ["스트레스 관리", "HRV", "호흡법", "회복"],
    category: "바이오해킹"
  },
  {
    prompt: "단백질 보충제 완벽 가이드. Whey vs Isolate vs Vegan 비교",
    keywords: ["단백질", "보충제", "Whey", "근육"],
    category: "바이오해킹"
  },
  {
    prompt: "뇌 훈련 앱 효과 검증. Lumosity vs Elevate 3개월 사용기",
    keywords: ["뇌 훈련", "인지 능력", "Lumosity", "앱"],
    category: "바이오해킹"
  },
  {
    prompt: "식사 타이밍 최적화. 서캐디언 리듬과 인슐린 민감성",
    keywords: ["식사 타이밍", "서캐디언", "인슐린", "다이어트"],
    category: "바이오해킹"
  },

  // === AI 도구 & 자동화 (15개) ===
  {
    prompt: "PM으로서 Claude Code와 Cursor로 MVP 2주만에 만든 과정",
    keywords: ["PM", "노코드", "Claude Code", "Cursor", "MVP"],
    category: "AI 도구"
  },
  {
    prompt: "Notion AI로 PRD 작성 시간 80% 단축. AI 시대 PM의 생산성 도구",
    keywords: ["Notion AI", "PRD", "생산성", "PM 도구"],
    category: "AI 도구"
  },
  {
    prompt: "ChatGPT로 고객 인터뷰 분석 자동화. Insight 추출 프롬프트 공개",
    keywords: ["ChatGPT", "고객 인터뷰", "분석", "프롬프트"],
    category: "AI 도구"
  },
  {
    prompt: "v0로 프로토타입 만들기. PM도 할 수 있는 코드 없는 개발",
    keywords: ["v0", "프로토타입", "노코드", "PM"],
    category: "AI 도구"
  },
  {
    prompt: "Zapier + Make + n8n 비교. 워크플로우 자동화 도구 선택 가이드",
    keywords: ["Zapier", "Make", "n8n", "자동화", "워크플로우"],
    category: "AI 도구"
  },
  {
    prompt: "GitHub Copilot으로 문서 작성 속도 2배. 마크다운 자동 완성 팁",
    keywords: ["GitHub Copilot", "문서 작성", "마크다운", "AI"],
    category: "AI 도구"
  },
  {
    prompt: "AI로 블로그 SEO 최적화. ChatGPT + Claude 활용 전략",
    keywords: ["AI", "SEO", "블로그", "ChatGPT", "Claude"],
    category: "AI 도구"
  },
  {
    prompt: "Midjourney로 제품 목업 만들기. PM의 비주얼 커뮤니케이션 도구",
    keywords: ["Midjourney", "목업", "PM", "비주얼"],
    category: "AI 도구"
  },
  {
    prompt: "AI 코딩 도구 3종 비교. Cursor vs Windsurf vs Copilot 실사용 후기",
    keywords: ["AI 코딩", "Cursor", "Windsurf", "Copilot"],
    category: "AI 도구"
  },
  {
    prompt: "Perplexity로 리서치 시간 단축. PM의 AI 검색 활용법",
    keywords: ["Perplexity", "리서치", "PM", "AI 검색"],
    category: "AI 도구"
  },
  {
    prompt: "AI 에이전트 시대의 PM. AutoGPT, BabyAGI 실험 후기",
    keywords: ["AI 에이전트", "AutoGPT", "BabyAGI", "PM"],
    category: "AI 도구"
  },
  {
    prompt: "데이터 분석 자동화. ChatGPT Code Interpreter로 SQL 대체하기",
    keywords: ["데이터 분석", "ChatGPT", "Code Interpreter", "자동화"],
    category: "AI 도구"
  },
  {
    prompt: "AI 번역 도구 비교. DeepL vs ChatGPT vs Claude 품질 테스트",
    keywords: ["AI 번역", "DeepL", "ChatGPT", "다국어"],
    category: "AI 도구"
  },
  {
    prompt: "AI로 회의록 자동 작성. Otter.ai + Fireflies 활용법",
    keywords: ["회의록", "Otter.ai", "Fireflies", "AI", "생산성"],
    category: "AI 도구"
  },
  {
    prompt: "프롬프트 엔지니어링 기초. PM이 알아야 할 효과적인 AI 활용법",
    keywords: ["프롬프트 엔지니어링", "AI", "PM", "생산성"],
    category: "AI 도구"
  },

  // === 스타트업 & 성장 (15개) ===
  {
    prompt: "Y Combinator 지원부터 탈락까지. 실패에서 배운 스타트업 피칭의 진실",
    keywords: ["Y Combinator", "스타트업", "피칭", "실패", "VC"],
    category: "스타트업"
  },
  {
    prompt: "AI 스타트업 PM의 리모트 워크 3년. 시차 극복과 비동기 커뮤니케이션",
    keywords: ["리모트 워크", "PM", "비동기", "시차", "재택근무"],
    category: "스타트업"
  },
  {
    prompt: "초기 스타트업의 첫 채용. PM이 알아야 할 팀 빌딩 전략",
    keywords: ["채용", "팀 빌딩", "스타트업", "PM"],
    category: "스타트업"
  },
  {
    prompt: "Product-Market Fit 찾기. 우리 제품이 PMF에 도달했는지 아는 법",
    keywords: ["PMF", "Product-Market Fit", "스타트업", "제품"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 MVP 검증 체크리스트. 최소한의 비용으로 빠르게 테스트",
    keywords: ["MVP", "검증", "스타트업", "린 스타트업"],
    category: "스타트업"
  },
  {
    prompt: "Series A 투자 유치 과정. Pitch Deck부터 Term Sheet까지",
    keywords: ["Series A", "투자 유치", "Pitch Deck", "VC"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 성장 지표 대시보드. Metabase로 만드는 KPI 모니터링",
    keywords: ["성장 지표", "KPI", "Metabase", "대시보드"],
    category: "스타트업"
  },
  {
    prompt: "초기 고객 100명 모으기. Cold Email부터 Product Hunt까지",
    keywords: ["초기 고객", "Cold Email", "Product Hunt", "Growth"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 공동창업자 찾기. 기술적 궁합보다 중요한 것",
    keywords: ["공동창업자", "스타트업", "팀", "창업"],
    category: "스타트업"
  },
  {
    prompt: "Bootstrapping vs VC 투자. 두 가지 길의 장단점 솔직 비교",
    keywords: ["Bootstrapping", "VC", "투자", "스타트업"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 실패 부검. 18개월 만에 문 닫은 이유 복기",
    keywords: ["스타트업 실패", "부검", "교훈", "폐업"],
    category: "스타트업"
  },
  {
    prompt: "개발자 없이 SaaS 만들기. Bubble + Airtable + Zapier 조합",
    keywords: ["노코드", "SaaS", "Bubble", "Airtable"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 PR 전략. TechCrunch 기고부터 언론 노출까지",
    keywords: ["PR", "TechCrunch", "언론", "스타트업"],
    category: "스타트업"
  },
  {
    prompt: "유저 확보 비용(CAC) 줄이기. Organic Growth 전략",
    keywords: ["CAC", "유저 확보", "Organic Growth", "마케팅"],
    category: "스타트업"
  },
  {
    prompt: "스타트업 문화 만들기. 리모트 팀의 가치와 원칙 정립",
    keywords: ["스타트업 문화", "리모트 팀", "가치", "원칙"],
    category: "스타트업"
  },

  // === 투자 & 재테크 (10개) ===
  {
    prompt: "ETF로 FIRE 준비하기. 30대에 경제적 자유 달성을 위한 포트폴리오",
    keywords: ["ETF", "FIRE", "경제적 자유", "투자", "재테크"],
    category: "투자"
  },
  {
    prompt: "VTI vs VOO vs QQQ. 미국 ETF 3종 10년 수익률 비교",
    keywords: ["VTI", "VOO", "QQQ", "ETF", "미국 주식"],
    category: "투자"
  },
  {
    prompt: "월 300만원으로 FIRE 하기. 지출 최적화와 자산 배분 전략",
    keywords: ["FIRE", "지출 최적화", "자산 배분", "경제적 자유"],
    category: "투자"
  },
  {
    prompt: "배당주 포트폴리오 구성. SCHD, JEPI, QYLD 배당 전략",
    keywords: ["배당주", "SCHD", "JEPI", "배당", "투자"],
    category: "투자"
  },
  {
    prompt: "인덱스 펀드 투자의 진실. 액티브 vs 패시브 20년 비교",
    keywords: ["인덱스 펀드", "패시브 투자", "액티브 투자"],
    category: "투자"
  },
  {
    prompt: "세금 최적화 투자. ISA, 연금저축, IRP 활용 전략",
    keywords: ["세금 최적화", "ISA", "연금저축", "IRP"],
    category: "투자"
  },
  {
    prompt: "부동산 vs 주식. 30대 자산 배분 시뮬레이션",
    keywords: ["부동산", "주식", "자산 배분", "투자"],
    category: "투자"
  },
  {
    prompt: "리밸런싱 전략. 언제, 어떻게 포트폴리오를 조정하나",
    keywords: ["리밸런싱", "포트폴리오", "자산 배분"],
    category: "투자"
  },
  {
    prompt: "채권 투자 입문. TLT, AGG, BND 안전자산 비교",
    keywords: ["채권", "TLT", "AGG", "안전자산", "투자"],
    category: "투자"
  },
  {
    prompt: "환율 헤지 전략. 달러 투자 시 고려해야 할 것들",
    keywords: ["환율", "헤지", "달러", "해외 투자"],
    category: "투자"
  },

  // === 개인 개발 & 철학 (10개) ===
  {
    prompt: "생산성 시스템 구축하기. GTD + Zettelkasten 하이브리드",
    keywords: ["생산성", "GTD", "Zettelkasten", "시스템"],
    category: "개인 개발"
  },
  {
    prompt: "독서 루틴 만들기. 연 100권 읽고 기록하는 시스템",
    keywords: ["독서", "루틴", "독서 노트", "지식 관리"],
    category: "개인 개발"
  },
  {
    prompt: "디지털 노마드 1년 회고. 10개국 여행하며 일한 경험",
    keywords: ["디지털 노마드", "여행", "리모트 워크", "자유"],
    category: "개인 개발"
  },
  {
    prompt: "Second Brain 만들기. Obsidian으로 지식 관리 시스템 구축",
    keywords: ["Second Brain", "Obsidian", "지식 관리", "PKM"],
    category: "개인 개발"
  },
  {
    prompt: "미니멀리즘 라이프스타일. 100개 물건으로 사는 삶",
    keywords: ["미니멀리즘", "라이프스타일", "단순함", "자유"],
    category: "개인 개발"
  },
  {
    prompt: "아침 루틴 최적화. 오전 2시간이 하루를 결정한다",
    keywords: ["아침 루틴", "모닝 루틴", "습관", "생산성"],
    category: "개인 개발"
  },
  {
    prompt: "블로그로 부수입 만들기. 애드센스, 제휴 마케팅 실전 전략",
    keywords: ["블로그", "부수입", "애드센스", "제휴 마케팅"],
    category: "개인 개발"
  },
  {
    prompt: "회사 그만두기 전 준비. FIRE까지의 로드맵",
    keywords: ["퇴사", "FIRE", "경제적 자유", "계획"],
    category: "개인 개발"
  },
  {
    prompt: "개인 브랜딩 전략. LinkedIn + 블로그 + 뉴스레터 조합",
    keywords: ["개인 브랜딩", "LinkedIn", "블로그", "뉴스레터"],
    category: "개인 개발"
  },
  {
    prompt: "무정부주의 철학과 개인의 자유. 시스템에서 벗어나는 법",
    keywords: ["무정부주의", "자유", "철학", "독립"],
    category: "개인 개발"
  },
];

// Helper functions
export function getRandomTopics(count: number): BlogTopic[] {
  const shuffled = [...BLOG_TOPICS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getTopicsByCategory(category: string, count?: number): BlogTopic[] {
  const filtered = BLOG_TOPICS_POOL.filter(topic => topic.category === category);
  if (!count) return filtered;
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(BLOG_TOPICS_POOL.map(topic => topic.category)));
}

/**
 * Get weighted random topics based on category distribution
 * Gemini recommendation: 40% PM, 20% Designer, 20% Biohacking, 20% Other
 *
 * For 5 posts:
 * - 2 PM
 * - 1 Designer
 * - 1 Biohacking
 * - 1 Other (AI Tools, Startup, Investment, Personal Development)
 */
export function getWeightedRandomTopics(
  totalCount: number,
  excludePrompts: string[] = []
): BlogTopic[] {
  const pmCount = Math.ceil(totalCount * 0.4);
  const designerCount = Math.ceil(totalCount * 0.2);
  const biohackingCount = Math.ceil(totalCount * 0.2);
  const otherCount = totalCount - pmCount - designerCount - biohackingCount;

  const selectedTopics: BlogTopic[] = [];
  const otherCategories = ['AI 도구', '스타트업', '투자', '개인 개발'];

  // Filter out excluded prompts
  const availableTopics = BLOG_TOPICS_POOL.filter(
    topic => !excludePrompts.includes(topic.prompt)
  );

  // Select PM topics
  const pmTopics = availableTopics.filter(t => t.category === 'PM');
  selectedTopics.push(...getRandomFromArray(pmTopics, pmCount));

  // Select Designer topics
  const designerTopics = availableTopics.filter(t => t.category === '디자이너');
  selectedTopics.push(...getRandomFromArray(designerTopics, designerCount));

  // Select Biohacking topics
  const biohackingTopics = availableTopics.filter(t => t.category === '바이오해킹');
  selectedTopics.push(...getRandomFromArray(biohackingTopics, biohackingCount));

  // Select Other topics (evenly distributed across AI Tools, Startup, Investment, Personal Dev)
  const otherTopics = availableTopics.filter(t => otherCategories.includes(t.category));
  selectedTopics.push(...getRandomFromArray(otherTopics, otherCount));

  // Shuffle to avoid predictable order
  return selectedTopics.sort(() => Math.random() - 0.5);
}

// Helper function to get random items from array
function getRandomFromArray<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}
