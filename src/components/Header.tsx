import { categories } from '../data/categories'
import { isPreview } from '../data/posts'

export const Header = () => {
  // 메뉴는 categories.ts에서 생성: state가 'open'이면 활성 링크, 'coming-soon'이면 "준비중" 배지
  // (미리보기 빌드에서는 검토를 위해 모든 카테고리를 활성화)
  const navItems = categories.map(c => ({
    label: c.label,
    href: `/${c.slug}`,
    active: c.state === 'open' || isPreview,
  }))

  return (
    <>
    {/* 상단 알림 바 — 화면에 고정하지 않음(스크롤하면 사라져 읽는 공간을 넓힘) */}
    <div class="bg-primary-700 text-white text-center py-2 px-3 text-sm">
      <span class="opacity-90">📢 2026년 기초연금 선정기준액 단독가구 247만원으로 상향 — 작년 탈락하셨다면 재신청 가능합니다.</span>
      <a href="/pension-asset/basic-pension-eligibility" class="ml-2 underline font-semibold hover:opacity-80">바로 확인하기 →</a>
    </div>
    <header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">

      <div class="max-w-6xl mx-auto px-4">
        {/* 로고 + 검색 */}
        <div class="flex items-center justify-between h-16">
          {/* 로고 */}
          <a href="/" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <i class="fas fa-seedling text-white text-sm"></i>
            </div>
            <div>
              <span class="font-extrabold text-xl text-primary-800 tracking-tight">노후설계</span>
              <span class="font-light text-xl text-gray-500 ml-1">가이드</span>
            </div>
          </a>

          {/* 검색바 (데스크탑) */}
          <div class="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form action="/search" method="get" role="search" class="relative w-full">
              <input
                type="search"
                id="search-input"
                name="q"
                aria-label="사이트 검색"
                placeholder="국민연금, 기초연금, 주택연금 검색..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </form>
          </div>

          {/* 우측 액션 */}
          <div class="flex items-center gap-3">
            {/* 글자크기 조절 */}
            <div class="hidden md:flex items-center gap-1 text-gray-400 text-xs border border-gray-200 rounded-full px-3 py-1">
              <button onclick="document.documentElement.style.fontSize='14px'" class="hover:text-primary-700 transition-colors" title="작게">가</button>
              <span class="mx-1 text-gray-200">|</span>
              <button onclick="document.documentElement.style.fontSize='16px'" class="hover:text-primary-700 transition-colors font-semibold" title="보통">가</button>
              <span class="mx-1 text-gray-200">|</span>
              <button onclick="document.documentElement.style.fontSize='19px'" class="hover:text-primary-700 transition-colors text-base font-bold" title="크게">가</button>
            </div>
            {/* 모바일 검색 */}
            <button id="mobile-search-btn" class="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* GNB 메뉴 */}
        <nav class="flex flex-nowrap items-center gap-0 sm:gap-1 pb-0 border-t border-gray-50 overflow-x-auto whitespace-nowrap" style="scrollbar-width:none;-webkit-overflow-scrolling:touch">
          {/* 홈 */}
          <a href="/" class="relative shrink-0 px-3 sm:px-4 py-3 text-sm font-semibold text-gray-500 hover:text-primary-700 transition-colors">
            홈
          </a>
          {navItems.map(item => (
            item.active ? (
              <a
                key={item.href}
                href={item.href}
                class="relative shrink-0 px-3 sm:px-4 py-3 text-sm font-semibold text-primary-700 border-b-2 border-primary-600"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.href}
                class="relative shrink-0 px-3 sm:px-4 py-3 text-sm text-gray-300 cursor-not-allowed select-none"
                title="준비 중입니다"
              >
                {item.label}
                <span class="ml-1 text-xs bg-gray-100 text-gray-400 rounded px-1 py-0.5 hidden sm:inline">준비중</span>
              </span>
            )
          ))}
          {/* 우측 보조 링크 */}
          <div class="ml-auto shrink-0 flex items-center gap-1">
            <a
              href="/pension-asset"
              class="hidden sm:flex px-4 py-3 text-sm text-gray-500 hover:text-primary-700 transition-colors items-center gap-1"
            >
              <i class="fas fa-list text-xs"></i>
              전체 글
            </a>
            <a
              href="/#diagnosis-form"
              class="ml-1 px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <i class="fas fa-chart-pie text-xs"></i>
              무료 진단
            </a>
          </div>
        </nav>
      </div>

      {/* 모바일 검색 패널 */}
      <div id="mobile-search-panel" class="hidden bg-white border-t border-gray-100 px-4 py-3 md:hidden">
        <form action="/search" method="get" role="search" class="relative">
          <input
            type="search"
            name="q"
            aria-label="사이트 검색"
            placeholder="검색어를 입력하세요..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-primary-400"
          />
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        </form>
      </div>
    </header>
    </>
  )
}
