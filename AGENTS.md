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
- 내부 링크는 **공개된 글**에만 겁니다. 본문에서는 `[글 제목](/category/slug)` 형식으로 쓰면 클릭되는 링크로 출력됩니다.
- 기존 글에서 새 글로 가는 카드: 새 글 frontmatter의 `inboundLinks`(`from`, `question`, `description`)에 적습니다. 새 글이 운영 빌드에 포함될 때만 적용됩니다.
- 위젯: `[[WIDGET:housing-pension-calc]]`, `[[WIDGET:income-calculator]]` (본문에 한 줄로)
- 위젯 `[[WIDGET:pension-birth-picker]]`(2026-11-16 추가, 사용자 승인): 출생연도(1961~1974)·생월을 고르면 정상 수령 나이, 첫 지급 달, 조기 수령 청구 가능 시점, 의무 납부 종료, 연기 최대 시점을 보여줍니다. 연금액은 계산하지 않습니다. 계산은 `public/static/app.js`의 `birthPickerUpdate()`(근거: 공단 지급연령표, 국민연금법 제12조·제54조). 출생연도 글을 새로 쓰면 같은 파일의 `BIRTH_PICKER_POSTS`에 주소를 추가합니다. 지급 나이 제도가 바뀌면 `birthPickerNormalAge()`를 고칩니다.
- 글 중간 "이어서 읽기" 카드(2026-11-16 추가): 본문 소제목(`##`)이 4개 이상이면 절반쯤 지난 소제목 앞에 자동으로 들어갑니다. 내용은 `nextQuestions`의 첫 번째(없으면 `relatedPosts` 첫 번째)이므로, 가장 이어 읽히길 바라는 글을 `nextQuestions` 맨 위에 둡니다.
- 체크리스트(`- [ ]`)는 눌러서 체크할 수 있고, 체크 상태는 방문자 기기(브라우저)에만 저장됩니다(서버로 보내지 않음).

## 주제 선정·글쓰기 원칙 (사용자 지시, 2026-11-15~16)
- 주제는 다음 중 하나 이상에 해당해야 합니다: 현재 이슈, 관심이 높아지는 주제, 꾸준히 찾는 주제, 상위 노출이 쉬운 주제, 저장·공유하고 싶은 주제. 고른 이유를 사용자에게 설명합니다.
- 항상 SEO를 고려합니다: 제목·`seoTitle`·`metaDescription`·소제목에 핵심 검색어, FAQ, 내부 링크, 참고용 표.
- 구글 AI 개요에 인용되기 쉬운 방식과 기존 방식을 **번갈아** 씁니다(사용자 지시 2026-11-16: 두 방식을 비교해 보기 위함. 보장은 불가). 글마다 어느 방식으로 썼는지 `reviewNotes`에 적습니다. AI 개요 방식은 다음과 같습니다.
  - 답을 먼저: 글 첫머리와 각 소제목 바로 아래 첫 문장에 핵심 숫자·날짜가 들어간 완결된 문장으로 답합니다. 그 문장만 따로 인용해도 뜻이 통해야 합니다.
  - 소제목과 FAQ 질문은 실제 검색 질문 형태로 씁니다(예: "1964년생 국민연금 수령나이는 몇 살인가요?").
  - 짧은 목록·표에 항목 이름을 분명히 붙이고, 구체적인 예시를 하나 넣습니다(예: "1964년 5월생은 2027년 6월분부터").
  - 공식 출처 검증과 확인 날짜 표시는 그대로 유지합니다.

