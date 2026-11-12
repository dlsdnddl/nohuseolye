// 4대 퀵링크 섹션
export const QuickLinks = () => {
  const links = [
    {
      icon: 'fas fa-coins',
      label: '국민연금 수령액 조회',
      desc: '내 납부 이력 기반 예상 수령액',
      href: '/pension-asset/national-pension-amount-calculation',
    },
    {
      icon: 'fas fa-home',
      label: '주택연금 계산',
      desc: '만 55세 이상 · 내 집으로 매달 받는 금액',
      href: '/pension-asset/housing-pension-calculation',
    },
    {
      icon: 'fas fa-hand-holding-heart',
      label: '기초연금 자격 확인',
      desc: '만 65세 이상 · 소득·재산 기준 수급 여부',
      href: '/pension-asset/basic-pension-eligibility',
    },
    {
      icon: 'fas fa-heartbeat',
      label: '장기요양등급 신청',
      desc: '부모님 돌봄 서비스 등급 안내',
      href: '/care/long-term-care-grade-application',
    },
  ]

  return (
    <section class="max-w-6xl mx-auto px-4 py-14">
      <div class="text-center mb-10">
        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900">가장 많이 찾는 정보</h2>
        <p class="text-gray-500 mt-2 text-sm">자주 찾는 노후 정보 4가지를 모았습니다</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            class="group relative flex flex-col border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-200 bg-white"
          >
            {/* 아이콘 */}
            <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-primary-50 text-primary-700">
              <i class={`${link.icon} text-2xl`}></i>
            </div>

            {/* 텍스트 */}
            <h3 class="font-bold text-gray-900 text-base mb-1 group-hover:text-primary-700 transition-colors leading-snug">
              {link.label}
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed flex-1">{link.desc}</p>

            {/* 버튼 */}
            <div class="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-semibold text-center transition-colors bg-primary-700 group-hover:bg-primary-600">
              바로 확인하기 <i class="fas fa-arrow-right ml-1 text-xs"></i>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
