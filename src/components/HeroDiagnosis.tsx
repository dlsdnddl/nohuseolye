// Hero 섹션 — 노후자금 충분지수 진단기
// 국민연금공단 공식 데이터 기반 계산 로직 (JavaScript로 클라이언트 사이드 처리)
export const HeroDiagnosis = () => {
  return (
    <section class="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 overflow-hidden">
      {/* 배경 장식 */}
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-20 -right-20 w-80 h-80 bg-primary-600 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-60 h-60 bg-primary-500 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600 rounded-full opacity-5"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          {/* 좌측 - 설명 */}
          <div class="text-white">
            <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-primary-100 mb-6">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              공식 데이터 기반 무료 진단
            </div>
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              내 노후자금,<br/>
              <span class="text-green-300">지금 충분한가요?</span>
            </h1>
            <p class="text-primary-200 text-lg leading-relaxed mb-6">
              나이, 가입기간, 자산 입력만으로<br/>
              <strong class="text-white">국민연금 예상 수령액</strong>과 <strong class="text-white">노후자금 충분지수</strong>를<br/>
              1분 안에 확인하세요.
            </p>
            <div class="flex flex-wrap gap-3 text-sm text-primary-300">
              <span class="flex items-center gap-1"><i class="fas fa-check-circle text-green-400"></i> 국민연금공단 기준</span>
              <span class="flex items-center gap-1"><i class="fas fa-check-circle text-green-400"></i> 개인정보 수집 없음</span>
              <span class="flex items-center gap-1"><i class="fas fa-check-circle text-green-400"></i> 완전 무료</span>
            </div>
          </div>

          {/* 우측 - 진단기 카드 */}
          <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div id="diagnosis-form">
              <h2 class="text-xl font-bold text-gray-800 mb-1">노후자금 충분지수 진단</h2>
              <p class="text-sm text-gray-400 mb-6">아래 정보를 입력하면 즉시 결과를 알려드립니다.</p>

              <div class="space-y-4">
                {/* 현재 나이 */}
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="diag-age">
                    현재 나이 <span class="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="diag-age"
                    min="40" max="75" placeholder="예: 55"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>

                {/* 국민연금 납부 기간 */}
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="diag-years">
                    국민연금 납부 기간 <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="number"
                      id="diag-years"
                      min="1" max="45" placeholder="예: 20"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all pr-10"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">년</span>
                  </div>
                </div>

                {/* 월 평균 소득 */}
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="diag-income">
                    국민연금 납부 당시 월 평균 소득 <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <input
                      type="number"
                      id="diag-income"
                      min="50" max="1000" placeholder="예: 300"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all pr-14"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">만원</span>
                  </div>
                </div>

                {/* 예상 월 생활비 */}
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1" for="diag-expense">
                    은퇴 후 예상 월 생활비
                  </label>
                  <div class="relative">
                    <input
                      type="number"
                      id="diag-expense"
                      min="50" max="1000" placeholder="예: 250"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all pr-14"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">만원</span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">※ 통계청 기준 50대 부부 평균 생활비: 약 280만원</p>
                </div>

                <button
                  id="diagnosis-btn"
                  onclick="runDiagnosis()"
                  class="w-full py-4 bg-primary-700 hover:bg-primary-600 text-white font-bold rounded-xl text-base transition-all hover:shadow-lg active:scale-95"
                >
                  <i class="fas fa-chart-pie mr-2"></i>노후자금 충분지수 진단하기
                </button>
                <p class="text-center text-xs text-gray-400">국민연금공단 2024년 산정 기준 적용 · 참고용 결과입니다</p>
              </div>
            </div>

            {/* 결과 영역 (초기에는 숨김) */}
            <div id="diagnosis-loading" class="hidden text-center py-8">
              <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p class="text-gray-500 text-sm">분석 중입니다...</p>
            </div>

            <div id="diagnosis-result" class="hidden">
              {/* 결과는 JS로 동적 렌더링 */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
