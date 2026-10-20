// npm run content:check [-- --mode=preview] [--strict-review] [--json]
//  - production(기본): 운영 배포 기준 (draft/review는 번들 제외 대상으로 요약만 표시, 상태별 완성도는 경고)
//  - --strict-review : review 상태 글도 published 수준(오류)으로 점검 → 운영자 검토 요청 전 최종 점검용
// ※ 형식·링크·노출 상태만 자동 점검합니다. 본문 수치·제도 설명의 정확성은 판단하지 않습니다.
//   공식자료 대조는 content/verification/<slug>.yaml 검증표와 사람의 검수 단계로 별도 수행하세요.
import { categories, getCategory } from '../src/data/categories'
import { legacyPosts } from '../src/data/legacy-posts'
import { runChecks } from './lib/check-rules'
import { printReport } from './lib/report'

const args = process.argv.slice(2)
const mode = args.includes('--mode=preview') ? 'preview' : 'production'
const strictReview = args.includes('--strict-review')
const res = runChecks({ mode, strictReview })
const SITE = 'https://www.luckyu.co.kr'

if (args.includes('--json')) {
  console.log(JSON.stringify(res.issues, null, 2))
  process.exit(res.issues.some(i => i.level === 'error') ? 1 : 0)
}

// ── 상태 요약 ────────────────────────────────────────────────
console.log('\n══ 콘텐츠 상태 요약 ══')
console.log('기존(TS) 글:', legacyPosts.length, '편 (모두 published)')
const rows = res.mdPosts.map(p => {
  const open = getCategory(p.category)?.state === 'open'
  const inProd = p.status === 'published' && open
  return `  ${String(p.status).padEnd(9)} ${`/${p.category}/${p.slug}`.padEnd(62)} 운영 번들: ${inProd ? '포함' : '제외'}`
})
console.log(rows.length ? rows.join('\n') : '  (신규 md 글 없음)')

// ── sitemap/canonical 예상 ───────────────────────────────────
const pub = [
  ...legacyPosts.map(p => ({ url: `/${p.category}/${p.slug}`, noindex: false })),
  ...res.mdPosts.filter(p => p.status === 'published' && getCategory(p.category)?.state === 'open').map(p => ({ url: `/${p.category}/${p.slug}`, noindex: p.noindex === true })),
]
const sitemapUrls = [
  SITE + '/',
  ...categories.filter(c => c.state === 'open').map(c => `${SITE}/${c.slug}`),
  ...pub.filter(p => !p.noindex).map(p => SITE + p.url),
]
const dup = sitemapUrls.filter((u, i) => sitemapUrls.indexOf(u) !== i)
if (dup.length) res.issues.push({ level: 'error', file: 'sitemap', rule: 'sitemap-duplicate', message: `sitemap 예상 URL 중복: ${dup.join(', ')}` })
for (const u of sitemapUrls) {
  if (!/^https:\/\/www\.luckyu\.co\.kr(\/[a-z0-9-]*)*$/.test(u)) res.issues.push({ level: 'error', file: 'sitemap', rule: 'sitemap-canonical', message: `sitemap/canonical 형식 오류: ${u}` })
}
console.log(`\n예상 sitemap URL ${sitemapUrls.length}개 (홈·open 허브·published·noindex 아님)`)

printReport(res.issues, `content:check (${mode}${strictReview ? ', strict-review' : ''})`)
const errors = res.issues.filter(i => i.level === 'error')
if (errors.length) {
  console.error(`\n✖ 실패: 오류 ${errors.length}건 — 발행/빌드를 중단합니다.`)
  process.exit(1)
}
console.log('\n✔ 통과 (형식·링크·노출 상태 점검). ※ 본문 수치의 정확성은 검증표 기반 별도 검수가 필요합니다.')
