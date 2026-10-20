// content:check 규칙 모음.
// 원칙: "구조·안전·노출 상태" 오류는 항상 error, "완성도(검증일/출처/이미지 등)"는 상태별 심각도.
//   draft     → warn (작성 중)
//   review    → warn (--strict-review 이면 error: 운영자에게 넘기기 전 점검용)
//   published → error (발행 차단)
// ※ 자동 검사는 형식·링크·노출 상태만 점검합니다. 본문 수치·제도 설명의 정확성은 판단하지 않으며,
//   content/verification/<slug>.yaml 검증표와 공식자료 대조(사람/AI 검수 단계)로 별도 확인해야 합니다.
import fs from 'node:fs'
import path from 'node:path'
import { categories, getCategory, SITUATIONS, STATIC_PATHS } from '../../src/data/categories'
import { legacyPosts } from '../../src/data/legacy-posts'
import type { Post, VerificationSheet } from '../../src/types'
import { Issue, RawPost, loadRawPosts, loadVerificationSheets, readInboundLinks, toPost, PUBLIC_DIR, CONTENT_DIR } from './content-lib'

export interface CheckOptions {
  mode: 'production' | 'preview'
  strictReview?: boolean
}

export interface CheckResult {
  issues: Issue[]
  raws: RawPost[]
  mdPosts: Post[]
  sheets: Record<string, VerificationSheet>
}

