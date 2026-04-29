# 노후설계 가이드 (nohuseolye)

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
| 빌드 도구 | Vite + TypeScript |
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
│   ├── data/posts.ts          # 아티클 데이터 (6개 포스트)
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
├── dist/                      # 빌드 결과물 (배포용)
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
