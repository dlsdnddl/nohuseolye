import type { Post } from '../types'
import type { CategoryConfig } from '../data/categories'

const TYPE_BADGE = {
  pillar: { label: '핵심 가이드', color: 'bg-primary-50 text-primary-700' },
  comparison: { label: '비교·계산', color: 'bg-primary-50 text-primary-700' },
  checklist: { label: '체크리스트', color: 'bg-primary-50 text-primary-700' },
} as const

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  review: 'bg-amber-200 text-amber-900',
  published: 'bg-green-200 text-green-900',
}

interface Props {
  category: CategoryConfig
  posts: Post[]          // 이 카테고리의 공개 글
  pinned: Post[]         // 대표 글(다른 카테고리 글 가능, URL 변경 없음)
  otherHubs: { slug: string; label: string; intro: string }[] // 오픈된 다른 카테고리 허브
  preview?: boolean
}

const PostGridCard = ({ post, preview, cross }: { post: Post; preview?: boolean; cross?: string }) => {
  const badge = TYPE_BADGE[post.type]
  return (
    <a
      href={`/${post.category}/${post.slug}`}
      data-link-position="category-hub"
      data-content-type="related-article"
      class="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div class="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>
      <div class="p-6">
        <div class="flex flex-wrap gap-2 mb-3">
          <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          {cross && <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">대표 글 · {cross}</span>}
          {post.situation && <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{post.situation}</span>}
          {preview && post.status && post.status !== 'published' && (
            <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[post.status]}`}>{post.status.toUpperCase()}</span>
          )}
        </div>
        <h2 class="font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary-700 transition-colors">{post.title}</h2>
        <p class="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{post.description}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span><i class="fas fa-clock mr-1"></i>{post.readTime}분{post.verifiedAt ? ` · 검증 ${post.verifiedAt}` : ''}</span>
          <span class="text-primary-600 font-semibold">읽기 →</span>
        </div>
      </div>
    </a>
  )
}

export const CategoryPage = ({ category, posts, pinned, otherHubs, preview }: Props) => {
  const pinnedSlugs = new Set(pinned.map(p => p.slug))
  const rest = posts.filter(p => !pinnedSlugs.has(p.slug))
  const labelOf = (p: Post) => p.categoryLabel
  return (
    <main class="max-w-6xl mx-auto px-4 py-12">
      <div class="mb-10">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <a href="/" class="hover:text-primary-600">홈</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-700 font-medium">{category.label}</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-2">{category.label}</h1>
        <p class="text-gray-500">{category.intro}</p>
        {preview && category.state === 'coming-soon' && (
          <p class="mt-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2">
            미리보기 전용 화면입니다. 이 카테고리는 운영 사이트에서 아직 "준비 중"이며, 승인 후 오픈됩니다.
          </p>
        )}
      </div>

      {pinned.length > 0 && (
        <section class="mb-10" aria-label="대표 글">
          <h2 class="text-sm font-bold text-primary-700 mb-3"><i class="fas fa-thumbtack mr-1"></i> 먼저 읽어보세요</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinned.map(p => <PostGridCard key={p.id} post={p} preview={preview} cross={p.category !== category.slug ? labelOf(p) : '대표 글'} />)}
          </div>
        </section>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(post => <PostGridCard key={post.id} post={post} preview={preview} />)}
      </div>

      {otherHubs.length > 0 && (
        <section class="mt-14 border-t border-gray-100 pt-8" aria-label="다른 카테고리">
          <h2 class="text-sm font-bold text-gray-500 mb-4">다른 카테고리도 둘러보세요</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherHubs.map(h => (
              <a
                key={h.slug}
                href={`/${h.slug}`}
                data-link-position="category-hub-cross"
                data-content-type="category-hub"
                class="p-4 bg-white border border-gray-100 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
              >
                <p class="font-bold text-gray-800 text-sm mb-1">{h.label}</p>
                <p class="text-xs text-gray-500 line-clamp-2">{h.intro}</p>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
