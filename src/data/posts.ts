import type { Post } from '../types'

export const posts: Post[] = [
  {
    id: '1',
    slug: 'national-pension-amount-calculation',
    category: 'pension-asset',
    categoryLabel: '연금·자산',
    title: '국민연금 수령액, 내가 얼마나 받을 수 있을까? 2024 완벽 계산법',
    description: '국민연금 수령액을 직접 계산하는 방법부터 조기수령 vs 연기수령 득실 비교까지. 보건복지부 공식 기준으로 정확하게 정리했습니다.',
    content: `
## 이 글이 필요한 분
- 국민연금을 언제부터, 얼마나 받을 수 있는지 궁금한 50~64세
- 조기수령과 연기수령 중 어떤 게 유리한지 비교하고 싶은 분
- 배우자와 합산하면 얼마인지 계산하고 싶은 분

## 3줄 요약
1. 국민연금 수령액은 **가입기간 × 평균소득**으로 결정됩니다
2. 조기수령은 매월 0.5%씩, 최대 30% 감액됩니다
3. 연기수령은 매월 0.6%씩, 최대 36% 가산됩니다

## 2024년 국민연금 수령액 기준

### 기본 계산 공식
국민연금 수령액은 아래 공식으로 산출됩니다.

| 항목 | 내용 |
|------|------|
| 기본연금액 | (A값 + B값) × 지급률 |
| A값 | 전체 가입자 평균소득월액 |
| B값 | 본인의 가입기간 평균소득 |
| 지급률 | 가입기간 20년 기준 1.0 |

### 가입기간별 예상 수령액 (2024년 기준)

| 가입기간 | 평균소득 200만원 | 평균소득 300만원 | 평균소득 400만원 |
|--------|--------------|--------------|--------------|
| 20년 | 약 35만원 | 약 50만원 | 약 65만원 |
| 25년 | 약 43만원 | 약 62만원 | 약 81만원 |
| 30년 | 약 52만원 | 약 74만원 | 약 97만원 |

> **출처**: 국민연금공단 2024년 기준 (실제 수령액은 개인 가입 이력에 따라 다릅니다)

## 조기수령 vs 연기수령 비교

조기수령을 선택하면 62세부터 받을 수 있지만 금액이 줄어들고, 연기수령을 선택하면 최대 70세까지 미뤄 더 많이 받을 수 있습니다.

| 구분 | 수령 나이 | 감액/가산율 |
|------|--------|----------|
| 조기수령 최대 | 62세 | -30% |
| 조기수령 | 63세 | -24% |
| 정상수령 | 65세 | 0% |
| 연기수령 | 67세 | +14.4% |
| 연기수령 최대 | 70세 | +36% |

## 손익분기점 계산

조기수령(62세)과 정상수령(65세) 중 어떤 게 유리한지는 **약 78세**가 기준점입니다. 78세 이전에 사망하면 조기수령이 유리하고, 78세 이후까지 생존하면 정상수령이 유리합니다.

## 자주 묻는 질문
    `,
    thumbnail: '/static/images/pension-calc.jpg',
    tags: ['국민연금', '연금수령액', '조기수령', '연기수령'],
    publishedAt: '2024-03-15',
    updatedAt: '2024-04-01',
    readTime: 8,
    type: 'pillar',
    featured: true,
    situation: '은퇴 5년 전',
    faq: [
      {
        question: '국민연금은 몇 살부터 받을 수 있나요?',
        answer: '1969년 이후 출생자는 만 65세부터 정상 수령 가능합니다. 최대 5년 앞당겨 60세부터 조기수령도 가능하나 수령액이 감액됩니다.'
      },
      {
        question: '국민연금을 10년 미만 납부했으면 어떻게 되나요?',
        answer: '10년(120개월) 미만 납부 시 연금이 아닌 반환일시금으로 수령하게 됩니다. 임의계속가입을 통해 10년을 채울 수도 있습니다.'
      },
      {
        question: '배우자와 함께 받으면 더 유리한가요?',
        answer: '부부가 각각 국민연금에 가입했다면 각자 별도로 수령합니다. 다만 한 명이 사망하면 유족연금과 본인 연금 중 유리한 것을 선택해야 합니다.'
      }
    ],
    relatedPosts: ['housing-pension-calculation', 'basic-pension-eligibility'],
    sources: [
      { name: '국민연금공단 공식 홈페이지', url: 'https://www.nps.or.kr' },
      { name: '보건복지부 국민연금 안내', url: 'https://www.mohw.go.kr' }
    ]
  },
  {
    id: '2',
    slug: 'housing-pension-calculation',
    category: 'pension-asset',
    categoryLabel: '연금·자산',
    title: '주택연금 계산기 2024 — 내 집으로 매달 얼마나 받을 수 있을까?',
    description: '주택연금 예상 수령액 계산 방법과 신청 조건을 한국주택금융공사 공식 기준으로 정리했습니다. 55세부터 신청 가능합니다.',
    content: '주택연금 상세 내용...',
    thumbnail: '/static/images/housing-pension.jpg',
    tags: ['주택연금', '주택연금계산기', '역모기지'],
    publishedAt: '2024-03-20',
    updatedAt: '2024-04-05',
    readTime: 10,
    type: 'comparison',
    featured: true,
    situation: '은퇴 5년 전',
    faq: [
      {
        question: '주택연금 신청 나이는 몇 살부터인가요?',
        answer: '주택 소유자 본인이 만 55세 이상이면 신청 가능합니다. 부부 모두 55세 이상이어야 합니다.'
      },
      {
        question: '주택연금을 받다가 집을 팔고 싶으면 어떻게 되나요?',
        answer: '주택연금은 해지가 가능합니다. 해지 시 그동안 받은 연금액과 이자를 합산해 상환한 후 집을 처분할 수 있습니다.'
      }
    ],
    relatedPosts: ['national-pension-amount-calculation'],
    sources: [
      { name: '한국주택금융공사', url: 'https://www.hf.go.kr' }
    ]
  },
  {
    id: '3',
    slug: 'basic-pension-eligibility',
    category: 'pension-asset',
    categoryLabel: '연금·자산',
    title: '기초연금 자격조건 2024 — 나는 받을 수 있을까? 소득인정액 계산법',
    description: '기초연금 수급 자격, 소득인정액 계산 방법, 국민연금과의 연계감액까지. 보건복지부 2024년 기준으로 정확하게 정리했습니다.',
    content: '기초연금 상세 내용...',
    thumbnail: '/static/images/basic-pension.jpg',
    tags: ['기초연금', '기초연금자격', '소득인정액'],
    publishedAt: '2024-03-25',
    updatedAt: '2024-04-10',
    readTime: 7,
    type: 'checklist',
    featured: false,
    situation: '은퇴 후 생활비 걱정될 때',
    faq: [
      {
        question: '기초연금은 국민연금을 받으면 못 받나요?',
        answer: '국민연금 수령자도 기초연금을 받을 수 있습니다. 다만 국민연금 수령액에 따라 기초연금이 최대 50%까지 감액될 수 있습니다.'
      }
    ],
    relatedPosts: ['national-pension-amount-calculation'],
    sources: [
      { name: '보건복지부 기초연금 안내', url: 'https://www.bokjiro.go.kr' }
    ]
  },
  {
    id: '4',
    slug: 'long-term-care-grade-application',
    category: 'care',
    categoryLabel: '부모님 돌봄',
    title: '장기요양등급 신청 방법 총정리 — 1등급부터 인지지원까지',
    description: '부모님 장기요양등급 신청 절차, 등급별 혜택, 판정 기준을 국민건강보험공단 공식 자료로 정리했습니다. 신청부터 혜택 이용까지 한 번에.',
    content: '장기요양등급 상세 내용...',
    thumbnail: '/static/images/care-grade.jpg',
    tags: ['장기요양등급', '노인장기요양', '요양등급신청'],
    publishedAt: '2024-04-01',
    updatedAt: '2024-04-15',
    readTime: 9,
    type: 'pillar',
    featured: true,
    situation: '부모님 돌봄이 필요할 때',
    faq: [
      {
        question: '장기요양등급 신청은 어디서 하나요?',
        answer: '국민건강보험공단 지사에 방문하거나, 전화(1577-1000), 온라인(복지로 사이트)으로 신청할 수 있습니다.'
      },
      {
        question: '장기요양 판정을 받으면 어떤 혜택이 있나요?',
        answer: '재가급여(방문요양, 방문간호 등)와 시설급여(요양원 입소) 중 선택할 수 있으며, 비용의 15~20%만 본인이 부담합니다.'
      }
    ],
    relatedPosts: [],
    sources: [
      { name: '국민건강보험공단 노인장기요양보험', url: 'https://www.longtermcare.or.kr' }
    ]
  },
  {
    id: '5',
    slug: 'retirement-5years-checklist',
    category: 'pension-asset',
    categoryLabel: '연금·자산',
    title: '은퇴 5년 전 반드시 해야 할 7가지 체크리스트',
    description: '은퇴까지 5년이 남았다면 지금 당장 확인해야 할 것들을 정리했습니다. 연금 정리, 의료비 준비, 주거 결정까지 단계별 행동 가이드.',
    content: '은퇴 5년 전 체크리스트 상세 내용...',
    thumbnail: '/static/images/checklist.jpg',
    tags: ['은퇴준비', '은퇴체크리스트', '노후준비'],
    publishedAt: '2024-04-05',
    updatedAt: '2024-04-20',
    readTime: 6,
    type: 'checklist',
    featured: false,
    situation: '은퇴 5년 전',
    faq: [
      {
        question: '은퇴 전에 개인연금을 꼭 들어야 하나요?',
        answer: '국민연금만으로는 노후 생활비가 부족할 수 있습니다. 연금저축, IRP 등 세제혜택이 있는 상품을 활용하면 절세와 노후 준비를 동시에 할 수 있습니다.'
      }
    ],
    relatedPosts: ['national-pension-amount-calculation', 'housing-pension-calculation'],
    sources: [
      { name: '금융감독원 금융소비자 정보포털', url: 'https://www.fss.or.kr' }
    ]
  },
  {
    id: '6',
    slug: 'medical-expense-support-parents',
    category: 'care',
    categoryLabel: '부모님 돌봄',
    title: '부모님 병원비 지원제도 5가지 — 몰라서 못 받는 혜택 총정리',
    description: '의료급여, 산정특례, 본인부담 상한제, 긴급복지지원까지. 부모님 의료비 부담을 줄일 수 있는 공적 지원제도를 한 번에 정리했습니다.',
    content: '부모님 병원비 지원 상세 내용...',
    thumbnail: '/static/images/medical-support.jpg',
    tags: ['병원비지원', '의료급여', '산정특례', '노인의료비'],
    publishedAt: '2024-04-10',
    updatedAt: '2024-04-22',
    readTime: 8,
    type: 'comparison',
    featured: true,
    situation: '부모님 병원비 걱정될 때',
    faq: [
      {
        question: '본인부담 상한제는 어떻게 신청하나요?',
        answer: '별도 신청 없이 건강보험공단에서 자동으로 계산해 초과 금액을 환급해줍니다. 매년 8~9월에 환급 통보가 옵니다.'
      }
    ],
    relatedPosts: ['long-term-care-grade-application'],
    sources: [
      { name: '국민건강보험공단', url: 'https://www.nhis.or.kr' },
      { name: '보건복지부', url: 'https://www.mohw.go.kr' }
    ]
  }
]

export const getPostBySlug = (slug: string): Post | undefined => {
  return posts.find(p => p.slug === slug)
}

export const getPostsByCategory = (category: string): Post[] => {
  return posts.filter(p => p.category === category)
}

export const getFeaturedPosts = (): Post[] => {
  return posts.filter(p => p.featured)
}

export const getPostsBySituation = (situation: string): Post[] => {
  return posts.filter(p => p.situation === situation)
}

export const getSituations = (): string[] => {
  const situations = posts.map(p => p.situation).filter(Boolean) as string[]
  return [...new Set(situations)]
}
