// 4대 퀵링크 섹션
export const QuickLinks = () => {
  const links = [
    {
      icon: 'fas fa-coins',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      label: '국민연금 수령액 조회',
      desc: '내 납부 이력 기반 예상 수령액',
      href: '/pension-asset/national-pension-amount-calculation',
      badge: '인기',
      badgeColor: 'bg-red-100 text-red-600',
    },
    {
      icon: 'fas fa-home',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
      label: '주택연금 계산',
      desc: '내 집으로 매달 받을 수 있는 금액',
      href: '/pension-asset/housing-pension-calculation',
      badge: '55세+',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: 'fas fa-hand-holding-heart',
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      btnColor: 'bg-orange-500 hover:bg-orange-600',
      label: '기초연금 자격 확인',
      desc: '소득·재산 기준으로 내 수급 여부',
      href: '/pension-asset/basic-pension-eligibility',
      badge: '65세+',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      icon: 'fas fa-heartbeat',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      label: '장기요양등급 신청',
      desc: '부모님 돌봄 서비스 등급 안내',
      href: '/pension-asset/long-term-care-grade-application',
      badge: '대리검색',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
  ]

  return (
    <section class="max-w-6xl mx-auto px-4 py-14">
      <div class="text-center mb-10">
        <p class="text-primary-600 text-sm font-semibold mb-2">⚡ 지금 바로 확인하세요</p>
        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900">가장 많이 찾는 정보</h2>
        <p class="text-gray-500 mt-2 text-sm">검색 1위 노후 정보 4가지, 한 번에 확인하세요</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            class={`group relative flex flex-col border rounded-2xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white ${link.color.split(' ').filter(c => c.startsWith('border')).join(' ')}`}
          >
            {/* 배지 */}
            <span class={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full ${link.badgeColor}`}>
              {link.badge}
            </span>

            {/* 아이콘 */}
            <div class={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${link.color.split(' ').filter(c => !c.startsWith('border')).join(' ')}`}>
              <i class={`${link.icon} text-2xl`}></i>
            </div>

            {/* 텍스트 */}
            <h3 class="font-bold text-gray-900 text-base mb-1 group-hover:text-primary-700 transition-colors leading-snug">
              {link.label}
            </h3>
            <p class="text-gray-500 text-xs leading-relaxed flex-1">{link.desc}</p>

            {/* 버튼 */}
            <div class={`mt-5 w-full py-2.5 rounded-xl text-white text-sm font-semibold text-center transition-colors ${link.btnColor}`}>
              바로 확인하기 <i class="fas fa-arrow-right ml-1 text-xs"></i>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