const STATUSES = ['draft', 'review', 'published']
const TYPES = ['pillar', 'comparison', 'checklist']
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const KNOWN_WIDGETS = ['income-calculator', 'housing-pension-calc']
const PLACEHOLDER_RE = /TODO|TBD|\bXXX\b|OOO|\[\[확인필요\]\]|\(검증 ?필요\)|\{\{/
// 공식 출처로 인정하는 도메인(접미사). 목록 밖이면 warn — 2차 출처가 섞이지 않도록 점검용.
const OFFICIAL_SUFFIXES = ['.go.kr', '.or.kr', '.re.kr', '.kr']
const OFFICIAL_STRICT = ['.go.kr', '.or.kr']

export function runChecks(opts: CheckOptions): CheckResult {
  const issues: Issue[] = []
  const raws = loadRawPosts(issues)
  const sheets = loadVerificationSheets(issues)
  const add = (level: Issue['level'], file: string, rule: string, message: string, fix?: string) => issues.push({ level, file, rule, message, fix })

  const completeness = (status: string): Issue['level'] =>
    status === 'published' ? 'error' : status === 'review' && opts.strictReview ? 'error' : 'warn'

  // ── 1) frontmatter 파싱 결과 → Post ──────────────────────────────────────────
  const mdPosts: Post[] = raws.map((r, i) => toPost(r, i))
  const bySlug = new Map<string, { file: string; where: string }>()
  for (const lp of legacyPosts) bySlug.set(lp.slug, { file: 'src/data/legacy-posts.ts', where: 'legacy' })

  const cats = categories.map(c => c.slug as string)
  const isOpen = (cat: string) => getCategory(cat)?.state === 'open'

  // 발행 후 실제로 공개되는 URL 집합 (production 기준: published + 카테고리 open)
  const publicPaths = new Set<string>()
  const knownPaths = new Set<string>() // 존재는 하지만 아직 비공개일 수 있는 글 경로
  for (const lp of legacyPosts) {
    publicPaths.add(`/${lp.category}/${lp.slug}`)
    knownPaths.add(`/${lp.category}/${lp.slug}`)
  }
  for (const p of mdPosts) {
    const url = `/${p.category}/${p.slug}`
    knownPaths.add(url)
    if (p.status === 'published' && isOpen(p.category)) publicPaths.add(url)
  }
  const publicHubs = new Set(categories.filter(c => c.state === 'open').map(c => `/${c.slug}`))
  const allHubs = new Set(categories.map(c => `/${c.slug}`))

  // ── 2) 글별 검사 ─────────────────────────────────────────────────────────────
  raws.forEach((raw, i) => {
    const f = raw.file
    const fm = raw.fm
    const p = mdPosts[i]
    const status = String(fm.status ?? '')

    // 필수(항상 error)
    for (const k of ['title', 'slug', 'category', 'status', 'metaDescription', 'publishedAt', 'updatedAt', 'type']) {
      if (fm[k] === undefined || fm[k] === null || String(fm[k]).trim() === '') add('error', f, 'required-meta', `필수 메타데이터 누락: ${k}`, `frontmatter에 ${k}를 입력하세요.`)
    }
    if (!STATUSES.includes(status)) add('error', f, 'status', `status 값이 올바르지 않습니다: "${status}"`, 'draft | review | published 중 하나로 지정하세요.')
    if (fm.type && !TYPES.includes(fm.type)) add('error', f, 'type', `type 값이 올바르지 않습니다: "${fm.type}"`, 'pillar | comparison | checklist')

    // slug / category / URL 중복
    if (fm.slug && !SLUG_RE.test(String(fm.slug))) add('error', f, 'slug', `slug 형식 오류: "${fm.slug}"`, '영문 소문자·숫자·하이픈만 사용하세요.')
    if (fm.slug && path.basename(f, '.md') !== String(fm.slug)) add('error', f, 'slug-filename', `파일명(${path.basename(f)})과 slug(${fm.slug})가 다릅니다.`, '파일명을 <slug>.md 로 맞추세요.')
    if (fm.category && !cats.includes(String(fm.category))) add('error', f, 'category', `알 수 없는 카테고리: "${fm.category}"`, `사용 가능: ${cats.join(', ')}`)
    if (fm.category && raw.dirCategory !== String(fm.category)) add('error', f, 'category-dir', `폴더(${raw.dirCategory})와 frontmatter category(${fm.category})가 다릅니다.`, '파일을 올바른 카테고리 폴더로 옮기거나 category를 수정하세요.')
    if (fm.slug) {
      const prev = bySlug.get(String(fm.slug))
      if (prev) add('error', f, 'duplicate-url', `slug "${fm.slug}"가 중복됩니다 (${prev.file}).`, 'slug는 전체 글에서 유일해야 합니다.')
      else bySlug.set(String(fm.slug), { file: f, where: 'md' })
    }

    // 날짜
    for (const k of ['publishedAt', 'updatedAt', 'verifiedAt', 'approvedAt']) {
      if (fm[k] !== undefined && !DATE_RE.test(String(fm[k]))) add('error', f, 'date-format', `${k} 형식 오류: "${fm[k]}"`, 'YYYY-MM-DD 로 따옴표 없이 쓰거나 "YYYY-MM-DD" 문자열로 쓰세요.')
    }
    if (DATE_RE.test(String(fm.publishedAt)) && DATE_RE.test(String(fm.updatedAt)) && String(fm.updatedAt) < String(fm.publishedAt)) {
      add('error', f, 'date-order', 'updatedAt이 publishedAt보다 빠릅니다.', 'updatedAt >= publishedAt')
    }

    // situation
    if (fm.situation && !(SITUATIONS as readonly string[]).includes(String(fm.situation))) {
      add('error', f, 'situation', `situation 값이 홈 탭 목록에 없습니다: "${fm.situation}"`, `사용 가능: ${SITUATIONS.join(' / ')} (또는 비움)`)
    }

    // 공개 상태 ↔ 노출 상태
    if (status === 'published') {
      if (!fm.approvedAt) add('error', f, 'approval', 'published인데 approvedAt(운영자 승인일)이 없습니다.', '운영자 승인 후 approvedAt: YYYY-MM-DD 를 기록하세요.')
      if (fm.category && !isOpen(String(fm.category))) {
        add('error', f, 'visibility-mismatch', `status가 published지만 카테고리(${fm.category})가 coming-soon이라 실제로는 노출되지 않습니다.`, 'src/data/categories.ts에서 카테고리를 open으로 바꾸거나(승인 후, 검증된 글 3편 이상), 글을 review로 되돌리세요.')
      }
      if (fm.noindex === true) add('warn', f, 'noindex-published', 'published이지만 noindex=true 입니다. 검색 색인·sitemap·RSS에서 제외됩니다.', '의도한 것이 아니면 noindex를 제거하세요.')
    } else if (fm.approvedAt) {
      add('warn', f, 'approval-on-unpublished', `${status} 상태인데 approvedAt이 있습니다.`)
    }

    // 완성도(상태별 심각도)
    const lv = completeness(status)
    if (status === 'review' || status === 'published' || opts.strictReview) {
      if (!fm.seoTitle) add(lv, f, 'seo-title', 'seoTitle이 없습니다.', 'SEO 제목을 입력하세요 (60자 내외 권장).')
      if (!fm.verifiedAt) add(lv, f, 'verified-at', 'verifiedAt(공식자료 검증일)이 없습니다.', '공식자료 대조를 마친 날짜를 기록하세요.')
      if (!fm.basisYear) add(lv, f, 'basis-year', 'basisYear(정책 적용 연도)가 없습니다.')
      if (!Array.isArray(fm.sources) || fm.sources.length === 0) add(lv, f, 'sources', '공식 출처(sources)가 없습니다.', '기관·문서명·URL·확인일을 sources에 입력하세요.')
      if (!Array.isArray(fm.faq) || fm.faq.length < 2) add(lv, f, 'faq', 'FAQ가 2개 미만입니다.')
      if (!(Array.isArray(fm.relatedPosts) && fm.relatedPosts.length) && !(Array.isArray(fm.nextQuestions) && fm.nextQuestions.length)) {
        add(lv, f, 'internal-links', 'relatedPosts/nextQuestions가 모두 없습니다.', '관련 글과 다음 질문 카드를 연결하세요.')
      }
      if (!fm.image?.src) add(lv, f, 'image', '대표 이미지(image.src)가 없습니다.')
      if (!raw.body.includes('## 이 글이 필요한 분') || !raw.body.includes('## 3줄 요약')) {
        add(lv, f, 'body-sections', '본문에 "## 이 글이 필요한 분" 또는 "## 3줄 요약" 섹션이 없습니다.', '_TEMPLATE.md 구조를 따르세요.')
      }
      if (PLACEHOLDER_RE.test(raw.body) || PLACEHOLDER_RE.test(JSON.stringify(fm))) {
        add(lv, f, 'placeholder', '미완성 표식(TODO/TBD/XXX/OOO/{{ 등)이 남아 있습니다.', '모두 실제 내용으로 교체하세요.')
      }
    }
    if (fm.metaDescription) {
      const n = String(fm.metaDescription).length
      if (n < 60 || n > 170) add('warn', f, 'meta-length', `metaDescription 길이 ${n}자 (권장 70~160자).`)
    }
    if (fm.seoTitle && String(fm.seoTitle).length > 65) add('warn', f, 'title-length', `seoTitle ${String(fm.seoTitle).length}자 — 검색 결과에서 잘릴 수 있습니다 (권장 60자 이내).`)

    // sources 점검
    if (Array.isArray(fm.sources)) {
      fm.sources.forEach((s: any, k: number) => {
        if (!s?.name || !s?.url) { add(lv, f, 'source-fields', `sources[${k}]에 name/url이 없습니다.`); return }
        let host = ''
        try { const u = new URL(String(s.url)); host = u.hostname; if (u.protocol !== 'https:') add('warn', f, 'source-https', `sources[${k}] URL이 https가 아닙니다: ${s.url}`) }
        catch { add('error', f, 'source-url', `sources[${k}] URL 형식 오류: ${s.url}`); return }
        if (!OFFICIAL_STRICT.some(suf => host.endsWith(suf))) add('warn', f, 'source-domain', `sources[${k}] 도메인이 공공기관(.go.kr/.or.kr)이 아닙니다: ${host}`, '공식 출처인지 확인하세요.')
        if (!s.accessedAt) add(lv, f, 'source-accessed', `sources[${k}]에 확인일(accessedAt)이 없습니다.`)
      })
    }

    // 이미지 파일·alt
    if (fm.image?.src) {
      const src = String(fm.image.src)
      const rel = src.startsWith('/') ? src.slice(1) : src
      if (!src.startsWith('/static/')) add('error', f, 'image-path', `image.src는 /static/ 하위 경로여야 합니다: ${src}`)
      else {
        // 신규 글 이미지 원본은 content/images/<파일명>, 기존 글은 public/ 하위
        const inContent = src.startsWith('/static/images/posts/') && fs.existsSync(path.join(CONTENT_DIR, 'images', path.basename(src)))
        if (!inContent && !fs.existsSync(path.join(PUBLIC_DIR, rel))) add(lv, f, 'image-missing', `이미지 파일이 없습니다: content/images/${path.basename(src)} (또는 public/${rel})`, '이미지를 content/images/ 에 추가하거나 image.src 경로를 수정하세요.')
      }
      if (!String(fm.image.alt ?? '').trim()) add(lv, f, 'image-alt', '이미지 alt가 비어 있습니다.', '이미지 설명(alt)을 입력하세요.')
    }

    // 본문 안전성 (항상 error)
    const body = raw.body
    body.split('\n').forEach((line, ln) => {
      if (/<\/?[a-zA-Z!][^>]*>?/.test(line)) add('error', f, 'unsafe-html', `본문 ${ln + 1}행: HTML 태그는 허용되지 않습니다 → ${line.trim().slice(0, 60)}`, 'Markdown 문법만 사용하세요.')
      if (/javascript:|vbscript:|data:text|on[a-z]+\s*=/i.test(line)) add('error', f, 'unsafe-script', `본문 ${ln + 1}행: 스크립트/이벤트 속성 패턴이 있습니다 → ${line.trim().slice(0, 60)}`)
      if (/^!\[/.test(line.trim()) || /\]\(\s*data:/i.test(line)) add('error', f, 'unsupported-md', `본문 ${ln + 1}행: 본문 이미지(![]())는 지원하지 않습니다. 대표 이미지는 frontmatter image를 쓰세요.`)
      const w = line.trim().match(/^\[\[WIDGET:(.+)\]\]$/)
      if (w && !KNOWN_WIDGETS.includes(w[1])) add('error', f, 'widget', `본문 ${ln + 1}행: 알 수 없는 위젯 ${w[1]}`, `사용 가능: ${KNOWN_WIDGETS.join(', ')}`)
    })
    if (/(^|\n)#\s+\S/.test(body)) add('warn', f, 'h1-in-body', '본문에 H1(#)이 있습니다. 제목은 frontmatter title로 출력되므로 H2(##)부터 사용하세요.')

    // 내부·외부 링크 검증
    const linkRe = /\]\(([^)]*)\)/g
    let m: RegExpExecArray | null
    const checkInternal = (href: string, where: string) => {
      const clean = href.split('#')[0].split('?')[0] || '/'
      const isPostPath = /^\/[a-z-]+\/[^/]+$/.test(clean) && cats.includes(clean.split('/')[1])
      let ok = false
      if (STATIC_PATHS.includes(clean)) ok = true
      else if (allHubs.has(clean)) {
        ok = true
        if (status === 'published' && !publicHubs.has(clean)) add('error', f, 'link-closed-hub', `${where}: 아직 오픈되지 않은 카테고리 허브로 링크합니다 → ${href}`, '카테고리가 open이 될 때까지 링크를 제거하거나, 오픈 후 발행하세요.')
      } else if (isPostPath) {
        if (!knownPaths.has(clean)) add('error', f, 'link-missing', `${where}: 존재하지 않는 글로 링크합니다 → ${href}`, 'slug와 카테고리를 확인하세요.')
        else {
          ok = true
          if (!publicPaths.has(clean)) {
            add(status === 'published' ? 'error' : 'warn', f, 'link-unpublished', `${where}: 공개되지 않은(draft/review 또는 미오픈 카테고리) 글로 링크합니다 → ${href}`, status === 'published' ? '링크 대상을 먼저 발행하거나 이 링크를 제거하세요.' : '함께 발행할 글이면 무시해도 됩니다. 발행 시점에는 대상이 published여야 합니다.')
          }
        }
      }
      if (!ok && !isPostPath && !allHubs.has(clean) && !STATIC_PATHS.includes(clean)) add('error', f, 'link-missing', `${where}: 존재하지 않는 내부 경로입니다 → ${href}`)
    }
    while ((m = linkRe.exec(body))) {
      const href = m[1].trim()
      if (href.startsWith('/')) checkInternal(href, '본문 링크')
      else if (/^https:\/\//.test(href)) { /* 외부 https 허용 */ }
      else if (/^http:\/\//.test(href)) add('warn', f, 'link-http', `본문에 http:// 링크가 있습니다 → ${href}`)
      else add('error', f, 'unsafe-link', `허용되지 않는 링크 형식입니다 → ${href}`, '/내부경로 또는 https:// 만 사용하세요.')
    }
    ;(fm.nextQuestions ?? []).forEach((nq: any, k: number) => {
      if (!nq?.question || !nq?.href) add('error', f, 'next-questions', `nextQuestions[${k}]에 question/href가 없습니다.`)
      else if (!String(nq.href).startsWith('/')) add('error', f, 'next-questions', `nextQuestions[${k}].href는 / 로 시작하는 내부 경로여야 합니다.`)
      else checkInternal(String(nq.href), `nextQuestions[${k}]`)
      if (nq?.contentType && !['next-step', 'related-article'].includes(nq.contentType)) add('error', f, 'next-questions', `nextQuestions[${k}].contentType은 next-step | related-article`)
    })
    ;(fm.relatedPosts ?? []).forEach((slug: string) => {
      const hit = [...knownPaths].find(u => u.endsWith('/' + slug))
      if (!hit) add('error', f, 'link-missing', `relatedPosts에 존재하지 않는 slug: ${slug}`)
      else if (!publicPaths.has(hit)) add(status === 'published' ? 'error' : 'warn', f, 'link-unpublished', `relatedPosts의 ${slug}가 아직 공개되지 않았습니다.`, status === 'published' ? '대상을 먼저 발행하거나 제거하세요.' : undefined)
      if (slug === fm.slug) add('error', f, 'link-self', 'relatedPosts에 자기 자신이 있습니다.')
    })
    for (const ib of readInboundLinks(raw)) {
      const hit = [...knownPaths].find(u => u.endsWith('/' + ib.from))
      if (!hit) add('error', f, 'inbound-missing', `inboundLinks.from에 존재하지 않는 글: ${ib.from}`)
    }

    // 검증표
    const sheet = sheets[String(fm.slug)]
    if (status === 'review' || status === 'published' || opts.strictReview) {
      if (!sheet) add(lv, f, 'verification-sheet', `검증표 파일이 없습니다: content/verification/${fm.slug}.yaml`, '검증 항목·수치·기관·문서명·URL·시행일·확인일·결과를 작성하세요.')
    }
    if (sheet) {
      if (!Array.isArray(sheet.rows) || sheet.rows.length === 0) add(lv, `content/verification/${fm.slug}.yaml`, 'verification-sheet', '검증표에 행이 없습니다.')
      ;(sheet.rows ?? []).forEach((r, k) => {
        for (const key of ['item', 'value', 'agency', 'document', 'url', 'effectiveDate', 'checkedAt', 'result'] as const) {
          if (!r[key]) add(lv, `content/verification/${fm.slug}.yaml`, 'verification-row', `rows[${k}].${key} 누락`)
        }
        if (r.result && !['verified', 'partial', 'unverified', 'conflict'].includes(r.result)) add('error', `content/verification/${fm.slug}.yaml`, 'verification-row', `rows[${k}].result 값 오류: ${r.result}`)
        if (status === 'published' && (r.result === 'unverified' || r.result === 'conflict')) {
          add('error', f, 'verification-unverified', `검증표 "${r.item}"가 ${r.result} 상태입니다. 확인되지 않은 사실이 있는 글은 발행할 수 없습니다.`, '공식 원문으로 확인하거나, 본문에서 해당 내용을 제거 후 검증표를 갱신하세요.')
        }
        if (r.result === 'partial') add('warn', f, 'verification-partial', `검증표 "${r.item}"는 부분 확인(partial)입니다. 본문에 한계가 명시돼 있는지 검수하세요.`)
      })
    }
  })

  // ── 3) 카테고리 오픈 규칙 ────────────────────────────────────────────────────
  for (const c of categories) {
    const published = legacyPosts.filter(p => p.category === c.slug).length + mdPosts.filter(p => p.category === c.slug && p.status === 'published').length
    if (c.state === 'open' && c.minPosts && published < c.minPosts) {
      add('error', 'src/data/categories.ts', 'category-open-min', `카테고리 ${c.slug}가 open이지만 published 글이 ${published}편입니다 (최소 ${c.minPosts}편).`, '검증 완료·승인된 글 3편 이상이 준비될 때까지 coming-soon을 유지하세요.')
    }
    if (c.state === 'open' && published < 3 && !c.minPosts) add('warn', 'src/data/categories.ts', 'category-few', `카테고리 ${c.slug}의 공개 글이 ${published}편으로 적습니다.`)
    for (const slug of c.pinned ?? []) {
      if (!bySlug.has(slug)) add('error', 'src/data/categories.ts', 'pinned-missing', `${c.slug}.pinned의 글이 없습니다: ${slug}`)
    }
  }

  // ── 4) inbound 대상 / URL(canonical) 유일성 ──────────────────────────────────
  const urls = new Map<string, string>()
  for (const p of [...legacyPosts, ...mdPosts]) {
    const u = `/${p.category}/${p.slug}`
    if (urls.has(u)) add('error', 'content', 'canonical-duplicate', `canonical URL 중복: ${u}`)
    urls.set(u, p.slug)
  }

  // ── 5) 기존 글 참고(정보) ────────────────────────────────────────────────────
  const missingThumbs = legacyPosts.filter(p => p.thumbnail && !fs.existsSync(path.join(PUBLIC_DIR, p.thumbnail.replace(/^\//, ''))))
  if (missingThumbs.length) add('warn', 'src/data/legacy-posts.ts', 'legacy-thumbnail', `기존 글 ${missingThumbs.length}편의 thumbnail 파일이 없습니다(기존 동작 유지: OG는 기본 이미지 사용). 신규 글은 image 필수.`)

  return { issues, raws, mdPosts, sheets }
}
