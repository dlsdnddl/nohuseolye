# 노후설계 가이드

> 4070 세대를 위한 노후 현금흐름 설계 웹앱 — 연금·복지·지원금 실전 해설 플랫폼

## 프로젝트 개요

- **목적**: 보건복지부·금감원·국민연금공단 공식 자료를 4070 세대의 일상 언어로 번역·해설
- **수익화**: 구글 애드센스 (고단가 금융/복지 카테고리)
- **타겟**: 52~64세 은퇴 전환기 + 40~50대 부모님 대리 검색 세대
- **기술 스택**: Hono + TypeScript + Tailwind CSS + Cloudflare Pages

---

## 현재 완성된 기능

### 홈 화면
- ✅ **노후자금 충분지수 진단기** — 국민연금공단 2024 기준 공식 알고리즘 (1.5초 딜레이 → 광고 노출)
- ✅ **4대 퀵링크** — 국민연금 수령액 / 주택연금 계산 / 기초연금 자격 / 장기요양등급
- ✅ **상황별 콘텐츠 큐레이션** — 은퇴 5년 전 / 생활비 걱정 / 부모님 돌봄 등 상황 필터 + 더보기
- ✅ **편집팀 추천 기둥글** — Featured 포스트 카드 그리드
- ✅ **애드센스 슬롯 4개 배치** — CLS 방지 min-height 강제 할당

### 헤더 / GNB
- ✅ 상단 알림 바 (최신 정보 공지)
- ✅ 글자 크기 조절 버튼 (4070 접근성)
- ✅ 검색바 (데스크탑 / 모바일 분리)
- ✅ GNB 4개 카테고리 (연금·자산만 활성화, 나머지 noindex 처리)

### 아티클 상세 페이지
- ✅ 브레드크럼 네비게이션 + JSON-LD BreadcrumbList
- ✅ '이 글이 필요한 분' + 3줄 요약 하이라이트 박스
- ✅ 본문 인아티클 광고 슬롯 (상단 + 하단)
- ✅ 문맥형 관련글 CTA 박스
- ✅ FAQ 아코디언 + JSON-LD FAQPage 스키마
- ✅ 공식 출처 표기 (gov.kr 링크)
- ✅ 카카오톡 / 링크 복사 / 인쇄 공유 버튼
- ✅ 읽기 진행바 (상단 고정)
- ✅ 사이드바 — 목차 자동 생성 / 관련글 / 진단기 CTA

### SEO
- ✅ JSON-LD Article + BreadcrumbList + FAQPage 스키마 동적 생성
- ✅ dateModified 동적 렌더링 (하드코딩 금지)
- ✅ Open Graph / Twitter Card 메타태그
- ✅ 태그 기능 배제 (Tag Bloat 방지)

### 관리자 페이지 (`/admin`)
- ✅ 대시보드 통계 (전체 포스트, 추천 글 등)
- ✅ 포스트 목록 테이블 (카테고리 / 유형 / 상태 표시)

### 푸터
- ✅ 뉴스레터 구독 섹션
- ✅ 공식 기관 링크 (국민연금공단, 복지로 등)
- ✅ 법적 면책 고지
- ✅ 카카오톡 공유 / 맨 위로 플로팅 버튼

---

## URL 구조

| URL | 설명 |
|-----|------|
| `/` | 홈 (진단기 + 퀵링크 + 큐레이션) |
| `/pension-asset` | 연금·자산 카테고리 목록 |
| `/pension-asset/:slug` | 아티클 상세 페이지 |
| `/admin` | 관리자 대시보드 |
| `/housing-income` | 집·노후소득 (준비 중) |
| `/support` | 지원금 (준비 중) |
| `/care` | 부모님 돌봄 (준비 중) |

---

## 샘플 포스트 (6개)

| 제목 | 유형 | 상황 |
|------|------|------|
| 국민연금 수령액 계산법 | 기둥글 | 은퇴 5년 전 |
| 주택연금 계산기 2024 | 비교분석 | 은퇴 5년 전 |
| 기초연금 자격조건 2024 | 체크리스트 | 은퇴 후 생활비 |
| 장기요양등급 신청 총정리 | 기둥글 | 부모님 돌봄 |
| 은퇴 5년 전 체크리스트 | 체크리스트 | 은퇴 5년 전 |
| 부모님 병원비 지원제도 | 비교분석 | 부모님 병원비 |

---

## 데이터 구조 (src/data/posts.ts)

```typescript
interface Post {
  id, slug, category, title, description, content
  thumbnail, publishedAt, updatedAt, readTime
  type: 'pillar' | 'comparison' | 'checklist'
  featured, situation, faq[], relatedPosts[], sources[]
}
```

---

## 콘텐츠 추가 방법

### 방법 1: posts.ts 직접 수정 후 배포
```bash
# src/data/posts.ts 에 포스트 객체 추가
npm run build
# Cloudflare Pages에 배포
```

### 방법 2: 관리자 페이지 확인
```
http://localhost:3000/admin
```

---

## 애드센스 슬롯 위치

| 슬롯 ID | 위치 | 크기 |
|---------|------|------|
| `home-top-ad` | 홈 Hero 아래 | 리더보드 (90px) |
| `home-mid-ad` | 퀵링크 아래 | 직사각형 (250px) |
| `home-bottom-ad` | 홈 하단 | 리더보드 (90px) |
| `article-top-ad` | 아티클 본문 상단 | 인아티클 (280px) |
| `article-bottom-ad` | 아티클 본문 하단 | 직사각형 (250px) |
| `sidebar-ad` | 사이드바 | 직사각형 (250px) |

> 실제 적용 시 `src/components/AdSlot.tsx`의 주석 처리된 `<ins>` 태그를 활성화하세요.

---

## 로컬 개발

```bash
npm run build       # 빌드
pm2 start ecosystem.config.cjs  # 서버 시작
curl http://localhost:3000       # 테스트
pm2 logs --nostream              # 로그 확인
```

---

## 다음 단계 (미구현)

- [ ] 집·노후소득 카테고리 콘텐츠 활성화
- [ ] 지원금 카테고리 콘텐츠 활성화
- [ ] 부모님 돌봄 카테고리 콘텐츠 활성화
- [ ] 관리자 페이지 내 글 작성/편집 기능
- [ ] 검색 기능 구현 (Cloudflare KV 활용)
- [ ] 북마크/즐겨찾기 기능
- [ ] 애드센스 실계정 연동 (ca-pub-XXXX)
- [ ] Cloudflare Pages 프로덕션 배포
- [ ] sitemap.xml 자동 생성

---

## 배포 정보

- **플랫폼**: Cloudflare Pages (예정)
- **상태**: 🔧 로컬 개발 완료
- **마지막 업데이트**: 2024-04-28
