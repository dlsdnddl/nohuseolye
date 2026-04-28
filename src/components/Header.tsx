export const Header = () => {
  const navItems = [
    { label: '연금·자산', href: '/pension-asset', active: true },
    { label: '집·노후소득', href: '/housing-income', active: false },
    { label: '지원금', href: '/support', active: false },
    { label: '부모님 돌봄', href: '/care', active: false },
  ]

  return (
    <header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* 상단 알림 바 */}
      <div class="bg-primary-700 text-white text-center py-2 text-sm">
        <span class="opacity-90">📢 2026년 기초연금 선정기준액 단독가구 247만원으로 상향 — 작년 탈락하셨다면 재신청 가능합니다.</span>
        <a href="/pension-asset/basic-pension-eligibility" class="ml-2 underline font-semibold hover:opacity-80">바로 확인하기 →</a>
      </div>

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
            <div class="relative w-full">
              <input
                type="search"
                id="search-input"
                placeholder="국민연금, 기초연금, 주택연금 검색..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
              />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
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
            {/* 관리자 */}
            <a href="/admin" class="hidden md:flex items-center gap-1 text-xs text-gray-400 hover:text-primary-700 transition-colors">
              <i class="fas fa-cog"></i>
            </a>
          </div>
        </div>

        {/* GNB 메뉴 */}
        <nav class="flex items-center gap-1 pb-0 border-t border-gray-50">
          {navItems.map(item => (
            item.active ? (
              <a
                key={item.href}
                href={item.href}
                class="relative px-4 py-3 text-sm font-semibold text-primary-700 border-b-2 border-primary-600"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.href}
                class="relative px-4 py-3 text-sm text-gray-300 cursor-not-allowed select-none"
                title="준비 중입니다"
              >
                {item.label}
                <span class="ml-1 text-xs bg-gray-100 text-gray-400 rounded px-1 py-0.5">준비중</span>
              </span>
            )
          ))}
        </nav>
      </div>

      {/* 모바일 검색 패널 */}
      <div id="mobile-search-panel" class="hidden bg-white border-t border-gray-100 px-4 py-3 md:hidden">
        <div class="relative">
          <input
            type="search"
            placeholder="검색어를 입력하세요..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-primary-400"
          />
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        </div>
      </div>
    </header>
  )
}
