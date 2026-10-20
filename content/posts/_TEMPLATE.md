---
# ─────────────────────────────────────────────────────────────
# LuckyU 칼럼 템플릿. 이 파일을 content/posts/<카테고리>/<slug>.md 로 복사해서 사용하세요.
#   (npm run content:new -- <category> <slug> 로 자동 생성할 수 있습니다)
# 상태: draft(작성 중) → review(운영자 검토) → published(승인 후 정식 발행)
#   · draft/review 글은 운영 배포물(번들·sitemap·RSS·목록)에 포함되지 않습니다.
#   · published 로 바꾸려면 approvedAt(운영자 승인일)과 검증표가 필요합니다.
# 본문에는 HTML을 쓸 수 없습니다(Markdown만). 계산기 위젯: [[WIDGET:housing-pension-calc]]
# ─────────────────────────────────────────────────────────────
title: "제목 (H1로 출력)"
slug: "english-kebab-case-slug"            # 파일명과 동일해야 함
category: housing-income                   # pension-asset | housing-income | support | care
status: draft                              # draft | review | published
type: pillar                               # pillar | comparison | checklist
seoTitle: "SEO 제목 (60자 이내, <title>에 사용)"
metaDescription: "검색 결과에 보일 설명 (70~160자)"
publishedAt: 2026-10-20                    # 최초 작성일
updatedAt: 2026-10-20                      # 의미 있는 수정 시에만 갱신 (sitemap lastmod)
verifiedAt: 2026-10-20                     # 공식자료 검증일 (본문 상단에 표시)
basisYear: 2026                            # 정책 적용 연도
# approvedAt: 2026-10-25                   # 운영자 승인일 (published 전환 시 필수)
readTime: 7
featured: false
situation: 은퇴 5년 전                      # 홈 탭: 은퇴 5년 전 / 은퇴 후 생활비 걱정될 때 / 부모님 돌봄이 필요할 때 / 부모님 병원비 걱정될 때 (또는 삭제)
noindex: false                             # true면 검색 색인·sitemap·RSS 제외
image:
  src: /static/images/posts/english-kebab-case-slug.jpg   # content/images/ 에 파일을 두면 빌드 때 복사됨
  alt: "이미지 설명(필수)"
sources:                                   # 공식 출처 (기관·문서명·URL·시행일·확인일)
  - name: "기관명"
    title: "공식 문서명"
    url: "https://www.example.go.kr/..."
    effectiveDate: "2026-01-01"
    accessedAt: "2026-10-20"
relatedPosts:                              # 같은 주제의 공개 글 slug (본문 중간/사이드바)
  - housing-pension-calculation
nextQuestions:                             # Phase B "다음으로 궁금한 내용" 카드 (2~4개)
  - question: "다음에 궁금해할 질문?"
    href: /pension-asset/housing-pension-calculation
    contentType: next-step                 # next-step | related-article
    description: "카드 부제목"
# inboundLinks:                            # (선택) 기존 글의 "다음 질문" 카드에 이 글을 추가 — 명시한 글에만 반영
#   - from: housing-pension-calculation
#     question: "이 글로 연결할 질문?"
faq:
  - q: "자주 묻는 질문 1?"
    a: "답변 1"
  - q: "자주 묻는 질문 2?"
    a: "답변 2"
differentiation: "기존 글과의 차별점 (검수용, 미리보기에서만 표시)"
reviewNotes: |
  운영자 검토 메모 (미리보기에서만 표시)
---

## 이 글이 필요한 분
- 대상 독자 1
- 대상 독자 2

## 3줄 요약
1. 핵심 결론 1
2. 핵심 결론 2
3. 핵심 결론 3

## 본문 첫 번째 H2

본문 단락입니다. **굵게**, [공식 링크](https://www.example.go.kr) 지원.

| 구분 | 내용 | 비고 |
|---|---|---|
| 예시 | 값 | 설명 |

> 인용·주의 문구는 이렇게 씁니다.

- [ ] 체크리스트 항목
