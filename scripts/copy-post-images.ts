// 신규 글 대표 이미지: content/images/<file> → dist/static/images/posts/<file>
// 번들에 포함된 글(production은 published만)의 이미지만 복사하므로 초안 이미지는 운영 dist에 들어가지 않습니다.
import fs from 'node:fs'
import path from 'node:path'
import { CONTENT_DIR, ROOT } from './lib/content-lib'
import { generatedPosts } from '../src/generated/content'

const outDir = process.env.OUT_DIR || 'dist'
const dest = path.join(ROOT, outDir, 'static/images/posts')
fs.mkdirSync(dest, { recursive: true })
let n = 0
for (const p of generatedPosts) {
  if (!p.image?.src.startsWith('/static/images/posts/')) continue
  const file = path.basename(p.image.src)
  const src = path.join(CONTENT_DIR, 'images', file)
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(dest, file)); n++ }
}
console.log(`✔ 글 이미지 ${n}개 복사 → ${outDir}/static/images/posts`)
