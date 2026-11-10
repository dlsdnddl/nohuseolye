# 노후설계 가이드 (nohuseolye)

> **다른 도구(Codex·Claude Code)에서 이어서 작업할 때는 먼저 [`AGENTS.md`](./AGENTS.md)를 읽으세요.** 운영 규칙, 발행 절차, 배포·롤백 정보가 있습니다.

> 2026년 기준 연금·의료·돌봄 정보를 한곳에 모은 노후설계 가이드 웹사이트

---

## 🌐 라이브 URL

| 페이지 | URL |
|--------|-----|
| 메인 홈 | https://nohuseolye.pages.dev |
| 기초연금 자격조건 + 소득인정액 계산기 | https://nohuseolye.pages.dev/pension-asset/basic-pension-eligibility |
| 국민연금 수령액 계산법 | https://nohuseolye.pages.dev/pension-asset/national-pension-amount-calculation |
| 주택연금 계산법 | https://nohuseolye.pages.dev/pension-asset/housing-pension-calculation |
| 은퇴 전 7가지 체크리스트 | https://nohuseolye.pages.dev/pension-asset/retirement-checklist |
| 장기요양등급 신청 방법 | https://nohuseolye.pages.dev/care/long-term-care-grade-application |
| 부모님 병원비 지원제도 | https://nohuseolye.pages.dev/care/medical-expense-support-parents |

---

## 🏗 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Hono (Cloudflare Workers) |
| 빌드 도구 | Vite 6 + TypeScript 7 (타입 검사: `npm run typecheck`) |
| 스타일 | Tailwind CSS (CDN) |
| 아이콘 | FontAwesome 6.4 (CDN) |
| 배포 | Cloudflare Pages |
| 로컬 서버 | PM2 + wrangler pages dev |

---

## 📁 프로젝트 구조

```
/home/user/webapp/
├── src/
│   ├── index.tsx              # 메인 라우터
│   ├── data/posts.ts          # 기존 8개 + Markdown 글 통합 facade
│   ├── data/legacy-posts.ts   # 기존 8개 글
│   ├── generated/content.ts   # 빌드 시 생성 (git 제외)
│   ├── pages/
│   │   ├── ArticlePage.tsx    # 아티클 렌더링 + 소득인정액 계산기 위젯
│   │   └── AdminPage.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroDiagnosis.tsx  # 메인 노후진단 위젯
│   │   ├── QuickLinks.tsx
│   │   ├── ContentCuration.tsx
│   │   ├── PostCard.tsx
│   │   └── AdSlot.tsx         # 애드센스 광고 슬롯
│   ├── types/index.ts
│   └── renderer.tsx
├── public/static/
│   └── app.js                 # 프론트엔드 JS (진단기, 계산기, TOC, 공유 등)
├── content/                   # Markdown 글(posts)·검증표(verification)·이미지
├── scripts/                   # build-content, content-check, new-post 등
├── docs/                      # 검토 보고서·기획표
├── dist/                      # 운영 빌드 결과물 (배포용)
├── dist-preview/              # 미리보기 빌드 결과물
├── wrangler.jsonc             # Cloudflare 설정
├── package.json
├── vite.config.ts
├── tsconfig.json
└── ecosystem.config.cjs       # PM2 설정
```

---

## 📄 아티클 구성 (6개)

### Category: `pension-asset` (연금·자산)

| slug | 제목 | 특이사항 |
|------|------|----------|
| `basic-pension-eligibility` | 기초연금 자격조건 2026 — 월 최대 34만 9,700원 | **소득인정액 계산기 위젯 내장** |
| `national-pension-amount-calculation` | 국민연금 수령액 2026 완벽 계산법 | A값 319만 3,511원 기준 |
| `housing-pension-calculation` | 주택연금 계산법 2026 | 2026년 3.13% 인상 반영 |
| `retirement-checklist` | 은퇴 전 7가지 체크리스트 | IRP/연금저축 9백만원 한도 |

### Category: `care` (돌봄)

| slug | 제목 | 특이사항 |
|------|------|----------|
| `long-term-care-grade-application` | 장기요양등급 신청 방법 2026 총정리 | 재가급여 한도액 대폭 인상 |
| `medical-expense-support-parents` | 부모님 병원비 지원제도 2026 | 소득분위별 건강보험료 기준표 포함 |

