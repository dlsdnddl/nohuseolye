// 빌드 산출물 검증: 미완성(draft/review) 콘텐츠·미리보기 모드가 운영 dist에 섞였는지 확인
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, loadRawPosts, CONTENT_DIR, Issue } from './lib/content-lib'
import { BUILD_MODE } from '../src/generated/content'

const outDir = process.env.OUT_DIR || 'dist'
const worker = path.join(ROOT, outDir, '_worker.js')
if (!fs.existsSync(worker)) { console.error('✖ dist/_worker.js 없음'); process.exit(1) }
const code = fs.readFileSync(worker, 'utf-8')
const problems: string[] = []

if (BUILD_MODE === 'production') {
  if (/"BUILD_MODE":\s*"preview"|BUILD_MODE\s*=\s*"preview"/.test(code)) problems.push('운영 번들에 preview 모드 표식이 있습니다.')
  const tmp: Issue[] = []
  for (const r of loadRawPosts(tmp)) {
    const status = String(r.fm.status)
    const slug = String(r.fm.slug)
    if (status === 'published') continue
    // 슬러그·제목이 번들에 있으면 비공개 글이 포함된 것
    if (slug && code.includes(slug)) problems.push(`비공개(${status}) 글 slug가 운영 번들에 포함됨: ${slug}`)
    if (r.fm.title && code.includes(String(r.fm.title))) problems.push(`비공개(${status}) 글 제목이 운영 번들에 포함됨: ${r.fm.title}`)
    const img = r.fm.image?.src ? path.join(ROOT, outDir, String(r.fm.image.src)) : ''
    if (img && fs.existsSync(img)) problems.push(`비공개(${status}) 글 이미지가 dist에 있음: ${r.fm.image.src}`)
  }
  if (fs.existsSync(path.join(ROOT, outDir, 'content')) || fs.existsSync(path.join(ROOT, outDir, 'verification'))) problems.push('dist에 content 폴더가 있습니다.')
  if (code.includes('PREVIEW_KEY') && /_review/.test(code)) problems.push('운영 번들에 미리보기 전용 코드(_review)가 활성 상태로 보입니다.')
}
if (problems.length) {
  console.error('✖ 빌드 산출물 검증 실패:\n' + problems.map(p => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`✔ 빌드 산출물 검증 통과 (mode=${BUILD_MODE}, dir=${outDir})`)
