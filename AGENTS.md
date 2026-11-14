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

## 현재 글 상태 (2026-11-14)
- 공개 글 19편(sitemap URL은 홈·카테고리 4개 포함 24개): 기존 형식(`legacy-posts.ts`) 8 + Markdown 11
  - 2026-11-11 `national-pension-additional-payment`(국민연금 추납, 확인 11·부분 4)
  - 2026-11-12 `nursing-hospital-caregiver-cost-coverage`(요양병원 간병비 급여화, 확인 6·부분 6)
- **갱신 예정(중요)**: `nursing-hospital-caregiver-cost-coverage`는 건강보험정책심의위원회 최종 확정 전에 발행했습니다(사용자 결정: 지금 발행, 발표 후 갱신). 보건복지부가 간병급여 제도화 방안을 확정 발표하면 본문 2번 표(확정/언론 보도 구분), 시행 시기, 본인부담률, 대상 병원·환자, FAQ, 검증표를 공식 발표 기준으로 고치고 `updatedAt`·`verifiedAt`을 갱신합니다. 확인 위치: 보건복지부 보도자료 게시판에서 제목 "간병" 검색.
- **갱신 예정(중요)**: `changes-2027-pension-welfare`(2026-11-14 발행, 확인 10·부분 3, 공식 출처 확인 2026-11-12)는 두 번 갱신이 필요합니다. ① 12월 초 국회 예산안 처리·기초연금법 개정 결과가 나오면 3번 섹션(기초연금 개편, 노인일자리)을 고칩니다. ② 2027년 1월 발표(국민연금·기초연금 물가 인상률, A값, 기초연금 선정기준액)가 나오면 1번 표와 4번 섹션을 고칩니다. 무치악 임플란트 세부 기준이 나오면 이 글과 `senior-implant-denture-insurance`를 함께 고칩니다.
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
- **한 번에 배포**: `npm run deploy:nohuseolye` (`scripts/deploy-prod.ts`). 점검 → 타입 검사 → 빌드 → `nohuseolye`/`main` 배포 → 배포 목록 출력까지 실행하고, 앞 단계가 실패하면 배포하지 않습니다. 토큰은 환경변수 `CLOUDFLARE_API_TOKEN`, 없으면 `.deploy.local.json`(git 제외)의 `tokenFile`이 가리키는 파일에서 읽으며 화면에 출력하지 않습니다. **사용자가 "배포해줘"라고 할 때만 실행**하고, 배포 후 위 확인 항목을 점검합니다.
- **현재 운영**(2026-11-14): `aa84915d-c5c7-4a4a-9ff9-3bfcbe5fab1a`(commit `7673f7a`, 2027년 달라지는 제도 칼럼 공개).
- **롤백 대상**: 직전 정상 배포 `bcca1f57-400f-48ef-9a2a-00b1d7c9b02c`(commit `ab9c85d`, 인용 상자 수정까지). 더 이전 `f0c4707d-f6a1-4358-b5d7-fbc2fec73e90`(commit `ae8e2fc`), `2e8a25ba-5195-47b5-89c4-0263ddac8527`(commit `8316509`), `d10fdd9c-4c11-4dd0-97f9-2fc90753b69c`(commit `0229c31`).
- 본문 작성 참고: 연속된 `> ` 줄은 인용 상자 하나로 묶이고, 상자 안의 `> - ` 줄은 점 목록으로 출력됩니다(용어 설명 상자에 사용).
- 롤백 방법: Cloudflare 대시보드 → Workers 및 Pages → `nohuseolye` → 배포 → 되돌릴 배포의 `…` 메뉴 → "이 배포로 롤백".
- Windows에서는 `export` 대신 PowerShell `$env:CLOUDFLARE_API_TOKEN = "..."`를 씁니다. `npm run deploy:prod`는 프로젝트명이 `webapp`이라 쓰지 않습니다. `3e9b3c5a...`는 구버전이라 사용 금지.
- 심각한 오류가 있으면 운영 배포를 멈추고 먼저 보고합니다.

## 뉴스레터 구독 (2026-11-11 추가)
- 푸터 양식 → `POST /api/subscribe`(`src/index.tsx`) → Google 설문지 → 연결된 Google 스프레드시트 "LuckyU 뉴스레터 구독"에 한 줄씩 저장(타임스탬프·이메일·신청 페이지).
- 설문지 ID·질문 ID는 `src/lib/newsletter.ts`에 있습니다(비밀값 아님). 설문지를 새로 만들면 이 값만 바꿉니다. 설문지나 질문을 삭제하면 저장이 끊깁니다.
- 스팸 방지: 숨은 칸(`website`)이 채워진 요청은 저장하지 않고, 다른 사이트 Origin 요청은 403.
- 이메일을 모으기만 하며 발송 기능은 없습니다. 수집·보관 내용은 `/privacy`에 적혀 있으므로 저장 방식을 바꾸면 방침도 함께 고칩니다.
- 배포 후 확인: 운영에서 테스트 이메일 1건 신청 → 시트에 쌓이는지 확인 → 테스트 줄은 사용자가 삭제.

## 미리보기 환경 (`nohuseolye-preview`, 비공개 검토용)
- `npm run deploy:preview` (Basic Auth, 사용자명 `luckyu`, noindex, `/_review`에서 review 글 확인)
- 비밀번호는 저장소에 없습니다. 사용자에게 받은 접근 정보 파일에 있고, 채팅에 출력하지 않습니다.

## 절대 하지 말 것
- 토큰·비밀번호·`.dev.vars`·`.env`를 커밋하거나 출력하기
- `git push --force`
- 확인되지 않은 수치를 `verified`로 표시하기
- review 상태 글을 임의로 발행하기