---

## 🧮 핵심 기능

### 1. 소득인정액 계산기 (기초연금 아티클 내장)
- **위치**: `src/pages/ArticlePage.tsx` → `buildIncomeCalculatorWidget()`
- **트리거**: 포스트 content 내 `[[WIDGET:income-calculator]]` 태그
- **2026년 파라미터**:
  - 대도시 재산 공제: 1억 3,500만원
  - 중소도시 공제: 8,500만원 / 농어촌: 7,250만원
  - 금융재산 공제: 2,000만원
  - 월 환산율: 4% ÷ 12
  - 단독가구 선정기준: 247만원
  - 부부가구 선정기준: 395.2만원
  - 기초연금 최대액: 34.97만원(단독) / 55.952만원(부부)
- **요소 ID**: `ic-form`, `ic-result`, `ic-labor`, `ic-other-income`, `ic-property`, `ic-finance`, `ic-car`, `ic-region`

### 2. 노후진단 계산기 (메인 홈)
- **위치**: `public/static/app.js`
- 2026년 A값: 319.3511만원, 소득대체율 43%
- 등급 A~F 산출, 점수 링 애니메이션

### 3. 마크다운 렌더링
- **위치**: `ArticlePage.tsx` → `markdownToHtml()`
- 테이블, 리스트, 헤딩, blockquote, checklist, bold/italic 지원

### 4. 카카오톡 공유
- **위치**: `public/static/app.js` → `shareKakao()`
- 모바일: intent 스킴 / PC: 클립보드 복사 fallback

---

## 🚀 개발 & 배포

### 로컬 개발
```bash
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000   # 확인
pm2 logs --nostream          # 로그 확인
```

