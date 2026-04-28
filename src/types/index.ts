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
  relatedPosts?: string[] // slug 배열
  sources?: Source[] // 공식 출처
}

export interface FAQ {
  question: string
  answer: string
}

export interface Source {
  name: string
  url: string
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
