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
  const recentPosts = posts.slice(0, 6)

  return (
    <div class="max-w-6xl mx-auto px-4 space-y-16">

      {/* ─── 상황별 큐레이션 ─── */}
      <section>
        <div class="text-center mb-10">
          <p class="text-primary-600 text-sm font-semibold mb-2">🧭 상황별 맞춤 안내</p>
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
        <div id="situation-posts" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentPosts.map(post => (
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

      {/* ─── 추천 기둥글 ─── */}
      <section>
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-primary-600 text-sm font-semibold mb-1">📌 꼭 읽어야 할 기본 정보</p>
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

      {/* ─── CTA 배너: 2개 나란히 (노후자금 충분지수 진단 + 국민연금 수령액 계산) ─── */}
      <section class="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CTA 1: 노후자금 충분지수 진단 (메인 진단기) */}
        <div class="bg-gradient-to-br from-primary-800 to-primary-700 rounded-2xl p-7 text-white flex flex-col justify-between gap-5">
          <div>
            <p class="text-primary-300 text-xs font-semibold mb-2">🔍 무료 · 1분 진단</p>
            <h3 class="text-xl font-extrabold mb-2">노후자금 충분지수<br/>지금 진단해보세요</h3>
            <p class="text-primary-200 text-sm">나이·납부기간·소득 입력만으로<br/>국민연금 수령액과 노후 충분도를 바로 확인</p>
          </div>
          {/* href만 사용 — onclick 작은따옴표 이스케이프 문제 우회, JS에서 scroll 처리 */}
          <a
            href="/"
            id="main-diag-cta-btn"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-800 font-bold text-sm rounded-xl hover:bg-primary-50 transition-colors shadow-md"
          >
            <i class="fas fa-chart-pie"></i>지금 진단하기
          </a>
        </div>

        {/* CTA 2: 국민연금 수령액 계산법 칼럼으로 이동 */}
        <div class="bg-gradient-to-br from-emerald-700 to-emerald-600 rounded-2xl p-7 text-white flex flex-col justify-between gap-5">
          <div>
            <p class="text-emerald-200 text-xs font-semibold mb-2">📋 2026 공식 계산법</p>
            <h3 class="text-xl font-extrabold mb-2">국민연금 수령액<br/>얼마나 받을 수 있을까?</h3>
            <p class="text-emerald-100 text-sm">A값 319만원 기준 2026 완벽 계산법<br/>조기·연기수령 손익분기점까지 한눈에</p>
          </div>
          <a
            href="/pension-asset/national-pension-amount-calculation"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
          >
            <i class="fas fa-calculator"></i>수령액 계산법 보기
          </a>
        </div>

      </section>

      {/* ─── 최신 업데이트 섹션 ─── */}
      <section>
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-primary-600 text-sm font-semibold mb-1">🗓 최근 업데이트</p>
            <h2 class="text-2xl font-extrabold text-gray-900">새로 추가된 정보</h2>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {recentPosts.slice(0, 5).map(post => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      </section>

    </div>
  )
}