### Cloudflare Pages 배포
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name nohuseolye
```

### Cloudflare 계정
- 이메일: inungor@gmail.com
- Account ID: `83d26eb73d4246c3b33b8f07779a68b6`
- Project name: `nohuseolye`

---

## 🚢 운영 배포 · 롤백 (2026-10-19 갱신)

- **운영 도메인**: https://www.luckyu.co.kr (luckyu.co.kr → www 301)
- **배포 방식**: Cloudflare Pages `nohuseolye` — **직접 업로드(Git 연동 없음)**, BYOK(`wrangler pages deploy`)
- **배포 명령**: `npm run build && npx wrangler pages deploy dist --project-name nohuseolye --branch main`
- **현재 운영 배포**: `6e420247-9c78-439a-86ca-a399ec09f5f8` (commit `e76cacb`, Phase B + 오류 수정)
- **롤백 대상(운영 배포 전 정상 배포)**: `6e420247-9c78-439a-86ca-a399ec09f5f8` (commit `e76cacb`, Phase B 포함)
- **사용 금지**: `3e9b3c5a-dc7c-4914-a80f-cce0a6f7a33a` (commit `9888666`) — Phase B(내부링크 카드·GA4 internal_link_click)가 없는 구버전이라 롤백 대상이 아님
- **롤백 방법**
  1. Cloudflare 대시보드 → Workers & Pages → nohuseolye → Deployments → `6e420247` 선택 → *Rollback to this deployment* (즉시 반영)
  2. 또는 `git checkout e76cacb && npm run build && npx wrangler pages deploy dist --project-name nohuseolye --branch main`
- **참고**: gsk Hosted 배포(`*.vip.gensparksite.com`)는 미리보기용이며 운영 도메인과 무관함. Hosted 접근규칙은 Pages에 적용되지 않으므로 `/admin`은 라우트 자체를 비공개(404) 처리함.

### 2026-10-19 수정 요약
- 장기요양 재가급여 한도액 표를 보건복지부 보도자료(2025.11.4.) 붙임 2 기준으로 정정 (3~5등급·인지지원 수치 교정, 요양원 본인부담금 30일 기준 정정)
- 국민연금 3개 글의 손익분기점 정정 (5년 조기수령 시 정상수령 대비 +11년 8개월: 65세 기준 76세 8개월, 64세 기준 75세 8개월) 및 "물가·세금·건강보험료·시간가치 미반영" 명시
- `/admin`, `/admin/*` → 404 + noindex (robots.txt Disallow 추가), 헤더의 관리자 링크 제거
- 존재하지 않는 글 URL(`/pension-asset/*`, `/care/*`) 및 전역 미매칭 → 실제 HTTP 404 + noindex
- `/housing-income`, `/support`(준비 중) → `noindex` (meta + X-Robots-Tag), canonical 미출력
- 모바일 헤더(390px) nav 205px → 47px (가로 스크롤, 기존 디자인 유지)
- 모바일 JS 오류 `adsbygoogle.push() error: No slot size for availableWidth=0` 제거 (데스크톱 전용 사이드바 광고 슬롯을 모바일에서 요청하지 않도록 변경, 광고 단위·슬롯 ID 불변)

## ✍️ 콘텐츠 발행 워크플로 · 미리보기 환경 (2026-11 추가)

### 콘텐츠 구조
- 신규 글: `content/posts/<카테고리>/<slug>.md` (Markdown + frontmatter, 양식은 `content/posts/_TEMPLATE.md`)
- 사실 검증표: `content/verification/<slug>.yaml` (항목별 `verified | partial | unverified | conflict`)
- 기존 8개 글: `src/data/legacy-posts.ts` (변경 없음). `src/data/posts.ts`가 둘을 합쳐 제공
- 빌드 시 `scripts/build-content.ts`가 `src/generated/content.ts`를 생성 (git 제외)
- 상태: `draft` → `review` → `published` (published는 `approvedAt` 필수). **운영 빌드에는 published + 열린 카테고리만 포함**
- `housing-income`, `support` 카테고리는 `coming-soon`(noindex). 글이 3개 이상 published되고 승인된 뒤에만 `src/data/categories.ts`에서 `open`으로 변경

### 자주 쓰는 명령
```bash
npm run content:new            # 새 글 초안 생성
npm run content:check          # 형식·링크·검증표 검사 (오류 0이어야 발행 가능)
npm run content:check:review   # review 단계도 오류로 취급하는 엄격 검사
npm run typecheck              # TypeScript 타입 검사 (빌드와 별개)
npm run build                  # 운영 빌드 → dist (published만)
npm run build:preview          # 미리보기 빌드 → dist-preview (초안 포함)
npm run deploy:preview         # 미리보기 프로젝트(nohuseolye-preview)에 배포
```
> **빌드 성공과 타입 검사 성공은 별개입니다.** 배포 전에 `typecheck`, `content:check`, `build`를 모두 통과시킵니다.

### 미리보기 환경 (`nohuseolye-preview`)
- URL: https://nohuseolye-preview.pages.dev (운영 `nohuseolye` 프로젝트와 완전히 분리된 별도 Pages 프로젝트)
- 접근 보호: HTTP Basic 인증. 비밀번호는 Pages 시크릿 `PREVIEW_PASSWORD`로만 저장하며 **코드·README·채팅에 기록하지 않음** (시크릿이 없으면 접근 자체를 막는 fail-closed)
- 사이트 전체 noindex(meta + `X-Robots-Tag`), `robots.txt` Disallow, sitemap/rss 404
- GA4·AdSense 스크립트 제거, 초안·검토 메모 포함, 검증표는 `/_review/<slug>`, 검토 목록은 `/_review`
- 비밀번호 재설정: Cloudflare 대시보드 → Workers & Pages → nohuseolye-preview → Settings → Variables and Secrets → `PREVIEW_PASSWORD` 수정 후 `npm run deploy:preview` 재실행
- 로컬 확인: `CONTENT_MODE=preview` 빌드 결과를 `wrangler pages dev dist-preview --binding PREVIEW_PASSWORD=<임시값>`으로 실행

### 운영 반영 전 원칙
1. 미리보기에서 PC/모바일·수치·출처 검토 → 검토자가 승인
2. frontmatter `status: published` + `approvedAt` 기입, 필요한 경우 카테고리 `open` 전환
3. `typecheck`, `content:check`, `build` 통과 → 운영 배포(위 명령) → 라이브 URL·sitemap·RSS 확인
4. 문제 시 위 롤백 절차 사용

### 관련 문서
- `docs/housing-pension-calculation-review.md` — 기존 주택연금 계산 글 2026 개정사항 대조 결과(수정 전 검토 보고서)
- `docs/content-plan-40.md` — 신규 칼럼 40개 기획표 (검색량·CPC는 측정하지 않아 정성 표현만 사용)

### 현재 상태 (2026-11-06)
- 신규 칼럼 6편(H1~H3, S1~S3): `status: review`, 미리보기에만 존재, **운영 미공개**
- 운영 배포: `6e420247` (commit `e76cacb`) 그대로. 신규 글·카테고리 활성화 없음

---

## 🌍 도메인 연결 (진행 중)

- **연결 예정 도메인**: `luckyu.co.kr`
- **도메인 등록사**: 가비아 (gabia.com)
- **현황**: 티스토리 연결 해제 후 → Cloudflare Pages 연결 예정

### 가비아 DNS 설정 방법
1. 가비아 로그인 → DNS 정보 → 도메인 연결 [해제]
2. DNS 설정에서 레코드 추가:
   - `www` → CNAME → `nohuseolye.pages.dev` (TTL 600)
   - `@` (루트) → A레코드 → `76.76.21.21` (Cloudflare Pages IP)
3. Cloudflare Pages 대시보드 → nohuseolye 프로젝트 → Custom domains
   - `luckyu.co.kr` 및 `www.luckyu.co.kr` 등록

---

## 💰 애드센스 설정 (예정)

- **승인된 도메인**: `luckyu.co.kr`
- **삽입 위치**: `src/components/AdSlot.tsx`
- **방법**: `ca-pub-XXXXXXXX` Publisher ID를 AdSlot 컴포넌트에 입력

---

## ✅ 완료된 작업

- [x] 초기 프로젝트 구현 (Hono + Cloudflare Pages)
- [x] 2026년 최신 데이터 전면 업데이트
  - 기초연금 최대 349,700원
  - 국민연금 A값 319만 3,511원
  - 주택연금 3.13% 인상
  - 본인부담상한제 최고 843만원
- [x] 소득인정액 계산기 위젯 구현
- [x] 노후진단 계산기 구현
- [x] 카카오톡 공유 버그 수정
- [x] care 카테고리 라우팅 추가 (`/care`, `/care/:slug`)
- [x] Cloudflare Pages 배포 완료
- [x] 부모님 병원비 아티클 소득분위별 건강보험료 기준표 수정
  - 2~3분위: 110 → **112만원**
  - 4~5분위: 160 → **173만원**
  - 6~7분위: 290 → **326만원**
  - 8분위: 404 → **446만원**
  - 9분위: 580 → **536만원**
  - 직장/지역가입자 월 보험료 기준 열 추가

---

## 📋 남은 작업

- [ ] `luckyu.co.kr` 도메인 연결 (가비아 DNS 설정 대기)
- [ ] 애드센스 Publisher ID 삽입
- [ ] housing-income, support 카테고리 아티클 추가
- [ ] SEO: sitemap.xml, robots.txt 추가
- [ ] OG 태그 / 소셜 미리보기 이미지 최적화

---

## 📌 Git 커밋 이력

```
30932f9  fix: 부모님 병원비 아티클 건강보험료 소득분위별 기준표 데이터 수정
69df9ae  feat: 2026 income calculator and article improvements
3ec1801  fix: 아티클 렌더링 4가지 오류 전면 수정
543a985  fix: 2026년 최신 데이터 업데이트 및 카카오톡 공유 오류 수정
0961f94  feat: 노후설계 가이드 초기 구현 완료
a493434  initial: 초기 저장소 커밋
```

---

## 🔗 Genspark Git 저장소

```
https://www.genspark.ai/api/second-brain/me/genspark-85b5c2f7-174a-49e3-9aa7-42ba5cfd4137.git
Branch: main
```

새 채팅방에서 이어서 작업할 때:
1. 위 Genspark Git URL로 코드 상태 복구 가능
2. `/home/user/webapp/` 경로에 코드가 유지됨
3. `cloudflare_project_name = nohuseolye` 로 배포

_Last updated: 2026-04-29_
