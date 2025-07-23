# 프로젝트 헌법: colemearchy.com - SEO & Performance First

## 🚨 최우선 목표 (Non-Negotiable Goals)
- **Google Lighthouse Score 400/400:** 모든 코드 변경은 성능, 접근성, 베스트 프랙티스, SEO 각 100점을 목표로 합니다.
- **비용 최소화:** 서버리스 잼스택 아키텍처를 유지하며 Vercel 무료 티어를 최대한 활용합니다.
- **Google SEO Essentials 준수:** 이 프로젝트의 모든 결과물은 제공된 Google SEO 가이드라인을 '단일 진실 공급원(Single Source of Truth)'으로 삼습니다.

## 1. 기술 아키텍처 및 원칙
- **플랫폼:** Vercel (Hosting, Serverless Functions, Postgres)
- **프레임워크:** Next.js 14+ (App Router)
- **핵심 전략:** **SSG (정적 사이트 생성) 우선.** 모든 콘텐츠 페이지는 반드시 SSG로 빌드되어야 합니다. 이는 속도와 SEO에 결정적입니다.

## 2. SEO 및 콘텐츠 규칙 (Google 가이드라인 기반)

### 2.1. 콘텐츠 및 품질 (E-E-A-T)
- **사용자 중심:** 모든 콘텐츠는 검색엔진이 아닌 사람을 위해 작성되어야 합니다. (MANDATORY)
- **독창성 및 깊이:** 단순히 다른 출처를 요약하는 것을 넘어, 고유한 정보, 경험(Experience), 전문성(Expertise), 권위(Authoritativeness), 신뢰성(Trustworthiness)을 제공해야 합니다.
- **저자 정보:** 모든 글에는 저자 정보('누가' 만들었는가)를 명확히 표기해야 합니다.

### 2.2. 기술적 SEO
- **크롤링 및 색인:** 모든 페이지는 Googlebot이 차단 없이 접근 가능해야 하며(robots.txt 주의), HTTP 200 상태 코드를 반환해야 합니다. `noindex` 태그를 신중하게 사용합니다.
- **URL 구조:** URL은 임의의 문자열이 아닌, 콘텐츠를 설명하는 단어를 포함해야 합니다. (e.g., `/biohacking/wegovy-honest-review`)
- **표준 URL (Canonicalization):** 중복 콘텐츠를 피하기 위해 `rel="canonical"` 링크 요소를 정확히 사용해야 합니다.
- **구조화된 데이터 (Structured Data):** **모든 블로그 게시물은 `Article` 또는 `BlogPosting` schema.org 마크업을 JSON-LD 형식으로 포함해야 합니다. (MANDATORY)** 이는 리치 결과(Rich Results) 노출에 필수적입니다.
- **사이트 이름:** `WebSite` schema.org 마크업을 홈페이지에 추가하여 원하는 사이트 이름(`Colemearchy`)이 표시되도록 합니다.

### 2.3. 페이지 경험 (Page Experience)
- **Core Web Vitals:** LCP, INP, CLS 지표를 '우수' 등급으로 유지해야 합니다.
- **이미지 최적화:** 모든 이미지는 `next/image`를 사용하고, 의미 있는 `alt` 텍스트를 **반드시** 제공해야 합니다. (MANDATORY)
- **폰트 최적화:** 모든 웹 폰트는 `next/font`를 사용해야 합니다.
- **HTTPS:** 사이트는 HTTPS를 통해 안전하게 제공되어야 합니다.
- **방해되는 광고 금지:** 사용자의 콘텐츠 소비를 방해하는 전면 광고나 과도한 광고를 사용하지 않습니다.

### 2.4. 스팸 정책 준수
- **엄격한 금지 사항:** 유인 키워드 반복, 숨겨진 텍스트, 링크 스팸, 클로킹, 스크래핑된 콘텐츠 등 제공된 문서에 명시된 모든 스팸 행위를 절대 금지합니다.
- **AI 생성 콘텐츠:** AI를 사용하여 콘텐츠를 생성할 수 있으나, '확장된 콘텐츠 악용' 정책을 위반하지 않도록 독창성과 가치를 추가해야 합니다. 생성된 모든 콘텐츠는 인간이 최종 검토합니다.

## 3. AI 콘텐츠 생성 원칙

### 3.1. Colemearchy 페르소나
- **톤:** 날것의 솔직함, 지적이고 약간 반항적(무정부주의 철학), 분석적
- **스타일:** 개인적 일화(불안, ADHD, 목 통증, 다이어트 여정)와 전문적 통찰력의 결합
- **타겟:** 25-40대 테크/금융/창의 산업 종사자로 자유를 추구하는 야심찬 밀레니얼

### 3.2. 콘텐츠 필러 (The Golden Triangle)
1. **바이오해킹 & 최적화된 자아:** 현대 건강 솔루션(Wegovy, 정신건강 약물, 피트니스, 케토)
2. **스타트업 아키텍트:** 성장, SEO, AI, 리더십에 대한 실행 가능한 통찰력
3. **주권적 마음:** 투자, 개인의 자유, 의미 있는 삶 구축에 대한 철학적/실용적 관점

### 3.3. 수익화 전략
- 제공된 제휴 제품을 자연스럽게 내러티브에 통합
- 단순 나열이 아닌 스토리텔링을 통한 제품 소개
- 명확한 CTA(Call-to-Action) 사용

## 4. 코드 품질 및 컨벤션
- **언어:** TypeScript (Strict 모드)
- **테스트:** 모든 핵심 기능에 대한 단위/통합 테스트 작성
- **커밋 메시지:** Conventional Commits 형식

## 5. 성능 모니터링
- 모든 배포 전 Lighthouse CI를 실행하여 400점 만점 유지
- Core Web Vitals 지표를 지속적으로 모니터링
- 성능 저하 시 즉시 롤백

## 6. RAG (Retrieval-Augmented Generation) 시스템

### 6.1. 개요
- 과거 독서 노트와 요약을 기반으로 AI가 콘텐츠를 생성할 때 참고하는 지식 베이스 시스템
- pgvector를 사용한 벡터 유사도 검색으로 관련 컨텍스트 자동 추출
- Gemini text-embedding-004 모델로 임베딩 생성

### 6.2. 지식 베이스 업데이트
```bash
# 지식 베이스 임베딩 실행
pnpm tsx scripts/embed-knowledge.ts
```
- `knowledge-base.txt` 파일에 새로운 독서 노트 추가 후 위 명령어 실행
- 형식: `[책 제목] 내용...`

### 6.3. 환경 변수 설정
```bash
# Vercel 대시보드에서 설정 필요
CRON_SECRET=your-secure-random-string  # 크론 작업 인증용
REDEPLOY_WEBHOOK_URL=your-vercel-webhook-url  # 자동 재배포용
```

## 7. 자동 발행 시스템

### 7.1. 작동 방식
- 매시간 정각에 크론 작업이 실행되어 예약된 게시물 확인
- 예약 시간이 지난 DRAFT 상태의 게시물을 자동으로 PUBLISHED로 변경
- 발행 후 Vercel 재배포를 트리거하여 정적 사이트 재생성

### 7.2. 게시물 예약
- AI 콘텐츠 생성 시 `publishDate` 파라미터로 예약 발행 시간 설정
- 생성된 모든 게시물은 DRAFT 상태로 저장되며, 예약 시간에 자동 발행

### 7.3. 수동 테스트
```bash
# 예약된 게시물 확인 (GET 요청)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://colemearchy.com/api/publish-posts

# 수동 발행 트리거 (POST 요청) 
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://colemearchy.com/api/publish-posts
```