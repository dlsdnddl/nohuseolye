import type { Post } from '../types'
import { PostCard } from './PostCard'

interface ContentCurationProps {
  posts: Post[]
}

export const ContentCuration = ({ posts }: ContentCurationProps) => {
  const situations = [
    { label: '은퇴 5년 전', icon: 'fas fa-hourglass-half', color: 'text-blue-600 bg-blue-50' },
    { label: '은퇴 후 생활비 걱정될 때', icon: 'fas fa-wallet', color: 'text-orange-600 bg-orange-50' },
    { label: '부모님 돌봄이 필요할 때', icon: 'fas fa-hands-helping', color: 'text-purple-600 bg-purple-50' },
    { label: '부모님 병원비 걱정될 때', icon: 'fas fa-hospital', color: 'text-red-600 bg-red-50' },
  ]

  const featuredPosts = posts.filter(p => p.featured).slice(0, 4)
  // "새로 추가된 정보" 칸: 최신 publishedAt 기준 상위 5개
  const sortedByDate = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const recentPosts = sortedByDate.slice(0, 5)

  // 상황별 칸은 아래 두 칸(추천·최근)과 겹치지 않는 글, 출생연도별 개별 글이 아닌 글을 먼저 보여줌.
  // 나머지 글은 뒤로 미룰 뿐 빼지 않음("글 더보기"로 볼 수 있음). 같은 규칙이 app.js renderSituationPosts()에도 있음.
  const shownElsewhere = new Set([...recentPosts, ...featuredPosts].map(p => p.id))
  const isCohortPost = (p: Post) => /^(national-pension-\d{4}-born|early-pension-\d{4})$/.test(p.slug)
  const firstSituation = '은퇴 5년 전'
  const situationMatched = sortedByDate.filter(p => p.situation === firstSituation)
  const situationPosts = [
    ...situationMatched.filter(p => !shownElsewhere.has(p.id) && !isCohortPost(p)),
    ...situationMatched.filter(p => !shownElsewhere.has(p.id) && isCohortPost(p)),
    ...situationMatched.filter(p => shownElsewhere.has(p.id)),
  ].slice(0, 6)

  // 클라이언트 상황별 필터(app.js)가 사용할 공개 글 목록 — 서버 데이터에서 자동 생성 (하드코딩 제거)
  const clientPosts = JSON.stringify(
    sortedByDate.map(p => ({ id: p.id, slug: p.slug, situation: p.situation ?? '', type: p.type, title: p.title, category: p.category, readTime: p.readTime }))
  ).replace(/</g, '\u003c')

  return (
    <div class="max-w-6xl mx-auto px-4 space-y-16">
      <script id="posts-data" type="application/json" dangerouslySetInnerHTML={{ __html: clientPosts }} />

      {/* ─── 상황별 큐레이션 ─── */}
      <section>
        <div class="text-center mb-10">
          <p class="text-primary-600 text-sm font-semibold mb-2">상황별 맞춤 안내</p>
          <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900">지금 내 상황에 맞는 글 찾기</h2>
          <p class="text-gray-500 mt-2 text-sm">상황을 클릭하면 관련 글을 모아드립니다</p>
        </div>

        {/* 상황 탭 */}
        <div class="flex flex-wrap gap-3 justify-center mb-8" id="situation-tabs">
          {situations.map((s, i) => (
            <button
              key={s.label}
              onclick={`filterBySituation('${s.label}')`}
              class={`situation-tab flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-semibold transition-all ${i === 0 ? 'bg-primary-700 text-white border-primary-700 shadow-lg' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'}`}
              data-situation={s.label}
            >
              <i class={s.icon}></i>
              {s.label}
            </button>
          ))}
        </div>

        {/* 상황별 포스트 카드 */}
        <div id="situation-posts" data-shown-elsewhere={[...shownElsewhere].join(',')} class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {situationPosts.map(post => (
            <PostCard key={post.id} post={post} variant="default" />
          ))}
        </div>

        {/* 더보기 버튼 */}
        <div class="text-center mt-8">
          <button
            id="load-more-btn"
            onclick="loadMorePosts()"
            class="inline-flex items-center gap-2 px-8 py-3 border-2 border-primary-600 text-primary-700 font-semibold rounded-full hover:bg-primary-50 transition-all"
          >
            <i class="fas fa-plus-circle"></i>
            글 더보기
          </button>
        </div>
      </section>

      {/* ─── 추천 핵심 글 ─── */}
      <section>
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-primary-600 text-sm font-semibold mb-1">꼭 읽어야 할 기본 정보</p>
            <h2 class="text-2xl font-extrabold text-gray-900">편집팀 추천 핵심 글</h2>
          </div>
          <a href="/pension-asset" class="hidden md:flex items-center gap-1 text-sm text-primary-600 font-semibold hover:underline">
            전체 보기 <i class="fas fa-arrow-right text-xs"></i>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPosts.map(post => (
            <PostCard key={post.id} post={post} variant="featured" />
          ))}
        </div>
      </section>

      {/* ─── 최신 업데이트 섹션 ─── */}
      <section>
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-primary-600 text-sm font-semibold mb-1">최근 업데이트</p>
            <h2 class="text-2xl font-extrabold text-gray-900">새로 추가된 정보</h2>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {recentPosts.map(post => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      </section>

    </div>
  )
}
