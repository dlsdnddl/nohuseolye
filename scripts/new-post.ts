// npm run content:new -- <category> <slug> ["제목"]
import fs from 'node:fs'
import path from 'node:path'
import { categories } from '../src/data/categories'
import { CONTENT_DIR } from './lib/content-lib'

const [category, slug, ...titleParts] = process.argv.slice(2)
if (!category || !slug) { console.error('사용법: npm run content:new -- <category> <slug> ["제목"]\n카테고리: ' + categories.map(c => c.slug).join(', ')); process.exit(1) }
if (!categories.some(c => c.slug === category)) { console.error('알 수 없는 카테고리: ' + category); process.exit(1) }
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { console.error('slug는 영문 소문자·숫자·하이픈만 가능합니다.'); process.exit(1) }
const dir = path.join(CONTENT_DIR, 'posts', category)
const file = path.join(dir, `${slug}.md`)
if (fs.existsSync(file)) { console.error('이미 존재: ' + file); process.exit(1) }
const today = new Date().toISOString().slice(0, 10)
let tpl = fs.readFileSync(path.join(CONTENT_DIR, 'posts/_TEMPLATE.md'), 'utf-8')
tpl = tpl.replace('english-kebab-case-slug.jpg', `${slug}.jpg`).replace(/english-kebab-case-slug/g, slug).replace('category: housing-income ', `category: ${category} `).replace(/2026-10-20/g, today)
if (titleParts.length) tpl = tpl.replace('title: "제목 (H1로 출력)"', `title: "${titleParts.join(' ')}"`)
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(file, tpl)
const vdir = path.join(CONTENT_DIR, 'verification')
fs.mkdirSync(vdir, { recursive: true })
const vfile = path.join(vdir, `${slug}.yaml`)
if (!fs.existsSync(vfile)) fs.writeFileSync(vfile, `slug: ${slug}\ncheckedAt: ${today}\nrows:\n  - item: "검증 항목"\n    value: "실제 적용 수치 또는 조건"\n    agency: "공식 기관"\n    document: "공식 문서명"\n    url: "https://"\n    effectiveDate: "YYYY-MM-DD"\n    checkedAt: "${today}"\n    result: unverified   # verified | partial | unverified | conflict\n`)
console.log(`✔ 생성: ${path.relative(process.cwd(), file)}\n✔ 생성: ${path.relative(process.cwd(), vfile)}\n다음: 작성 → npm run content:check → status를 review로 → 미리보기 배포 → 운영자 승인 → published`)
