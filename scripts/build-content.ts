// 콘텐츠 번들 생성: content/posts/**/*.md → src/generated/content.ts
//   production(기본): published + 카테고리 open 인 글만 번들에 포함 (draft/review는 코드에 들어가지 않음)
//   preview          : CONTENT_MODE=preview — draft/review/published 모두 포함(+검증표·검토메모), 사이트 전체 noindex
import fs from 'node:fs'
import path from 'node:path'
import { getCategory } from '../src/data/categories'
import type { NextQuestion, Post } from '../src/types'
import { ROOT, readInboundLinks } from './lib/content-lib'
import { runChecks } from './lib/check-rules'
import { printReport } from './lib/report'

const mode = process.env.CONTENT_MODE === 'preview' ? 'preview' : 'production'
const res = runChecks({ mode })
const errors = res.issues.filter(i => i.level === 'error')

printReport(res.issues, `build-content (${mode})`)
if (errors.length) {
  console.error(`\n✖ 콘텐츠 오류 ${errors.length}건 — 빌드를 중단합니다. 위 "수정 방법"을 따라 고친 뒤 다시 실행하세요.`)
  process.exit(1)
}

const included: Post[] = []
const inbound: Record<string, NextQuestion[]> = {}
res.mdPosts.forEach((p, i) => {
  const include = mode === 'preview' ? true : p.status === 'published' && getCategory(p.category)?.state === 'open'
  if (!include) return
  const copy: Post = { ...p }
  if (mode === 'production') delete copy.review // 검토 메모는 운영 번들에 넣지 않음
  included.push(copy)
  for (const ib of readInboundLinks(res.raws[i])) {
    ;(inbound[ib.from] ||= []).push({ question: ib.question, href: `/${p.category}/${p.slug}`, contentType: 'related-article', description: ib.description })
  }
})

const sheets = mode === 'preview' ? res.sheets : {}
const out = `// ⚠ 자동 생성 파일 — 수정하지 마세요. (scripts/build-content.ts)
import type { NextQuestion, Post, VerificationSheet } from '../types'

export const BUILD_MODE: 'production' | 'preview' = ${JSON.stringify(mode)}
export const generatedPosts: Post[] = ${JSON.stringify(included, null, 1)}
export const inboundNextQuestions: Record<string, NextQuestion[]> = ${JSON.stringify(inbound, null, 1)}
export const verificationSheets: Record<string, VerificationSheet> = ${JSON.stringify(sheets, null, 1)}
`
fs.mkdirSync(path.join(ROOT, 'src/generated'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'src/generated/content.ts'), out)
console.log(`\n✔ 콘텐츠 번들 생성: mode=${mode}, 신규(md) 글 ${included.length}편 포함 (제외 ${res.mdPosts.length - included.length}편)`)
