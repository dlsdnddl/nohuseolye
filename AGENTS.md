# 작업 인수인계 (Codex / Claude Code 공용)

노후설계 가이드(LuckyU). Hono(JSX SSR) + Cloudflare Pages. 운영 도메인 https://www.luckyu.co.kr
GitHub: https://github.com/dlsdnddl/nohuseolye (브랜치 `main`)

## 현재 방침
- 기반 개발은 끝났고 **콘텐츠 중심 운영** 단계입니다. 새 CMS, 불필요한 기능 추가, 리팩터링, 국민연금 계산기(Phase C)는 하지 않습니다.
- 사용자는 개발 지식이 적습니다. **한국어, 쉬운 말**로 보고합니다.
- 광고 위치·개수, 대규모 디자인은 바꾸지 않습니다.

## 시작하기
```bash
npm install
npm run content:check     # 오류 0이어야 함
npm run typecheck
npm run build             # dist 생성 (운영 모드: published 글만 포함)
```
- `src/generated/content.ts`는 git에 없고 빌드 때 자동 생성됩니다.
- 로컬 확인: `npx wrangler pages dev dist --port 3000` (미리보기는 `npm run build:preview` → `dist-preview`)

## 글 발행 규칙 (YMYL: 연금·복지·건강보험)
- 글: `content/posts/<category>/<slug>.md`, 검증표: `content/verification/<slug>.yaml`
- 새 글 만들기: `npm run content:new -- <category> <slug>`
- 상태: `draft` → `review` → `published`. published는 `approvedAt` 필수이며 검증표에 `unverified`/`conflict`가 있으면 안 됩니다.
- **금액·기준 수치는 공식 출처(국민연금공단, 한국주택금융공사, 보건복지부, 국가법령정보센터, 건보공단)로 확인**한 뒤에만 `verified`로 표시합니다. 확인 못 한 것은 `partial`로 두고 본문에 "공단 확인 필요"를 적습니다.
- 검색량·CPC 같은 수치는 지어내지 않습니다.
- 내부 링크는 **공개된 글**에만 겁니다.
- 기존 글에서 새 글로 가는 카드: 새 글 frontmatter의 `inboundLinks`(`from`, `question`, `description`)에 적습니다. 새 글이 운영 빌드에 포함될 때만 적용됩니다.
- 위젯: `[[WIDGET:housing-pension-calc]]`, `[[WIDGET:income-calculator]]` (본문에 한 줄로)

## 현재 글 상태 (2026-11-10)
- 공개 22편: 기존 14 + 2026-11-09 신규 6 + 2026-11-10 신규 2(`national-pension-income-reduction`, `housing-pension-application-process`)
- `review` 유지(운영에 노출되지 않음):
  - `basic-pension-2027-increase`: 별도 재검증 필요
  - `health-insurance-dependent-retirement`: 2026-11-10에 현행 법령 재검증 완료(확인 12·부분 4). 사용자 승인 시 발행 가능
- 다음 칼럼은 사용자가 주제를 알려주면 시작합니다.

## 운영 배포 (Cloudflare Pages, 프로젝트 `nohuseolye`)
- 이 저장소의 `wrangler.jsonc` 이름은 `webapp`이지만 **실제 운영 프로젝트는 `nohuseolye`** 입니다. 반드시 `--project-name nohuseolye`를 씁니다.
```bash
export CLOUDFLARE_API_TOKEN=...   # 사용자에게 받아 환경변수로만 사용. 파일·커밋·채팅에 노출 금지
npm run content:check && npm run typecheck && npm run build
npx wrangler pages deploy dist --project-name nohuseolye --branch main
npx wrangler pages deployment list --project-name nohuseolye
```
- `wrangler login`(브라우저 로그인)은 쓰지 않습니다.
- 배포 후 확인: 신규 URL 200, sitemap/RSS 반영, `noindex` 없음, GA4·AdSense 유지, 기존 글·내부링크 정상, review 글 404.
- **롤백 대상**: 직전 정상 배포 `22cd9dba-611c-49b5-8ab2-902985f5d9c9` (현재 운영: `44c79c6a-459c-4b23-b92b-844359e27ba6`, commit `2fb13bb`). 더 이전 `6e420247-9c78-439a-86ca-a399ec09f5f8`. `3e9b3c5a...`는 구버전이라 사용 금지.
- 심각한 오류가 있으면 운영 배포를 멈추고 먼저 보고합니다.

## 미리보기 환경 (`nohuseolye-preview`, 비공개 검토용)
- `npm run deploy:preview` (Basic Auth, 사용자명 `luckyu`, noindex, `/_review`에서 review 글 확인)
- 비밀번호는 저장소에 없습니다. 사용자에게 받은 접근 정보 파일에 있고, 채팅에 출력하지 않습니다.

## 절대 하지 말 것
- 토큰·비밀번호·`.dev.vars`·`.env`를 커밋하거나 출력하기
- `git push --force`
- 확인되지 않은 수치를 `verified`로 표시하기
- review 상태 글을 임의로 발행하기
