// 글 데이터 파사드 — 앱 전체가 이 파일만 import 합니다 (기존 import 경로 유지).
//   기존 TS 글(legacy-posts.ts) + 신규 Markdown 글(src/generated/content.ts, 빌드 시 생성)을 병합하고
//   "공개 가능한 글"만 노출합니다.
//     · 운영 빌드: status=published 이고 카테고리가 open 인 글만 (draft/review는 번들에 아예 없음)
//     · 미리보기 빌드(BUILD_MODE=preview): draft/review/published 모두, 카테고리 상태와 무관하게 노출 (전체 noindex)
import type { NextQuestion, Post } from '../types'
import { legacyPosts } from './legacy-posts'
import { BUILD_MODE, generatedPosts, inboundNextQuestions } from '../generated/content'
import { getCategory } from './categories'

export const isPreview = BUILD_MODE === 'preview'

export const isPublished = (p: Post) => (p.status ?? 'published') === 'published'
export const isCategoryOpen = (category: string) => isPreview || getCategory(category)?.state === 'open'
const isVisible = (p: Post) => (isPreview || isPublished(p)) && isCategoryOpen(p.category)

const MAX_NEXT_QUESTIONS = 6

// 신규 글의 inboundLinks(frontmatter)로 요청된 "다음 질문" 카드를 기존 글에 추가 (명시한 글에만, 중복 href 제외)
const withInbound = (p: Post): Post => {
  const extra = inboundNextQuestions[p.slug]
  if (!extra || extra.length === 0) return p
  const merged: NextQuestion[] = [...(p.nextQuestions ?? [])]
  for (const q of extra) {
    if (merged.length >= MAX_NEXT_QUESTIONS) break
    if (!merged.some(m => m.href === q.href)) merged.push(q)
  }
  return { ...p, nextQuestions: merged }
}

const mdSorted = [...generatedPosts].sort(
  (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug)
)

// 전체(공개 가능) 글: 기존 글 순서 유지 + 신규 글(최신순) 뒤에 추가
export const posts: Post[] = [...legacyPosts, ...mdSorted].map(withInbound).filter(isVisible)

// 검색엔진 발견 대상(sitemap/RSS): 정식 발행 + 카테고리 open + noindex 아님. 미리보기 빌드는 항상 비어 있음.
export const indexablePosts: Post[] = isPreview ? [] : posts.filter(p => isPublished(p) && !p.noindex)

export const getPostBySlug = (slug: string): Post | undefined => posts.find(p => p.slug === slug)

export const getPostsByCategory = (category: string): Post[] => posts.filter(p => p.category === category)

export const getFeaturedPosts = (): Post[] => posts.filter(p => p.featured)

export const getPostsBySituation = (situation: string): Post[] => posts.filter(p => p.situation === situation)

export const getSituations = (): string[] => {
  const situations = posts.map(p => p.situation).filter(Boolean) as string[]
  return [...new Set(situations)]
}

export const postUrl = (p: Pick<Post, 'category' | 'slug'>) => `/${p.category}/${p.slug}`

/** 가장 최근의 의미 있는 수정일 (sitemap lastmod용 — 요청 시각을 쓰지 않음) */
export const latestUpdate = (list: Post[]): string | undefined =>
  list.map(p => p.updatedAt).filter(Boolean).sort().pop()
