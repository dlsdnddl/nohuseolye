import { categories } from '../data/categories'
import { posts, isPreview } from '../data/posts'

// 카테고리별 푸터 링크: footerLinks 지정 시 고정 목록, 아니면 공개 글 최신 4편
const footerColumns = () =>
  categories
    .filter(c => c.state === 'open' || isPreview)
    .map(c => {
      const items = c.footerLinks
        ? c.footerLinks.map(l => ({ href: `/${c.slug}/${l.slug}`, label: l.label }))
        : posts
            .filter(p => p.category === c.slug)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
            .slice(0, 4)
            .map(p => ({ href: `/${p.category}/${p.slug}`, label: p.shortTitle || p.title }))
      return { label: c.label, items }
    })

export const Footer = () => {
  return (
    <footer class="bg-gray-900 text-gray-400 mt-20">
      {/* 떠 있는 버튼은 "맨 위로" 하나만 (카카오톡 공유는 글 본문 안의 공유 버튼 사용) */}
      <div class="fixed bottom-5 right-4 z-40">
        <button
          onclick="window.scrollTo({top:0,behavior:'smooth'})"
          class="w-11 h-11 bg-primary-700/90 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-lg transition-colors text-white"
          title="맨 위로"
          aria-label="맨 위로"
        >
          <i class="fas fa-chevron-up"></i>
        </button>
      </div>

      {/* 뉴스레터 섹션 */}
      <div class="bg-primary-800 py-12">
        <div class="max-w-6xl mx-auto px-4 text-center">
          <p class="text-primary-300 text-sm font-semibold mb-2">📬 무료 뉴스레터</p>
          <h3 class="text-white text-2xl font-bold mb-2">매주 월요일, 노후 혜택 변경사항 알림</h3>
          <p class="text-primary-200 text-sm mb-6">기초연금 금액 변경, 지원금 신청 마감일 등 놓치면 손해인 정보를 먼저 알려드립니다.</p>
          <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" id="newsletter-form">
            <input
              type="email"
              id="newsletter-email"
              placeholder="이메일 주소 입력"
              class="flex-1 px-4 py-3 rounded-lg bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {/* 자동 프로그램(스팸) 차단용 칸 — 사람에게는 보이지 않음 */}
            <input type="text" id="newsletter-website" name="website" tabindex={-1} autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />
            <button id="newsletter-btn" class="px-6 py-3 bg-warm-500 hover:bg-warm-600 text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap">
              구독하기
            </button>
          </div>
          <p id="newsletter-msg" class="text-primary-400 text-xs mt-3">언제든지 구독 취소 가능 · 스팸 없음</p>
        </div>
      </div>

      {/* 메인 푸터 */}
      <div class="max-w-6xl mx-auto px-4 py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* 브랜드 */}
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-seedling text-white text-sm"></i>
              </div>
              <span class="font-bold text-white text-lg">노후설계 가이드</span>
            </div>
            <p class="text-sm leading-relaxed text-gray-500">
              보건복지부·금감원 공식 자료를 4070의 일상 언어로 번역하는 노후 현금흐름 설계 정보 플랫폼입니다.
            </p>
            <div class="flex gap-3 mt-4">
              <a href="#" class="w-8 h-8 bg-gray-700 hover:bg-primary-700 rounded-full flex items-center justify-center transition-colors">
                <i class="fab fa-youtube text-xs text-white"></i>
              </a>
              <a href="#" class="w-8 h-8 bg-gray-700 hover:bg-yellow-500 rounded-full flex items-center justify-center transition-colors">
                <i class="fas fa-comment text-xs text-white"></i>
              </a>
            </div>
          </div>

          {/* 카테고리별 링크 (categories.ts 기반 — 오픈된 카테고리만) */}
          {footerColumns().map(col => (
            <div key={col.label}>
              <h4 class="text-white font-semibold text-sm mb-4">{col.label}</h4>
              <ul class="space-y-2 text-sm">
                {col.items.map(it => (
                  <li key={it.href}><a href={it.href} class="hover:text-white transition-colors">{it.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          {/* 사이트 정보 */}
          <div>
            <h4 class="text-white font-semibold text-sm mb-4">사이트 정보</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="/about" class="hover:text-white transition-colors">운영자 소개</a></li>
              <li><a href="/privacy" class="hover:text-white transition-colors">개인정보처리방침</a></li>
              <li><a href="/disclaimer" class="hover:text-white transition-colors">면책 고지</a></li>
              <li><a href="/contact" class="hover:text-white transition-colors">문의하기</a></li>
            </ul>
          </div>
        </div>

        {/* 공식 기관 링크 */}
        <div class="border-t border-gray-800 pt-8 mb-8">
          <p class="text-xs text-gray-600 mb-3">📎 공식 정보 출처</p>
          <div class="flex flex-wrap gap-3">
            {[
              { name: '국민연금공단', url: 'https://www.nps.or.kr' },
              { name: '국민건강보험공단', url: 'https://www.nhis.or.kr' },
              { name: '한국주택금융공사', url: 'https://www.hf.go.kr' },
              { name: '보건복지부', url: 'https://www.mohw.go.kr' },
              { name: '복지로', url: 'https://www.bokjiro.go.kr' },
              { name: '금융감독원', url: 'https://www.fss.or.kr' },
            ].map(source => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-gray-600 hover:text-primary-400 border border-gray-800 hover:border-primary-800 rounded px-2 py-1 transition-colors"
              >
                {source.name} <i class="fas fa-external-link-alt ml-1 text-xs opacity-50"></i>
              </a>
            ))}
          </div>
        </div>

        {/* 법적 고지 */}
        <div class="border-t border-gray-800 pt-6">
          <p class="text-xs text-gray-600 leading-relaxed mb-2">
            ⚠️ <strong class="text-gray-500">면책 고지:</strong> 본 사이트의 모든 정보는 보건복지부·금감원·국민연금공단 등의 공식 자료를 기반으로 작성된 참고용 정보이며, 개인별 상황에 따라 실제 수령액·자격 여부는 달라질 수 있습니다. 중요한 의사결정 전 반드시 해당 기관에 직접 확인하시기 바랍니다.
          </p>
          <p class="text-xs text-gray-700">
            © 2026 노후설계 가이드. 본 사이트는 구글 애드센스 광고를 통해 운영됩니다.
          </p>
        </div>
      </div>
    </footer>
  )
}
