// 콘텐츠 로더 공용 라이브러리 (빌드 스크립트 전용 — Workers 런타임에는 포함되지 않음)
//  - content/posts/<category>/<slug>.md  (frontmatter + Markdown 본문)
//  - content/verification/<slug>.yaml    (공식자료 검증표)
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { categories } from '../../src/data/categories'
import type { Post, VerificationSheet } from '../../src/types'

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
export const CONTENT_DIR = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR) : path.join(ROOT, 'content')
export const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.join(ROOT, 'public')

export interface Issue {
  level: 'error' | 'warn'
  file: string
  rule: string
  message: string
  fix?: string
}

export interface RawPost {
  file: string // 저장소 기준 상대 경로
  dirCategory: string
  fm: Record<string, any>
  body: string
}

function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) out.push(...walk(p, ext))
    else if (name.name.endsWith(ext)) out.push(p)
  }
  return out.sort()
}

export function splitFrontmatter(text: string): { fm: Record<string, any>; body: string } | null {
  const t = text.replace(/\r\n/g, '\n')
  const m = t.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return null
  const fm = YAML.parse(m[1]) ?? {}
  return { fm, body: m[2].replace(/^\n+/, '') }
}

export function loadRawPosts(issues: Issue[]): RawPost[] {
  const dir = path.join(CONTENT_DIR, 'posts')
  const files = walk(dir, '.md').filter(f => !path.basename(f).startsWith('_'))
  const raws: RawPost[] = []
  for (const f of files) {
    const rel = path.relative(CONTENT_DIR, f)
    const dirCategory = path.basename(path.dirname(f))
    try {
      const parsed = splitFrontmatter(fs.readFileSync(f, 'utf-8'))
      if (!parsed) {
        issues.push({ level: 'error', file: rel, rule: 'frontmatter', message: 'frontmatter(--- ... ---)를 찾을 수 없습니다.', fix: '_TEMPLATE.md 형식대로 파일 맨 위에 frontmatter를 추가하세요.' })
        continue
      }
      raws.push({ file: rel, dirCategory, fm: parsed.fm, body: parsed.body })
    } catch (e: any) {
      issues.push({ level: 'error', file: rel, rule: 'frontmatter', message: `frontmatter YAML 파싱 실패: ${e.message}`, fix: '들여쓰기·따옴표·콜론(:) 이스케이프를 확인하세요.' })
    }
  }
  return raws
}

export function loadVerificationSheets(issues: Issue[]): Record<string, VerificationSheet> {
  const dir = path.join(CONTENT_DIR, 'verification')
  const out: Record<string, VerificationSheet> = {}
  for (const f of walk(dir, '.yaml')) {
    const rel = path.relative(CONTENT_DIR, f)
    try {
      const data = YAML.parse(fs.readFileSync(f, 'utf-8')) as VerificationSheet
      const slug = data?.slug || path.basename(f, '.yaml')
      out[slug] = { ...data, slug }
    } catch (e: any) {
      issues.push({ level: 'error', file: rel, rule: 'verification', message: `검증표 YAML 파싱 실패: ${e.message}` })
    }
  }
  return out
}

const estimateReadTime = (body: string) => Math.max(3, Math.round(body.replace(/\s+/g, '').length / 550))

/** frontmatter + body → Post (검증은 content-check가 담당, 여기서는 변환만) */
export function toPost(raw: RawPost, idx: number): Post {
  const fm = raw.fm
  const cat = categories.find(c => c.slug === fm.category)
  const slug = String(fm.slug ?? path.basename(raw.file, '.md'))
  const image = fm.image?.src ? { src: String(fm.image.src), alt: String(fm.image.alt ?? '') } : undefined
  const desc = String(fm.metaDescription ?? '')
  return {
    id: `md-${idx + 1}`,
    slug,
    category: fm.category,
    categoryLabel: cat?.label ?? String(fm.category),
    title: String(fm.title ?? ''),
    description: desc,
    content: raw.body,
    thumbnail: image?.src ?? '/static/images/og-default.jpg',
    tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
    publishedAt: String(fm.publishedAt ?? ''),
    updatedAt: String(fm.updatedAt ?? fm.publishedAt ?? ''),
    readTime: Number(fm.readTime) || estimateReadTime(raw.body),
    type: fm.type ?? 'pillar',
    featured: Boolean(fm.featured),
    situation: fm.situation ? String(fm.situation) : undefined,
    faq: Array.isArray(fm.faq) ? fm.faq.map((f: any) => ({ question: String(f.q ?? f.question ?? ''), answer: String(f.a ?? f.answer ?? '') })) : undefined,
    relatedPosts: Array.isArray(fm.relatedPosts) ? fm.relatedPosts.map(String) : undefined,
    sources: Array.isArray(fm.sources)
      ? fm.sources.map((s: any) => ({ name: String(s.name), url: String(s.url), title: s.title ? String(s.title) : undefined, effectiveDate: s.effectiveDate ? String(s.effectiveDate) : undefined, accessedAt: s.accessedAt ? String(s.accessedAt) : undefined }))
      : undefined,
    nextQuestions: Array.isArray(fm.nextQuestions)
      ? fm.nextQuestions.map((n: any) => ({ question: String(n.question), href: String(n.href), contentType: n.contentType === 'next-step' ? 'next-step' : 'related-article', description: n.description ? String(n.description) : undefined }))
      : undefined,
    nextStep: fm.nextStep ? String(fm.nextStep) : undefined,
    status: fm.status,
    origin: 'md',
    seoTitle: fm.seoTitle ? String(fm.seoTitle) : undefined,
    metaDescription: desc,
    basisYear: fm.basisYear ? Number(fm.basisYear) : undefined,
    verifiedAt: fm.verifiedAt ? String(fm.verifiedAt) : undefined,
    approvedAt: fm.approvedAt ? String(fm.approvedAt) : undefined,
    noindex: fm.noindex === true,
    shortTitle: fm.shortTitle ? String(fm.shortTitle) : undefined,
    image,
    review: fm.differentiation || fm.reviewNotes ? { differentiation: fm.differentiation ? String(fm.differentiation) : undefined, reviewNotes: fm.reviewNotes ? String(fm.reviewNotes) : undefined } : undefined,
  }
}

/** 다른 글의 "다음 질문" 카드로 노출을 요청하는 신규 글의 inboundLinks 원본 */
export interface InboundLink {
  from: string // 카드를 붙일 기존 글 slug
  question: string
  description?: string
}
export function readInboundLinks(raw: RawPost): InboundLink[] {
  const v = raw.fm.inboundLinks
  return Array.isArray(v) ? v.map((x: any) => ({ from: String(x.from), question: String(x.question), description: x.description ? String(x.description) : undefined })) : []
}
