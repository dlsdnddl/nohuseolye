// 카테고리 설정 — 헤더 메뉴, 푸터, 허브 페이지, sitemap이 모두 이 파일을 읽습니다.
// 새 카테고리를 열 때는 `state`만 'open'으로 바꾸면 됩니다.
//   - 'coming-soon': 허브는 noindex 안내 페이지, 메뉴는 "준비중" 배지, sitemap 제외
//   - 'open'       : 허브에 공개(published) 글 목록 표시, 메뉴 활성화, sitemap 포함
// 오픈 조건: 해당 카테고리에 published 글 3편 이상 (npm run content:check 가 강제)

export type CategoryId = 'pension-asset' | 'housing-income' | 'support' | 'care'

export interface CategoryConfig {
  id: CategoryId
  slug: CategoryId // URL 경로 (= id)
  label: string
  /** 허브 페이지 H1 아래 소개문 */
  intro: string
  /** 허브 페이지 SEO */
  seoTitle: string
  seoDescription: string
  state: 'open' | 'coming-soon'
  /** open 상태에서 요구하는 최소 published 글 수 (신규 카테고리 오픈 규칙: 3). 미지정 = 검사 안 함 */
  minPosts?: number
  /** 허브 상단 "대표 글"로 고정 노출할 글 slug (다른 카테고리 글도 가능, URL은 변경하지 않음) */
  pinned?: string[]
  /** 푸터 링크로 고정 노출할 글 (미지정 시 공개 글 최신 4편) */
  footerLinks?: { slug: string; label: string }[]
}

export const MIN_PUBLISHED_TO_OPEN = 3

// 배열 순서 = 헤더 메뉴 순서
export const categories: CategoryConfig[] = [
  {
    id: 'pension-asset',
    slug: 'pension-asset',
    label: '연금·자산',
    intro: '국민연금, 주택연금, 기초연금 등 노후 소득 관련 핵심 정보',
    seoTitle: '연금·자산 정보',
    seoDescription: '국민연금, 주택연금, 기초연금 등 노후 소득 관련 핵심 정보를 공식 자료 기반으로 제공합니다.',
    state: 'open',
    footerLinks: [
      { slug: 'national-pension-amount-calculation', label: '국민연금 수령액 계산' },
      { slug: 'housing-pension-calculation', label: '주택연금 계산기' },
      { slug: 'basic-pension-eligibility', label: '기초연금 자격조건' },
      { slug: 'retirement-5years-checklist', label: '은퇴 5년 전 체크리스트' },
    ],
  },
  {
    id: 'care',
    slug: 'care',
    label: '부모님 돌봄',
    intro: '장기요양등급, 병원비 지원 등 부모님 돌봄 관련 핵심 정보',
    seoTitle: '부모님 돌봄 정보',
    seoDescription: '장기요양등급, 병원비 지원 등 부모님 돌봄 관련 핵심 정보를 공식 자료 기반으로 제공합니다.',
    state: 'open',
    footerLinks: [
      { slug: 'long-term-care-grade-application', label: '장기요양등급 신청' },
      { slug: 'medical-expense-support-parents', label: '부모님 병원비 지원' },
    ],
  },
  {
    id: 'housing-income',
    slug: 'housing-income',
    label: '집·노후소득',
    intro: '주택연금·농지연금처럼 보유 자산을 노후 현금흐름으로 바꾸는 방법과 은퇴 후 주거비를 공식 자료 기준으로 정리합니다.',
    seoTitle: '집·노후소득 가이드 — 주택연금·농지연금·은퇴 후 주거비',
    seoDescription: '주택연금 승계·실거주 요건, 농지연금 조건 등 집과 땅을 노후소득으로 활용하는 방법을 공식 자료 기준으로 설명합니다.',
    state: 'coming-soon',
    minPosts: MIN_PUBLISHED_TO_OPEN,
    pinned: ['housing-pension-calculation'],
  },
  {
    id: 'support',
    slug: 'support',
    label: '지원금',
    intro: '50~70대가 신청할 수 있는 에너지바우처·노인일자리·건강보험 혜택 등 공공 지원제도를 대상·금액·신청방법 중심으로 정리합니다.',
    seoTitle: '지원금 가이드 — 50~70대 공공 지원제도와 신청방법',
    seoDescription: '에너지바우처, 노인일자리, 임플란트·틀니 건강보험 등 50~70대가 받을 수 있는 공공 지원제도를 공식 자료 기준으로 안내합니다.',
    state: 'coming-soon',
    minPosts: MIN_PUBLISHED_TO_OPEN,
  },
]

export const getCategory = (slug: string): CategoryConfig | undefined =>
  categories.find(c => c.slug === slug)

export const getCategoryLabel = (id: string): string => getCategory(id)?.label ?? id

// 홈 "상황별 큐레이션" 탭 (ContentCuration, app.js 필터, content:check가 공유)
// 신규 글의 `situation` 값은 아래 4개 중 하나이거나 비워 두세요.
export const SITUATIONS = [
  '은퇴 5년 전',
  '은퇴 후 생활비 걱정될 때',
  '부모님 돌봄이 필요할 때',
  '부모님 병원비 걱정될 때',
] as const

// 정적 페이지(내부링크 허용 목록)
export const STATIC_PATHS = ['/', '/about', '/privacy', '/disclaimer', '/contact']
