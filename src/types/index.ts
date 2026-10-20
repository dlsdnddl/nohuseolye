// 포스팅 타입 정의
export interface Post {
  id: string
  slug: string
  category: 'pension-asset' | 'housing-income' | 'support' | 'care'
  categoryLabel: string
  title: string
  description: string
  content: string
  thumbnail: string
  tags: string[]
  publishedAt: string
  updatedAt: string
  readTime: number // 분 단위
  type: 'pillar' | 'comparison' | 'checklist' // 기둥글 | 비교글 | 체크리스트
  featured: boolean
  situation?: string // "은퇴 5년 전" | "부모님 병원비 걱정될 때" 등
  faq?: FAQ[]
  relatedPosts?: string[] // slug 배열 (사이드바·본문 중간 CTA용)
  sources?: Source[] // 공식 출처
  // ── Phase B: 검색 여정형 내부링크 ────────────────────────────────
  nextQuestions?: NextQuestion[] // 이 글을 읽은 뒤 다음으로 궁금해할 질문 목록
  nextStep?: string              // 가장 핵심적인 다음 글 slug (nextQuestions[0]와 중복 가능)
  // ── 콘텐츠 발행 시스템 (모두 optional: 기존 글은 값이 없어도 동작) ──────────
  status?: PostStatus            // 미지정 = 'published' (기존 TS 글 호환)
  origin?: 'legacy' | 'md'       // legacy: src/data/legacy-posts.ts, md: content/posts/*.md
  seoTitle?: string              // <title>에 쓸 SEO 제목 (없으면 title)
  metaDescription?: string       // meta description (없으면 description)
  basisYear?: number             // 정책 적용(기준) 연도
  verifiedAt?: string            // 공식자료 검증일 (YYYY-MM-DD)
  approvedAt?: string            // 운영자 발행 승인일 (md 글의 published 전환 조건)
  noindex?: boolean              // true면 meta robots noindex + sitemap/RSS 제외
  image?: PostImage              // 대표 이미지 + alt
  review?: PostReviewNotes       // 검토용 메모 (미리보기 빌드에서만 포함)
  shortTitle?: string            // 푸터·좁은 영역용 짧은 제목
}

export type PostStatus = 'draft' | 'review' | 'published'

export interface PostImage {
  src: string  // /static/images/... (public/ 하위 실제 파일)
  alt: string
}

export interface PostReviewNotes {
  differentiation?: string // 기존 글과의 차별점
  reviewNotes?: string     // 운영자 검토 메모
}

// 공식자료 검증표 한 행 (content/verification/<slug>.yaml)
export interface VerificationRow {
  item: string          // 검증 항목
  value: string         // 실제 적용 수치 또는 조건
  agency: string        // 공식 기관
  document: string      // 공식 문서명
  url: string           // 원문 URL
  effectiveDate: string // 자료 시행일
  checkedAt: string     // 확인일
  result: 'verified' | 'partial' | 'unverified' | 'conflict'
  note?: string
}

export interface VerificationSheet {
  slug: string
  checkedAt: string
  rows: VerificationRow[]
}

// Phase B: 다음 질문 카드 한 항목
export interface NextQuestion {
  question: string                                        // "국민연금 얼마나 받을 수 있나요?"
  href: string                                           // "/pension-asset/national-pension-amount-calculation"
  contentType: 'next-step' | 'related-article'          // 콘텐츠 유형 (GA4 파라미터용)
  description?: string                                   // 카드 부제목 (선택)
}

export interface FAQ {
  question: string
  answer: string
}

export interface Source {
  name: string          // 기관/자료 표시명
  url: string
  title?: string        // 공식 문서명
  effectiveDate?: string // 자료 시행일
  accessedAt?: string   // 확인일
}

// 진단기 타입
export interface DiagnosisInput {
  age: number
  monthlyExpense: number // 월 생활비 (만원)
  currentSavings: number // 현재 저축액 (만원)
  pensionType: 'national' | 'private' | 'both' | 'none' // 연금 종류
  workYears: number // 국민연금 납부 기간 (년)
  housingType: 'own' | 'rent' | 'other' // 주거 형태
}

export interface DiagnosisResult {
  score: number // 0~100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  gradeLabel: string
  estimatedMonthlyPension: number // 예상 월 연금 수령액 (만원)
  retirementAge: number // 예상 은퇴 가능 나이
  shortfall: number // 부족 자금 (만원)
  recommendations: string[]
  details: {
    nationalPension: number // 국민연금 예상액
    privatePension: number // 퇴직/개인연금 예상액
    expectedLivingCost: number // 예상 월 생활비
    surplusOrDeficit: number // 흑자(+) or 적자(-)
  }
}

// 카테고리 타입
export interface Category {
  id: string
  label: string
  icon: string
  description: string
  active: boolean
}

// 관리자 페이지용
export interface AdminPost extends Post {
  createdAt: string
  status: 'draft' | 'published' | 'archived'
}