## 현재 글 상태 (2026-11-16)
- 공개 글 26편(sitemap URL은 홈·카테고리 4개 포함 31개): 기존 형식(`legacy-posts.ts`) 6 + Markdown 20
  - 2026-11-17 `national-pension-1969-born`(1969년생 국민연금 수령 시기, 확인 7·부분 7). AI 개요 방식. 다음 새 글은 기존 방식 차례
  - 2026-11-17 `national-pension-1965-born`(1965년생 국민연금 수령 시기, 확인 8·부분 6). 기존 방식. 그 뒤 출생연도 모음 페이지 예정
  - 2026-11-16 `early-pension-1967`·`early-pension-1968` 전면 개정(체류시간 개선 1번, 네이버 유입 1·2위 글). 기존 형식에서 Markdown으로 옮기고 주소·최초 발행일 유지. 생월별 12개월 표, 납부 종료, 연기연금 추가, 확인 안 된 수치 삭제(각 확인 8·부분 6). 1967년생은 AI 개요 방식, 1968년생은 기존 방식으로 써서 비교용. A값은 2026년 값이라 1월 갱신 대상
  - 2026-11-16 `national-pension-1966-born`(1966년생 국민연금 수령 시기, 확인 8·부분 5). **AI 개요 방식 첫 글**(이전 글은 모두 기존 방식). 다음 새 글은 기존 방식 차례. A값은 2026년 값이라 1월 갱신 대상
  - 2026-11-16 `national-pension-1964-born`(1964년생 국민연금 수령 시기, 확인 8·부분 4). 감액 기준 등은 2026년 값이라 2027년 1월 발표 후 갱신 필요
  - 주제 선정 참고: 네이버 서치어드바이저(2026-11-16 사용자 제공)에서 유입 대부분이 출생연도·생월 검색어(`1968년5월생 국민연금`, `수령년도`, `개시일`, `납부종료`). 같은 형식의 출생연도 글(1963년생)이 다음 후보
  - 2026-11-15 `long-term-care-home-benefit-limit-2027`(2027년 장기요양 재가급여 한도액, 확인 9·부분 3). 2027년 고시가 나오면 시행일 확인. `long-term-care-grade-application`(2026년 수치)은 1월에 2027년 수치로 갱신 필요
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
- **현재 운영**(2026-11-17): `a0763a1b-affb-49f1-adde-4425933cd3d1`(commit `d590b11`, 출생연도별 모음 글 공개).
- **롤백 대상**: 직전 정상 배포 `9507e0f6-e7e0-45fd-8cff-7a0eee43fff1`(commit `1211eb3`, 1969년생 칼럼 공개). 더 이전 `0d448268-c841-4fa0-9bbc-4571d271a985`(commit `0d5d776`), `b3be62de-865c-4da7-9b61-35270a14d74e`(commit `bfb63a8`), `55f2f762-1e07-4903-a74f-581c57066463`(commit `5cb124d`), `ec43a1d2-480f-4141-a13a-f199af4e60d2`(commit `c637a26`), `d6bc07ad-6f34-4786-b5e2-62bec9dcb977`(commit `ec10d1d`), `46e9f344-c0df-4317-8e2f-787bad4a3632`(commit `c09caed`), `10e2e37b-4cc0-4fe2-8982-27e400391dfa`(commit `e613080`), `f4650bb9-af9e-4ef9-9703-0155e0a98716`(commit `2411ecb`), `aa84915d-c5c7-4a4a-9ff9-3bfcbe5fab1a`(commit `7673f7a`, Tailwind CDN 방식).
- 화면 스타일: Tailwind는 CDN이 아니라 빌드 때 `public/static/tailwind.css`(git 제외)로 만듭니다(`npm run css:build`, `npm run build`에 포함). 색상·글꼴 설정은 `tailwind.config.cjs`. 클래스 이름을 문자열로 조립하면(`"bg-" + color`) CSS에 빠지니 전체 이름을 그대로 씁니다.
- 사이트 검색: `GET /search?q=`(noindex). 끝에 `/`가 붙은 주소는 `/` 없는 주소로 301 이동합니다.
- 본문 작성 참고: 첫 소제목(`## 이 글이 필요한 분`) 앞에 쓴 문단은 글 맨 위(요약 상자 위)에 출력되고, `## 3줄 요약` 목록 뒤에 쓴 안내 상자는 본문 맨 앞에 출력됩니다(2026-11-16 수정 전에는 둘 다 화면에 나오지 않았음). 연속된 `> ` 줄은 인용 상자 하나로 묶이고, 상자 안의 `> - ` 줄은 점 목록으로 출력됩니다(용어 설명 상자에 사용).
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
