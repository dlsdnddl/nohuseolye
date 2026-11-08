/* ══════════════════════════════════════════════
   노후설계 가이드 — 메인 JavaScript
   ══════════════════════════════════════════════ */

// ─── 노후자금 충분지수 진단기 ─────────────────────────────────────────────────

/**
 * 국민연금 예상 수령액 계산 (2026년 5월 기준)
 * 공식: BPA = C × (A + B)  →  P = 0.5 + (totalMonths - 120) × 0.05/12
 * A값: 2026년 전체 가입자 평균소득 = 319만 3,511원 (보건복지부 고시)
 * C값: 2026년 소득대체율 보정계수 = 1.29 (소득대체율 43% 적용 기준)
 * B값: 본인 평균소득 (상한 637만원, 하한 40만원 적용)
 * MIN_MONTHS: 최소 수급 요건 = 120개월(10년)
 *
 * 출처: https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0048M0.do
 */
const NPS_A       = 319.3511; // 2026년 전체 가입자 평균소득 (만원)
const NPS_C       = 1.29;     // 2026년 소득대체율 보정계수
const NPS_B_MAX   = 637.0;    // 기준소득월액 상한 (2026년, 만원)
const NPS_B_MIN   = 40.0;     // 기준소득월액 하한 (2026년, 만원)
const NPS_MIN_MONTHS = 120;   // 최소 수급 요건 (개월)

function calcNationalPension(workYears, avgIncome) {
  const A = NPS_A;
  // B 상·하한 적용
  const B = Math.min(NPS_B_MAX, Math.max(NPS_B_MIN, avgIncome));
  const totalMonths = workYears * 12;
  // 최소 가입 기간(10년) 미만이면 수령 불가
  if (totalMonths < NPS_MIN_MONTHS) return 0;
  // 지급률 P: 10년(기본 0.5) + 초과 개월 × 0.05/12
  const P = 0.5 + (totalMonths - NPS_MIN_MONTHS) * (0.05 / 12);
  // 기본연금액(만원/년) → 월액으로 환산
  const bpaAnnual  = NPS_C * (A + B); // 만원/년
  const monthly    = (bpaAnnual * P) / 12;
  return Math.round(monthly * 10) / 10; // 소수점 1자리 (만원)
}

/**
 * 수령 시기 조정 함수
 * - 조기수령: 월 0.5% 감액 (연 6%)
 * - 연기수령: 월 0.6% 증액 (연 7.2%)
 * @param {number} basePension  기준 수령액 (만원)
 * @param {number} monthsDelta  양수=연기, 음수=조기 (개월 수)
 * @returns {number} 조정된 월 수령액 (만원)
 */
function adjustForTiming(basePension, monthsDelta) {
  if (monthsDelta === 0) return basePension;
  const rate = monthsDelta > 0 ? 0.006 : 0.005; // 연기 0.6%/월, 조기 0.5%/월
  const factor = 1 + rate * monthsDelta;          // monthsDelta < 0 이면 감액
  return Math.round(basePension * factor * 10) / 10;
}

/**
 * 최적 수령 시기 계산
 * - 출생연도별 노령연금 수급 개시 연령 반영 (1969년생 이후 → 65세)
 * - 조기수령: 최대 5년 앞당김, 월 0.5% 감액 (연 6%)
 * - 연기수령: 최대 5년 연기, 월 0.6% 증액 (연 7.2%)
 * - 손익분기점 비교로 최적 시점 제안
 */
function calcOptimalReceiveAge(age, workYears, avgIncome) {
  // 출생연도 추정 (현재 2026년 기준)
  const birthYear = 2026 - age;
  // 노령연금 기본 수급 개시 연령
  let normalAge;
  if (birthYear <= 1952) normalAge = 60;
  else if (birthYear <= 1956) normalAge = 61;
  else if (birthYear <= 1960) normalAge = 62;
  else if (birthYear <= 1964) normalAge = 63;
  else if (birthYear <= 1968) normalAge = 64;
  else normalAge = 65; // 1969년생 이후

  const basePension = calcNationalPension(workYears, avgIncome); // 기본 수령액(만원)

  // 시나리오별 계산
  const scenarios = [];

  // 조기수령: 1~5년 앞당김 (가입기간 10년 이상 필요)
  if (workYears >= 10) {
    for (let early = 1; early <= 5; early++) {
      const receiveAge = normalAge - early;
      if (receiveAge < 55 || receiveAge <= age) continue; // 현재 나이보다 과거면 skip
      const reductionRate = early * 6; // 연 6% 감액
      const monthlyAmt = adjustForTiming(basePension, -early * 12);
      // 조기 vs 정상 손익분기점: 줄어든 금액을 만회하는 월 수
      const monthsEarly = early * 12; // 더 일찍 받는 개월 수
      const monthlyDiff = basePension - monthlyAmt; // 월 차이
      const breakEvenMonths = monthlyDiff > 0 ? Math.round((monthlyAmt * monthsEarly) / monthlyDiff) : 0;
      const breakEvenAge = Math.round((normalAge + breakEvenMonths / 12) * 10) / 10;
      scenarios.push({
        type: 'early',
        label: `조기수령 (${receiveAge}세)`,
        receiveAge,
        monthlyAmt,
        reductionRate,
        breakEvenAge,
        note: `정상 대비 월 ${reductionRate}% 감액 → 손익분기: ${breakEvenAge}세`
      });
    }
  }

  // 정상수령
  scenarios.push({
    type: 'normal',
    label: `정상수령 (${normalAge}세)`,
    receiveAge: normalAge,
    monthlyAmt: basePension,
    reductionRate: 0,
    breakEvenAge: null,
    note: '기준 수령액'
  });

  // 연기수령: 1~5년 연기
  for (let delay = 1; delay <= 5; delay++) {
    const receiveAge = normalAge + delay;
    const increaseRate = delay * 7.2; // 연 7.2% 증액
    const monthlyAmt = adjustForTiming(basePension, delay * 12);
    // 연기 vs 정상 손익분기점
    const monthsDelay = delay * 12;
    const monthlyDiff = monthlyAmt - basePension;
    const breakEvenMonths = monthlyDiff > 0 ? Math.round((basePension * monthsDelay) / monthlyDiff) : 0;
    const breakEvenAge = Math.round((receiveAge + breakEvenMonths / 12) * 10) / 10;
    scenarios.push({
      type: 'delay',
      label: `연기수령 (${receiveAge}세)`,
      receiveAge,
      monthlyAmt,
      increaseRate,
      breakEvenAge,
      note: `정상 대비 월 ${increaseRate.toFixed(1)}% 증액 → 손익분기: ${breakEvenAge}세`
    });
  }

  // 최적 시나리오 판단 (기대수명 85세 기준 총수령액 비교)
  const EXPECTED_DEATH_AGE = 85;
  let bestScenario = null;
  let bestTotal = -1;
  scenarios.forEach(s => {
    if (s.receiveAge >= EXPECTED_DEATH_AGE) return;
    const totalMonths = (EXPECTED_DEATH_AGE - s.receiveAge) * 12;
    const total = s.monthlyAmt * totalMonths;
    if (total > bestTotal) {
      bestTotal = total;
      bestScenario = s;
    }
  });

  return { normalAge, basePension, scenarios, bestScenario, birthYear };
}

/**
 * 목표 연금액 달성을 위한 추가 납부 기간 계산
 * - 국민연금 제도적 납부 가능 연령 반영
 *   · 의무가입: ~만 59세까지
 *   · 임의계속가입: 60세~64세 (65세 생일 이전까지)
 *   · 실제 최대 납부 가능 나이: MAX_AGE=65 (65세 생일 직전까지)
 * - 나이(age)를 반드시 전달받아 제도적 한계 내에서 계산
 */
function calcAdditionalYearsNeeded(currentYears, avgIncome, targetMonthly, age) {
  const A = NPS_A;  // 전역 상수 사용
  const B = avgIncome;
  const currentPension = calcNationalPension(currentYears, avgIncome);

  // ① 이미 달성한 경우
  if (targetMonthly <= currentPension) {
    return {
      status: 'already_met',
      additionalYears: 0,
      maxAdditionalYears: 0,
      pensionAfterAdd: currentPension,
      targetYearsRaw: currentYears,
      isAlreadyMet: true
    };
  }

  // ② 제도적으로 납부 가능한 최대 추가 기간 계산
  // 최대 납부 가능 나이: 65세 생일 이전까지 (임의계속가입 포함)
  const MAX_CONTRIBUTION_AGE = 65;
  const maxAdditionalByAge = Math.max(0, MAX_CONTRIBUTION_AGE - age); // 나이 기준 한계
  const maxAdditionalByRule = Math.max(0, 45 - currentYears);          // 45년 상한 기준
  const maxAdditional = Math.min(maxAdditionalByAge, maxAdditionalByRule); // 둘 중 작은 값

  // ③ 목표 달성에 필요한 이론적 납부 기간 역산
  // 새 공식 역산: monthly = C×(A+B)×P/12  →  P = target×12/(C×(A+B))  →  months = ...
  // totalMonths = MIN_MONTHS + (P - 0.5) × 12/0.05
  const Bclamp = Math.min(NPS_B_MAX, Math.max(NPS_B_MIN, B));
  const targetP = (targetMonthly * 12) / (NPS_C * (A + Bclamp));
  const targetTotalMonths = NPS_MIN_MONTHS + Math.max(0, (targetP - 0.5) * (12 / 0.05));
  const targetYearsRaw = targetTotalMonths / 12;
  const neededAdditional = Math.max(0, Math.ceil(targetYearsRaw - currentYears));

  // ④ 제도적으로 달성 가능한지 판별
  const canAchieve = neededAdditional <= maxAdditional;
  const actualAdditional = Math.min(neededAdditional, maxAdditional);
  const pensionAfterAdd = calcNationalPension(currentYears + actualAdditional, avgIncome);
  const pensionAtMax    = calcNationalPension(currentYears + maxAdditional, avgIncome);

  return {
    // 'achievable' | 'impossible_by_age' | 'impossible_by_cap'
    status: canAchieve ? 'achievable'
          : maxAdditional === 0 ? 'impossible_by_age'
          : 'impossible_by_age',
    additionalYears: actualAdditional,       // 실제 추가 납부 권장 기간
    maxAdditionalYears: maxAdditional,        // 제도적으로 추가 가능한 최대 기간
    neededAdditional,                         // 이론적으로 필요한 추가 기간
    pensionAfterAdd: Math.round(pensionAfterAdd * 10) / 10,  // 추가 납부 후 예상 수령액
    pensionAtMax:    Math.round(pensionAtMax * 10) / 10,     // 최대까지 납부 시 수령액
    targetYearsRaw:  Math.ceil(targetYearsRaw),
    maxContributeAge: Math.min(age + maxAdditional, MAX_CONTRIBUTION_AGE - 1),
    canAchieve,
    isAlreadyMet: false
  };
}

/**
 * 노후자금 충분지수 계산
 * - 예상 국민연금 수령액 vs 목표 생활비 비율
 * - 추가 자산 여부, 주거 형태 등 가중치
 */
function calcSufficiencyIndex(pension, monthlyExpense) {
  if (monthlyExpense <= 0) return 0;
  const ratio = pension / monthlyExpense;
  // ratio 0~1 → score 0~100 (비선형 스케일)
  const score = Math.min(100, Math.round(ratio * 80));
  return score;
}

function getGrade(score) {
  if (score >= 80) return { grade: 'A', label: '안정', color: '#059669', bg: '#ecfdf5', desc: '노후자금이 안정적입니다. 연금 수령 전략을 최적화할 시점입니다.' };
  if (score >= 60) return { grade: 'B', label: '양호', color: '#0284c7', bg: '#eff6ff', desc: '기본적인 노후 준비는 되어 있습니다. 추가 저축을 권장합니다.' };
  if (score >= 40) return { grade: 'C', label: '주의', color: '#d97706', bg: '#fffbeb', desc: '생활비 대비 연금이 부족합니다. 보완 전략이 필요합니다.' };
  if (score >= 20) return { grade: 'D', label: '위험', color: '#dc2626', bg: '#fef2f2', desc: '노후 자금이 크게 부족합니다. 지금 바로 재설계가 필요합니다.' };
  return { grade: 'F', label: '위기', color: '#7f1d1d', bg: '#fef2f2', desc: '긴급 노후 재설계가 필요합니다. 기초연금·복지 수급 여부를 먼저 확인하세요.' };
}

function runDiagnosis() {
  const age = parseInt(document.getElementById('diag-age')?.value || '0');
  const years = parseInt(document.getElementById('diag-years')?.value || '0');
  const income = parseInt(document.getElementById('diag-income')?.value || '0');
  const expense = parseInt(document.getElementById('diag-expense')?.value || '250');

  // 유효성 검사
  if (!age || age < 40 || age > 80) {
    showToast('나이를 40~80 사이로 입력해주세요.');
    return;
  }
  if (!years || years < 1 || years > 45) {
    showToast('납부 기간을 1~45년 사이로 입력해주세요.');
    return;
  }
  if (!income || income < 50) {
    showToast('월 평균 소득을 50만원 이상으로 입력해주세요.');
    return;
  }

  const form = document.getElementById('diagnosis-form');
  const loading = document.getElementById('diagnosis-loading');
  const result = document.getElementById('diagnosis-result');

  // 폼 숨김, 로딩 표시
  form.classList.add('hidden');
  loading.classList.remove('hidden');
  result.classList.add('hidden');

  // 1.5초 딜레이 (광고 노출 타이밍)
  setTimeout(() => {
    const pension = calcNationalPension(years, income);
    const monthlyExpense = expense || 250;
    const score = calcSufficiencyIndex(pension, monthlyExpense);
    const gradeInfo = getGrade(score);
    const shortfall = Math.max(0, monthlyExpense - pension);
    // 최적 수령 시기 & 추가 납부 계산
    const optimalInfo = calcOptimalReceiveAge(age, years, income);
    const additionalInfo = calcAdditionalYearsNeeded(years, income, monthlyExpense, age);

    // 결과 HTML 생성
    result.innerHTML = buildResultHTML({
      score, gradeInfo, pension, monthlyExpense, shortfall, age, years,
      optimalInfo, additionalInfo
    });

    loading.classList.add('hidden');
    result.classList.remove('hidden');
    result.classList.add('fade-in-up');

    // GA4 계산기 완료 이벤트
    if (typeof gtag === 'function') {
      gtag('event', 'calculator_complete', {
        calculator_name: 'retirement_diagnosis',
        result_grade: gradeInfo.grade,
        result_score: score
      });
    }
  }, 1500);
}

function buildResultHTML({ score, gradeInfo, pension, monthlyExpense, shortfall, age, years, optimalInfo, additionalInfo }) {
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (score / 100) * circumference;

  return `
    <div class="text-center mb-6" data-grade="${gradeInfo.grade}" data-shortfall="${shortfall}">
      <div class="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4"
        style="background:${gradeInfo.bg}; color:${gradeInfo.color}">
        <span class="w-2 h-2 rounded-full" style="background:${gradeInfo.color}"></span>
        노후자금 충분지수 분석 완료
      </div>

      <!-- 점수 링 -->
      <div class="relative w-32 h-32 mx-auto mb-4">
        <svg viewBox="0 0 120 120" class="w-full h-full" style="transform:rotate(-90deg)">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" stroke-width="10"/>
          <circle cx="60" cy="60" r="48" fill="none"
            stroke="${gradeInfo.color}" stroke-width="10"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            stroke-linecap="round"
            style="transition: stroke-dashoffset 1s ease-out"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-extrabold" style="color:${gradeInfo.color}">${score}</span>
          <span class="text-xs text-gray-400">/ 100점</span>
        </div>
      </div>

      <div class="text-2xl font-extrabold mb-1" style="color:${gradeInfo.color}">
        ${gradeInfo.grade}등급 — ${gradeInfo.label}
      </div>
      <p class="text-sm text-gray-500 mb-6 leading-relaxed">${gradeInfo.desc}</p>
    </div>

    <!-- 상세 수치 -->
    <div class="space-y-3 mb-6">
      <div class="flex items-center justify-between p-3 rounded-xl" style="background:${gradeInfo.bg}">
        <span class="text-sm font-semibold text-gray-700">
          <i class="fas fa-coins mr-2" style="color:${gradeInfo.color}"></i>국민연금 예상 수령액
        </span>
        <span class="font-extrabold text-lg" style="color:${gradeInfo.color}">월 ${pension.toLocaleString()}만원</span>
      </div>
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <span class="text-sm font-semibold text-gray-700">
          <i class="fas fa-shopping-basket mr-2 text-gray-400"></i>예상 월 생활비
        </span>
        <span class="font-bold text-gray-800">월 ${monthlyExpense.toLocaleString()}만원</span>
      </div>
      <div class="flex items-center justify-between p-3 ${shortfall > 0 ? 'bg-red-50' : 'bg-green-50'} rounded-xl">
        <span class="text-sm font-semibold text-gray-700">
          <i class="fas fa-${shortfall > 0 ? 'exclamation-triangle text-red-500' : 'check-circle text-green-500'} mr-2"></i>
          월 ${shortfall > 0 ? '부족액' : '여유액'}
        </span>
        <span class="font-extrabold ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}">
          ${shortfall > 0 ? '-' : '+'}${Math.abs(shortfall > 0 ? shortfall : monthlyExpense - pension).toLocaleString()}만원
        </span>
      </div>
    </div>

    <!-- 최적 수령 시기 카드 -->
    ${optimalInfo ? (() => {
      const best = optimalInfo.bestScenario;
      const normal = optimalInfo.scenarios.find(s => s.type === 'normal');
      const isBestNormal = best && best.type === 'normal';
      const isBestDelay = best && best.type === 'delay';
      const bestColor = isBestDelay ? '#059669' : isBestNormal ? '#0284c7' : '#d97706';
      const bestBg   = isBestDelay ? '#ecfdf5'  : isBestNormal ? '#eff6ff'  : '#fffbeb';

      // 주요 시나리오 3개만 표시: 조기 1년, 정상, 연기 1년~2년
      const showScenarios = optimalInfo.scenarios.filter(s =>
        s.type === 'normal' ||
        (s.type === 'early' && s.receiveAge === optimalInfo.normalAge - 1) ||
        (s.type === 'delay' && (s.receiveAge === optimalInfo.normalAge + 1 || s.receiveAge === optimalInfo.normalAge + 3))
      );

      return `
      <div class="rounded-xl border-2 mb-4 overflow-hidden" style="border-color:${bestColor}20; background:${bestBg}">
        <div class="flex items-center gap-2 px-4 pt-4 pb-2">
          <i class="fas fa-calendar-check" style="color:${bestColor}"></i>
          <span class="text-sm font-extrabold" style="color:${bestColor}">최적 수령 시기</span>
          ${ best ? `<span class="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style="background:${bestColor}">추천 ★ ${best.label}</span>` : '' }
        </div>
        <div class="px-4 pb-2">
          <p class="text-xs text-gray-500 mb-3">기대수명 85세 기준 총 수령액이 가장 많은 시나리오를 추천합니다.</p>
          <div class="space-y-2">
            ${showScenarios.map(s => {
              const isRec = best && s.receiveAge === best.receiveAge;
              const sc = s.type === 'delay' ? '#059669' : s.type === 'normal' ? '#0284c7' : '#d97706';
              const lifeTotal = Math.round(s.monthlyAmt * (85 - s.receiveAge) * 12);
              return `
              <div class="flex items-center gap-2 p-2.5 rounded-xl ${ isRec ? 'ring-2' : 'bg-white/60' }" style="${ isRec ? `ring-color:${sc}; background:white` : '' }">
                <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${sc}"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <span class="text-xs font-bold" style="color:${sc}">${s.label}</span>
                    ${ isRec ? '<span class="text-xs text-white font-bold px-1.5 py-0.5 rounded" style="background:'+sc+'">추천</span>' : '' }
                  </div>
                  <span class="text-xs text-gray-400">${s.note}</span>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-sm font-extrabold" style="color:${sc}">월 ${s.monthlyAmt.toLocaleString()}만원</div>
                  <div class="text-xs text-gray-400">총 ${lifeTotal.toLocaleString()}만원</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="px-4 py-2 border-t" style="border-color:${bestColor}20">
          <p class="text-xs text-gray-400"><i class="fas fa-info-circle mr-1"></i>정확한 수령 시기는 <a href="https://www.nps.or.kr" target="_blank" class="underline">국민연금공단</a>에서 확인하세요.</p>
        </div>
      </div>`;
    })() : ''}

    <!-- 몇 년 더 내야 할까 카드 -->
    ${additionalInfo ? (() => {
      const ai = additionalInfo;

      // ── 케이스 1: 이미 목표 달성 ─────────────────────────────────────────
      if (ai.status === 'already_met') {
        return `
        <div class="rounded-xl border border-green-200 bg-green-50 p-4 mb-4">
          <div class="flex items-center gap-2 mb-1">
            <i class="fas fa-check-circle text-green-600"></i>
            <span class="text-sm font-extrabold text-green-700">몇 년 더 내야 할까?</span>
          </div>
          <p class="text-sm text-green-700">현재 납부 기간(${years}년)만으로 <strong>목표 생활비(${monthlyExpense}만원)를 이미 달성</strong>했습니다! 🎉</p>
          <p class="text-xs text-green-500 mt-1">예상 수령액 <strong>${pension.toLocaleString()}만원</strong> ≥ 목표 생활비 <strong>${monthlyExpense.toLocaleString()}만원</strong></p>
        </div>`;

      // ── 케이스 2: 더 납부해도 목표 달성 가능 ────────────────────────────
      } else if (ai.status === 'achievable') {
        const totalYears = years + ai.additionalYears;
        const progressPct = Math.round((years / totalYears) * 100);
        return `
        <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fas fa-plus-circle text-blue-600"></i>
            <span class="text-sm font-extrabold text-blue-700">몇 년 더 내야 할까?</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-600">현재 납부 기간</span>
            <span class="font-bold text-gray-800">${years}년</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-600">목표 달성까지 추가 필요</span>
            <span class="text-lg font-extrabold text-blue-700">+ ${ai.additionalYears}년</span>
          </div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-600">${totalYears}년 납부 후 예상 수령액</span>
            <span class="font-extrabold text-blue-700">월 ${ai.pensionAfterAdd.toLocaleString()}만원</span>
          </div>
          <div class="w-full bg-blue-100 rounded-full h-2 mt-2 mb-1">
            <div class="bg-blue-500 h-2 rounded-full transition-all" style="width:${progressPct}%"></div>
          </div>
          <p class="text-xs text-blue-400">${years}년 완료 / 목표 ${totalYears}년 (${progressPct}% 달성)</p>
        </div>`;

      // ── 케이스 3: 나이 제한으로 목표 달성 불가 ──────────────────────────
      } else {
        // maxAdditionalYears = 0 이면 이미 64세 이상 → 납부 자체 불가
        const hasRoom = ai.maxAdditionalYears > 0;
        const totalMaxYears = years + ai.maxAdditionalYears;
        // 진행바 = "최대 납부 후 수령액이 목표 생활비의 몇 %인가"
        // (이전: 추가납부기간/필요기간 비율 → 의미없는 수치였음)
        const progressPct = monthlyExpense > 0
          ? Math.round((ai.pensionAtMax / monthlyExpense) * 100)
          : 100;
        const shortfallAtMax = Math.max(0, monthlyExpense - ai.pensionAtMax);

        return `
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fas fa-exclamation-triangle text-amber-500"></i>
            <span class="text-sm font-extrabold text-amber-700">몇 년 더 내야 할까?</span>
          </div>

          ${ hasRoom ? `
          <!-- 납부 가능한 최대치 표시 -->
          <div class="bg-white rounded-xl p-3 mb-3 border border-amber-100">
            <p class="text-xs font-bold text-amber-600 mb-2">📌 국민연금 제도적 납부 한계</p>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-600">현재 납부 기간</span>
              <span class="font-bold text-gray-800">${years}년</span>
            </div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-600">제도상 최대 추가 납부 가능</span>
              <span class="font-bold text-amber-700">+ ${ai.maxAdditionalYears}년 (최대 ${ai.maxContributeAge}세까지)</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-600">최대 납부 후 예상 수령액</span>
              <span class="font-extrabold text-amber-700">월 ${ai.pensionAtMax.toLocaleString()}만원</span>
            </div>
            <div class="w-full bg-amber-100 rounded-full h-2 mb-1">
              <div class="bg-amber-400 h-2 rounded-full" style="width:${Math.min(100, progressPct)}%"></div>
            </div>
            <p class="text-xs text-amber-500">최대 납부 시 목표의 ${Math.min(100,progressPct)}% 달성 · 나머지 ${Math.max(0, 100-Math.min(100,progressPct))}%는 다른 연금으로 보완 필요</p>
          </div>

          <!-- 부족분 안내 -->
          <div class="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
            <p class="text-xs font-bold text-red-600 mb-1">⚠️ 국민연금만으로는 월 <strong>${shortfallAtMax.toLocaleString()}만원</strong> 부족</p>
            <p class="text-xs text-red-500">최대한 납부해도 목표 생활비에 미달합니다. 아래 3층 연금 전략으로 보완하세요.</p>
          </div>` : `
          <!-- 납부 가능 기간 없음 -->
          <div class="bg-white rounded-xl p-3 mb-3 border border-amber-100">
            <p class="text-xs text-amber-700">만 64세 이상으로 국민연금 추가 납부가 불가합니다.</p>
          </div>` }

          <!-- 3층 연금 전략 안내 -->
          <div class="space-y-2">
            <p class="text-xs font-bold text-gray-600">💡 3층 연금으로 부족분 채우기</p>
            <div class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
              <div><strong class="text-blue-700">국민연금</strong> — 최대한 납부 (의무 59세, 임의계속 64세)</div>
            </div>
            <div class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
              <div><strong class="text-green-700">퇴직연금(IRP)</strong> — 연 700만원 한도 세액공제 혜택</div>
            </div>
            <div class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
              <div><strong class="text-purple-700">연금저축·개인연금</strong> — 세액공제 + 노후 현금흐름 보완</div>
            </div>
          </div>
        </div>`;
      }
    })() : ''}

    <!-- 안내 -->
    <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
      <p class="text-xs text-amber-700 leading-relaxed">
        <i class="fas fa-info-circle mr-1"></i>
        위 수치는 <strong>2026년 5월 기준 A값 319만원·C값 1.29·소득대체율 43%</strong>를 바탕으로 한 <strong>참고용 예상값</strong>입니다.
        실제 수령액은 납부 이력·소득 변동에 따라 달라집니다.
        정확한 금액은 <a href="https://www.nps.or.kr" target="_blank" class="underline font-semibold">국민연금공단 공식 홈페이지</a> 또는
        <a href="https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0048M0.do" target="_blank" class="underline font-semibold">연금액 계산 안내</a>에서 확인하세요.
      </p>
    </div>

    <!-- 관련 글 CTA -->
    <div class="space-y-2 mb-5">
      <p class="text-xs font-bold text-gray-500 mb-2">📌 지금 읽으면 좋은 글</p>
      <a href="/pension-asset/national-pension-amount-calculation"
        class="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-colors group">
        <i class="fas fa-arrow-right text-primary-500 text-xs group-hover:translate-x-1 transition-transform"></i>
        <span class="text-sm text-gray-700 group-hover:text-primary-700">국민연금 수령액 정확히 계산하는 법</span>
      </a>
      <a href="/pension-asset/basic-pension-eligibility"
        class="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-colors group">
        <i class="fas fa-arrow-right text-primary-500 text-xs group-hover:translate-x-1 transition-transform"></i>
        <span class="text-sm text-gray-700 group-hover:text-primary-700">기초연금 자격 조건 확인하기</span>
      </a>
    </div>

    <!-- 카카오톡 공유 -->
    <div class="mb-4">
      <p class="text-xs font-bold text-gray-500 mb-2 text-center">📢 결과 공유하기</p>
      <button id="diag-kakao-share-btn"
        class="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        style="background:#FEE500; color:#3A1D1D;"
        onclick="shareDiagnosisKakao()">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="9" cy="8.5" rx="9" ry="7.5" fill="#3A1D1D"/><path d="M4.5 11.5L6 8.5L7.5 10.5L9 7L11 11L12.5 8.5L14 11.5" stroke="#FEE500" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        카카오톡으로 공유하기
      </button>
    </div>

    <button onclick="resetDiagnosis()"
      class="w-full py-3 border-2 border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 font-semibold text-sm rounded-xl transition-colors">
      <i class="fas fa-redo mr-1"></i> 다시 진단하기
    </button>
  `;
}

function resetDiagnosis() {
  const form = document.getElementById('diagnosis-form');
  const result = document.getElementById('diagnosis-result');
  result.classList.add('hidden');
  form.classList.remove('hidden');
  // 입력 초기화
  ['diag-age', 'diag-years', 'diag-income', 'diag-expense'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}


// ─── 상황별 필터링 ─────────────────────────────────────────────────────────────

// 포스트 데이터 (서버 렌더링 된 카드와 연동)
const FALLBACK_POSTS_DATA = [
  { id: '1', slug: 'national-pension-amount-calculation', situation: '은퇴 5년 전', type: 'pillar',     title: '국민연금 수령액 2026 완벽 계산법 — A값 319만원 기준', category: 'pension-asset', readTime: 8 },
  { id: '2', slug: 'housing-pension-calculation',         situation: '은퇴 5년 전', type: 'comparison', title: '주택연금 계산기 2026 — 3월부터 3.13% 인상, 내 집으로 얼마?', category: 'pension-asset', readTime: 9 },
  { id: '3', slug: 'basic-pension-eligibility',           situation: '은퇴 후 생활비 걱정될 때', type: 'checklist', title: '기초연금 자격조건 2026 — 월 최대 34만 9,700원', category: 'pension-asset', readTime: 7 },
  { id: '4', slug: 'long-term-care-grade-application',    situation: '부모님 돌봄이 필요할 때',   type: 'pillar',     title: '장기요양등급 신청 방법 2026 총정리 — 재가급여 한도 대폭 인상', category: 'care', readTime: 10 },
  { id: '5', slug: 'retirement-5years-checklist',         situation: '은퇴 5년 전', type: 'checklist', title: '은퇴 5년 전 반드시 해야 할 7가지 체크리스트 (2026 최신)', category: 'pension-asset', readTime: 7 },
  { id: '6', slug: 'medical-expense-support-parents',     situation: '부모님 병원비 걱정될 때',   type: 'comparison', title: '부모님 병원비 지원제도 2026 — 몰라서 못 받는 5가지', category: 'care', readTime: 9 },
];

// 서버가 홈 페이지에 주입한 공개 글 목록(#posts-data)을 우선 사용 — 신규 글 발행 시 자동 반영
// (주입 데이터가 없거나 파싱 실패 시 위 FALLBACK 사용)
const ALL_POSTS_DATA = (function () {
  try {
    const el = document.getElementById('posts-data');
    if (el) {
      const data = JSON.parse(el.textContent || '[]');
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) { /* fallback */ }
  return FALLBACK_POSTS_DATA;
})();

const TYPE_BADGE = {
  pillar:     { label: '기둥글',     color: 'bg-blue-100 text-blue-700' },
  comparison: { label: '비교분석',   color: 'bg-amber-100 text-amber-700' },
  checklist:  { label: '체크리스트', color: 'bg-green-100 text-green-700' },
};

let currentSituation = '은퇴 5년 전';
let displayCount = 6;

function filterBySituation(situation) {
  currentSituation = situation;
  displayCount = 6;

  // 탭 스타일 갱신
  document.querySelectorAll('.situation-tab').forEach(tab => {
    const isActive = tab.dataset.situation === situation;
    tab.className = `situation-tab flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-semibold transition-all ${
      isActive
        ? 'bg-primary-700 text-white border-primary-700 shadow-lg'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
    }`;
  });

  renderSituationPosts();
}

function renderSituationPosts() {
  const container = document.getElementById('situation-posts');
  if (!container) return;

  // 해당 상황의 포스트 필터링
  const filtered = currentSituation
    ? ALL_POSTS_DATA.filter(p => p.situation === currentSituation)
    : ALL_POSTS_DATA;

  const toShow = filtered.length > 0 ? filtered : ALL_POSTS_DATA;
  const sliced = toShow.slice(0, displayCount);

  container.style.opacity = '0.4';
  setTimeout(() => {
    container.innerHTML = sliced.map(post => {
      const badge = TYPE_BADGE[post.type] || TYPE_BADGE.pillar;
      return `
        <a href="/${post.category}/${post.slug}"
          class="group flex flex-col bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
          <div class="h-2 bg-gradient-to-r from-green-700 to-green-500"></div>
          <div class="p-5 flex-1">
            <div class="flex items-start justify-between gap-2 mb-3">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}">${badge.label}</span>
              <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">${post.situation}</span>
            </div>
            <h3 class="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-700 transition-colors mb-2 line-clamp-2">
              ${post.title}
            </h3>
          </div>
          <div class="px-5 pb-4 flex items-center justify-between text-xs text-gray-400">
            <span><i class="fas fa-clock mr-1"></i>${post.readTime}분 읽기</span>
            <span class="text-green-700 font-semibold group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </a>
      `;
    }).join('');
    container.style.opacity = '1';
  }, 150);

  // 더보기 버튼 표시/숨김
  const btn = document.getElementById('load-more-btn');
  if (btn) {
    btn.style.display = toShow.length > displayCount ? 'inline-flex' : 'none';
  }
}

function loadMorePosts() {
  displayCount += 3;
  renderSituationPosts();
}


// ─── FAQ 아코디언 ─────────────────────────────────────────────────────────────

function toggleFaq(index) {
  const answer = document.getElementById('faq-answer-' + index);
  const icon   = document.getElementById('faq-icon-'   + index);
  if (!answer || !icon) return;

  // faq-hidden / faq-visible 커스텀 클래스로 토글
  // (Tailwind CDN의 hidden 클래스 display:none !important 우회)
  const isOpen = answer.classList.contains('faq-visible');

  if (isOpen) {
    // 열려있음 → 닫기
    answer.classList.remove('faq-visible');
    answer.classList.add('faq-hidden');
    icon.style.transform = '';
  } else {
    // 닫혀있음 → 열기
    answer.classList.remove('faq-hidden');
    answer.classList.add('faq-visible');
    icon.style.transform = 'rotate(180deg)';
  }
}


// ─── 모바일 검색 토글 ─────────────────────────────────────────────────────────

function initMobileSearch() {
  const btn = document.getElementById('mobile-search-btn');
  const panel = document.getElementById('mobile-search-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      panel.querySelector('input')?.focus();
    }
  });
}


// ─── 목차(TOC) 자동 생성 ──────────────────────────────────────────────────────

function buildTOC() {
  const toc = document.getElementById('toc');
  if (!toc) return;

  // 위젯(#hp-calc-widget, #income-calc-widget) 내부 헤딩은 목차에서 제외
  const allHeadings = document.querySelectorAll('.prose-article h2, .prose-article h3');
  const headings = Array.from(allHeadings).filter(h => !h.closest('[id$="-widget"]'));
  if (headings.length === 0) return;

  toc.innerHTML = '';
  headings.forEach((heading, i) => {
    const id = `heading-${i}`;
    heading.id = id;
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.className = `toc-item block py-1 text-sm transition-colors ${
      heading.tagName === 'H2'
        ? 'text-gray-600 hover:text-primary-700 font-medium'
        : 'text-gray-400 hover:text-primary-600 pl-3 text-xs'
    }`;
    a.textContent = heading.textContent;
    a.addEventListener('click', e => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    toc.appendChild(a);
  });

  // 스크롤 위치에 따른 활성 표시
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
        const activeLink = toc.querySelector(`[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-60px 0px -80% 0px' });

  headings.forEach(h => observer.observe(h));
}


// ─── 공유 기능 ────────────────────────────────────────────────────────────────

// 진단 결과 카카오톡 공유
function shareDiagnosisKakao() {
  const url = location.origin + '/';

  // 결과에서 등급/점수/부족분 읽기
  const resultDiv  = document.querySelector('#diagnosis-result .text-center[data-grade]');
  const scoreEl    = document.querySelector('#diagnosis-result .text-3xl');

  const grade      = resultDiv  ? resultDiv.dataset.grade     : '';
  const score      = scoreEl    ? scoreEl.textContent.trim()  : '';
  const shortfall  = resultDiv  ? resultDiv.dataset.shortfall : '0';

  // 등급별 이모지·문구
  const gradeEmoji = { A:'✅', B:'🟡', C:'⚠️', D:'🚨', F:'🆘' };
  const emoji = gradeEmoji[grade] || '📊';

  let shareText = `[노후자금 긴급 진단]\n`;
  shareText += `${emoji} 내 노후 준비 상태: ${grade ? `'${grade}등급'` : `${score}점`}\n`;
  if (shortfall && Number(shortfall) > 0) {
    shareText += `국민연금만으로는 매월 ${Number(shortfall).toLocaleString()}만원 부족합니다.\n`;
  }
  shareText += `지금 1분 만에 내 노후 생존율을 확인해 보세요!\n👉 ${url}`;

  // Web Share API (모바일)
  if (navigator.share) {
    navigator.share({
      title: '노후자금 충분지수 진단 — 내 노후는 몇 점?',
      text: shareText,
      url: url
    }).catch(function(err) {
      if (err && err.name !== 'AbortError') {
        _copyToClipboard(shareText);
        showToast('링크가 복사됐어요! 카카오톡에 붙여넣기해서 공유하세요 📋');
      }
    });
    return;
  }

  // 데스크탑 fallback — 클립보드 복사
  _copyToClipboard(shareText);
  showToast('공유 문구가 복사됐어요! 카카오톡에 붙여넣기해서 공유하세요 📋');
}

function shareKakao() {
  const pageUrl   = location.href;
  const pageTitle = document.title;

  // ① Web Share API — 모바일 Chrome/Safari에서 카카오톡을 포함한 앱 공유 시트 열기
  if (navigator.share) {
    navigator.share({ title: pageTitle, text: pageTitle, url: pageUrl })
      .catch(function(err) {
        // 사용자가 취소하거나 실패 시 링크 복사 fallback
        if (err && err.name !== 'AbortError') {
          _copyToClipboard(pageUrl);
          showToast('링크가 복사됐어요! 카카오톡에 붙여넣기해서 공유하세요 📋');
        }
      });
    return;
  }

  // ② kakaolink 스킴 — SDK 없이 앱이 설치된 모바일에서만 작동
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    // kakaotalk://forward?msg= 는 앱 버전에 따라 미지원이므로
    // 대신 send.kakao.com 카카오 나눔 페이지로 리다이렉트 (앱 설치 여부와 무관하게 동작)
    const sharePageUrl = 'https://send.kakao.com/ko/share?url=' + encodeURIComponent(pageUrl)
      + '&text=' + encodeURIComponent(pageTitle);
    window.open(sharePageUrl, '_blank', 'noopener');
    return;
  }

  // ③ PC fallback — 링크 복사 + 안내
  _copyToClipboard(pageUrl);
  showToast('링크가 복사됐어요! 카카오톡에 붙여넣기해서 공유하세요 📋');
}

function _copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => _fallbackCopy(text));
  } else {
    _fallbackCopy(text);
  }
}

function _fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function copyLink() {
  navigator.clipboard.writeText(location.href).then(() => {
    showToast('링크가 복사되었습니다! ✓');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = location.href;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('링크가 복사되었습니다! ✓');
  });
}


// ─── 토스트 메시지 ────────────────────────────────────────────────────────────

function showToast(message, duration = 2500) {
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-msg';
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-xl z-50 fade-in-up';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}


// ─── 주택연금 월지급금 계산기 ─────────────────────────────────────────────────
/**
 * 한국주택금융공사(HF) 공식 월지급금 일람표 (종신지급방식·정액형, 부부 중 연소자 나이 기준, 단위: 천원/월)
 *  - 일반주택·주거목적 오피스텔: HF '월지급금 일람표(엑셀)' 2026.6.1 신청접수분 시트, 55~90세 1세 단위 × 주택가격 1~12억(1억 단위).
 *    (일반주택·오피스텔의 일반형 금액은 HF 웹 '월지급금 예시'(2026.03.01 기준)와 전 구간 일치 확인)
 *  - 노인복지주택: HF 웹 '월지급금 예시'(2026.03.01 기준) 5세 단위(55·60·...·80세) 표. 사이 나이는 선형 보간한 근사값.
 *  - 출처: https://www.hf.go.kr/ko/sub03/sub03_01_01_02.do
 *  - 초기증액형·정기증가형은 정액형과의 비율이 연령·주택가격별로 달라 공식 값을 확인하지 못해 계산기에서 제외했습니다(공식 예상연금조회 안내).
 * 각 배열의 i번째 값 = 주택가격 (i+1)억원일 때 월지급금(천원).
 */
const HP_TABLE_GENERAL = {
  55:[156,312,468,624,780,936,1092,1248,1404,1560,1716,1872],
  56:[166,333,500,666,833,1000,1166,1333,1500,1666,1833,2000],
  57:[176,352,529,705,882,1058,1234,1411,1587,1764,1940,2116],
  58:[186,373,560,747,933,1120,1307,1494,1681,1867,2054,2241],
  59:[199,398,598,797,997,1196,1396,1595,1795,1994,2194,2393],
  60:[210,421,632,842,1053,1264,1475,1685,1896,2107,2318,2528],
  61:[218,436,655,873,1092,1310,1529,1747,1966,2184,2403,2621],
  62:[226,452,679,905,1131,1358,1584,1810,2037,2263,2489,2716],
  63:[235,470,705,940,1175,1410,1645,1880,2115,2350,2585,2820],
  64:[243,487,731,975,1219,1463,1707,1950,2194,2438,2682,2926],
  65:[252,505,758,1011,1264,1517,1770,2023,2276,2529,2782,3035],
  66:[262,525,788,1051,1314,1577,1840,2103,2366,2629,2892,3155],
  67:[273,546,819,1092,1365,1639,1912,2185,2458,2731,3004,3278],
  68:[284,568,852,1137,1421,1705,1990,2274,2558,2843,3127,3338],
  69:[295,591,887,1183,1479,1775,2071,2367,2662,2958,3254,3375],
  70:[307,615,923,1231,1539,1847,2155,2462,2770,3078,3386,3414],
  71:[320,641,962,1283,1604,1925,2246,2567,2888,3209,3456,3456],
  72:[334,669,1003,1338,1672,2007,2341,2676,3010,3345,3503,3503],
  73:[349,698,1048,1397,1746,2096,2445,2795,3144,3493,3553,3553],
  74:[364,729,1094,1459,1824,2189,2554,2919,3284,3607,3607,3607],
  75:[381,762,1143,1525,1906,2287,2669,3050,3431,3666,3666,3666],
  76:[398,797,1195,1594,1993,2391,2790,3188,3587,3731,3731,3731],
  77:[417,835,1252,1670,2087,2505,2923,3340,3758,3802,3802,3802],
  78:[437,875,1313,1751,2188,2626,3064,3502,3879,3879,3879,3879],
  79:[459,918,1378,1837,2296,2756,3215,3674,3965,3965,3965,3965],
  80:[483,966,1449,1932,2416,2899,3382,3865,4060,4060,4060,4060],
  81:[508,1016,1524,2033,2541,3049,3558,4066,4166,4166,4166,4166],
  82:[535,1071,1606,2142,2677,3213,3748,4284,4284,4284,4284,4284],
  83:[566,1132,1698,2264,2830,3396,3962,4416,4416,4416,4416,4416],
  84:[598,1197,1796,2395,2994,3593,4191,4565,4565,4565,4565,4565],
  85:[635,1270,1905,2540,3176,3811,4446,4734,4734,4734,4734,4734],
  86:[675,1351,2027,2703,3379,4055,4731,4927,4927,4927,4927,4927],
  87:[721,1442,2163,2884,3605,4326,5047,5150,5150,5150,5150,5150],
  88:[769,1539,2309,3079,3849,4618,5388,5408,5408,5408,5408,5408],
  89:[822,1644,2467,3289,4112,4934,5711,5711,5711,5711,5711,5711],
  90:[882,1764,2647,3529,4412,5294,6072,6072,6072,6072,6072,6072]
};

const HP_TABLE_OFFICETEL = {
  55:[112,225,338,451,564,677,790,903,1016,1128,1241,1354],
  56:[121,243,365,487,608,730,852,974,1095,1217,1339,1461],
  57:[129,259,389,518,648,778,907,1037,1167,1296,1426,1556],
  58:[138,276,414,552,691,829,967,1105,1244,1382,1520,1658],
  59:[148,297,445,594,742,891,1039,1188,1336,1485,1633,1782],
  60:[158,316,475,633,792,950,1109,1267,1426,1584,1742,1901],
  61:[165,330,495,661,826,991,1157,1322,1487,1653,1818,1983],
  62:[172,344,517,689,861,1034,1206,1378,1551,1723,1895,2068],
  63:[180,361,541,722,903,1083,1264,1444,1625,1806,1986,2167],
  64:[188,377,565,754,942,1131,1319,1508,1696,1885,2073,2262],
  65:[197,394,591,788,985,1183,1380,1577,1774,1971,2169,2366],
  66:[206,413,619,826,1033,1239,1446,1653,1859,2066,2273,2479],
  67:[216,432,649,865,1081,1298,1514,1731,1947,2163,2380,2596],
  68:[226,452,679,905,1132,1358,1585,1811,2037,2264,2490,2717],
  69:[237,474,712,949,1186,1424,1661,1899,2136,2373,2611,2848],
  70:[248,497,746,994,1243,1492,1741,1989,2238,2487,2735,2984],
  71:[261,522,783,1044,1305,1566,1827,2088,2349,2610,2871,3132],
  72:[274,549,823,1098,1372,1647,1921,2196,2470,2745,3019,3294],
  73:[288,577,865,1154,1442,1731,2019,2308,2596,2885,3173,3462],
  74:[303,606,909,1212,1516,1819,2122,2425,2728,3032,3335,3595],
  75:[319,638,957,1276,1596,1915,2234,2553,2872,3192,3511,3655],
  76:[336,672,1008,1344,1680,2016,2352,2688,3024,3360,3696,3720],
  77:[354,709,1063,1418,1772,2127,2481,2836,3190,3545,3791,3791],
  78:[374,748,1122,1496,1870,2244,2618,2992,3367,3741,3870,3870],
  79:[395,791,1186,1582,1978,2373,2769,3165,3560,3956,3956,3956],
  80:[418,836,1254,1672,2090,2508,2926,3344,3762,4052,4052,4052],
  81:[443,887,1330,1774,2217,2661,3104,3548,3991,4158,4158,4158],
  82:[470,940,1411,1881,2352,2822,3292,3763,4233,4276,4276,4276],
  83:[499,999,1499,1998,2498,2998,3497,3997,4408,4408,4408,4408],
  84:[532,1065,1597,2130,2662,3195,3727,4260,4558,4558,4558,4558],
  85:[568,1137,1706,2275,2844,3413,3982,4551,4727,4727,4727,4727],
  86:[609,1218,1828,2437,3047,3656,4265,4875,4921,4921,4921,4921],
  87:[654,1308,1962,2616,3270,3924,4578,5143,5143,5143,5143,5143],
  88:[701,1402,2104,2805,3507,4208,4909,5402,5402,5402,5402,5402],
  89:[754,1508,2262,3016,3770,4524,5278,5705,5705,5705,5705,5705],
  90:[813,1627,2441,3255,4069,4883,5697,6066,6066,6066,6066,6066]
};

const HP_TABLE_SENIOR_5Y = {
  55:[122,245,368,491,613,736,859,982,1104,1227,1350,1473],
  60:[170,341,512,682,853,1024,1195,1365,1536,1707,1877,2048],
  65:[211,422,633,844,1055,1266,1477,1688,1899,2110,2321,2532],
  70:[263,526,789,1052,1316,1579,1842,2105,2368,2632,2895,3158],
  75:[334,669,1004,1338,1673,2008,2343,2677,3012,3347,3658,3658],
  80:[434,869,1303,1738,2172,2607,3041,3476,3910,4054,4054,4054],
};

/** 연령 보간: 1세 단위 표는 그대로, 5세 단위 표는 선형 보간. exact=true이면 공식 표 값 그대로 */
function _hpRowForAge(type, age) {
  if (type !== 'senior') {
    const t = type === 'officetel' ? HP_TABLE_OFFICETEL : HP_TABLE_GENERAL;
    const a = Math.min(90, Math.max(55, Math.round(age)));
    return { row: t[a], exact: true };
  }
  const steps = [55, 60, 65, 70, 75, 80];
  const a = Math.min(80, Math.max(55, age));
  if (steps.indexOf(a) !== -1) return { row: HP_TABLE_SENIOR_5Y[a], exact: true };
  let lo = 55;
  for (let i = 0; i < steps.length - 1; i++) if (a >= steps[i] && a < steps[i + 1]) lo = steps[i];
  const hi = lo + 5, t = (a - lo) / 5;
  const row = HP_TABLE_SENIOR_5Y[lo].map(function (v, i) { return v + (HP_TABLE_SENIOR_5Y[hi][i] - v) * t; });
  return { row: row, exact: false };
}

/**
 * 월지급금 계산 (종신지급·정액형)
 * @param {number} priceManwon  주택 시세 (만원, 1억~12억)
 * @param {number} age          부부 중 연소자 나이 (55~90)
 * @param {string} houseType    'general'|'senior'|'officetel'
 * @returns {{ monthly: number, exact: boolean }}  monthly: 만원
 */
function calcHousingPension(priceManwon, age, houseType) {
  const r = _hpRowForAge(houseType, age);
  const priceEok = Math.min(12, Math.max(1, priceManwon / 10000));
  const lo = Math.floor(priceEok);
  const hi = Math.min(12, lo + 1);
  const t = priceEok - lo;
  const thousand = r.row[lo - 1] + (r.row[hi - 1] - r.row[lo - 1]) * t;
  // 보간 구간 '안에서' 월지급금 상한(꺾임)이 시작되면 선형 보간 오차가 커질 수 있음(양끝이 모두 상한이면 평평하므로 제외)
  const stepSlope = r.row[hi - 1] - r.row[lo - 1];
  const nearCap = t > 0 && hi > lo && stepSlope > 0 && stepSlope < r.row[0] * 0.98;
  return { monthly: Math.round(thousand) / 10, exact: r.exact && t === 0, nearCap: nearCap };
}

/** 만원 → 한글 표기 변환 */
function wonToKorean(manwon) {
  if (!manwon || manwon <= 0) return '';
  const eok  = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  const chun = Math.floor(rest / 1000);
  const baek = Math.floor((rest % 1000) / 100);

  let s = '';
  if (eok > 0)  s += eok  + '억';
  if (chun > 0) s += (s ? ' ' : '') + chun + '천만원';
  else if (baek > 0 && eok === 0) s += (s ? ' ' : '') + baek + '백만원';
  else if (s)   s += '원';
  else           s = manwon.toLocaleString() + '만원';

  // 억 단위만 있고 rest가 0이면 이미 '억원' 표기 필요
  // (위에서 chun/baek 없으면 s = eok+'억' 만 있는 상태 → '원' 추가)
  if (eok > 0 && rest === 0 && !s.includes('원')) s += '원';
  return s;
}

/** 주택가격 입력 시 한글 미리보기 */
function hpOnPriceInput() {
  const val = parseInt(document.getElementById('hp-price')?.value || '0');
  const el  = document.getElementById('hp-price-korean');
  if (el) el.textContent = val > 0 ? '→ ' + wonToKorean(val) : '';
}

/** 나이 입력 시 유효성 힌트 */
function hpOnAgeInput() {
  const age = parseInt(document.getElementById('hp-age')?.value || '0');
  // 실시간 피드백은 별도 표시 없음 (버튼 누를 때 검사)
}

/** 계산 실행 (종신지급·정액형, HF 공식 일람표 기준) */
function runHpCalc() {
  var priceManwon = parseInt(document.getElementById('hp-price').value || '0');
  var age         = parseInt(document.getElementById('hp-age').value || '0');
  var houseType   = document.getElementById('hp-house-type').value || 'general';

  if (!priceManwon || priceManwon < 10000) {
    showToast('주택 시세를 1억원(10,000만원) 이상으로 입력해 주세요. 공식 월지급금 일람표는 1억~12억원 범위입니다.');
    return;
  }
  if (priceManwon > 120000) {
    showToast('공식 일람표는 12억원까지입니다. 12억원 초과는 주택금융공사 예상연금조회로 확인해 주세요.');
    return;
  }
  if (!age || age < 55 || age > 90) {
    showToast('나이를 55~90세 사이로 입력해 주세요.');
    return;
  }
  if (houseType === 'senior' && age > 80) {
    showToast('노인복지주택은 공식 표가 55~80세까지만 제공됩니다. 81세 이상은 주택금융공사 예상연금조회로 확인해 주세요.');
    return;
  }

  var result = calcHousingPension(priceManwon, age, houseType);
  var monthly = result.monthly;
  var houseTypeLabels = { general: '일반주택', senior: '노인복지주택', officetel: '주거목적 오피스텔' };
  var houseTypeLabel = houseTypeLabels[houseType] || '일반주택';
  var priceKor = wonToKorean(priceManwon);
  var monthlyWon = Math.round(monthly * 10000);
  var yearlyAmt = (monthly * 12).toFixed(0);
  var total20yr = (monthly * 12 * 20).toFixed(0);

  var exactNote = result.exact
    ? '공식 일람표에 있는 값 그대로입니다.'
    : '입력하신 값이 공식표의 칸(1억원 단위, 노인복지주택은 5세 단위) 사이라서, 공식표 값을 직선으로 이어 계산한 <strong>근사값</strong>입니다.' +
      (result.nearCap ? ' 이 구간은 월지급금 상한에 걸려 있어 <strong>실제와 차이가 더 클 수 있습니다</strong>(공식 예상연금조회로 확인하세요).' : '');

  var preferentialNote = '';
  if (priceManwon < 25000) {
    preferentialNote = '<div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">' +
      '<p class="text-xs font-bold text-amber-700 mb-1"><i class="fas fa-star mr-1 text-amber-500"></i>우대형 주택연금 해당 여부를 확인해 보세요</p>' +
      '<p class="text-xs text-amber-600 leading-relaxed">부부 중 1명 이상이 기초연금 수급권자이고, 부부 합산 <strong>시가 2억 5천만원 미만 1주택</strong>이면 우대형을 신청할 수 있습니다. ' +
      '일반형보다 시가 1억 8천만원 이상~2억 5천만원 미만은 최대 약 20%, 1억 8천만원 미만은 최대 약 25% 더 받습니다(한국주택금융공사 안내). ' +
      '위 금액은 일반형 기준이므로 우대형 금액은 공식 예상연금조회로 확인하세요.</p>' +
      '</div>';
  }

  var resultEl = document.getElementById('hp-result');
  if (!resultEl) return;

  resultEl.innerHTML =
    '<div class="text-center mb-6">' +
      '<p class="text-xs text-gray-500 mb-1">' + houseTypeLabel + ' · ' + age + '세 · 종신지급 정액형(일반형)</p>' +
      '<p class="mb-2"><span id="hp-result-badge" data-exact="' + (result.exact ? '1' : '0') + '" class="inline-block text-xs font-bold px-2.5 py-1 rounded-full ' + (result.exact ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700') + '">' + (result.exact ? '공식 일람표 값 그대로' : '근사값 · 공식표 사이를 직선 보간') + '</span></p>' +
      '<div class="inline-flex flex-col items-center bg-blue-600 text-white rounded-2xl px-8 py-5 shadow-lg">' +
        '<span class="text-xs font-semibold text-blue-200 mb-1">' + (result.exact ? '월지급금' : '예상 월지급금 (근사값)') + '</span>' +
        '<span class="text-4xl font-extrabold tracking-tight">' + monthly.toFixed(1) + '<span class="text-xl ml-1">만원</span></span>' +
        '<span class="text-sm text-blue-100 mt-1">월 약 ' + monthlyWon.toLocaleString() + '원</span>' +
      '</div>' +
    '</div>' +
    '<div class="space-y-2.5 mb-5">' +
      '<div class="flex justify-between items-center py-2.5 px-4 bg-white rounded-xl border border-gray-100">' +
        '<span class="text-xs text-gray-500 flex items-center gap-1.5"><i class="fas fa-home text-blue-400"></i>주택 시세 (적용)</span>' +
        '<span class="font-bold text-gray-800 text-sm">' + priceKor + '</span>' +
      '</div>' +
      '<div class="flex justify-between items-center py-2.5 px-4 bg-white rounded-xl border border-gray-100">' +
        '<span class="text-xs text-gray-500 flex items-center gap-1.5"><i class="fas fa-user text-blue-400"></i>기준 나이 (연소자)</span>' +
        '<span class="font-bold text-gray-800 text-sm">' + age + '세</span>' +
      '</div>' +
    '</div>' +
    '<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">' +
      '<p class="text-xs font-bold text-blue-700 mb-1"><i class="fas fa-lightbulb mr-1"></i>종신지급 — 정액형</p>' +
      '<p class="text-xs text-blue-600 leading-relaxed">평생 같은 금액을 받는 기본 방식입니다. ' + exactNote + '</p>' +
      '<p class="text-xs text-blue-500 mt-1.5">초기증액형·정기증가형, 인출한도가 있는 방식은 금액이 달라지므로 <a href="https://www.hf.go.kr/ko/sub03/sub03_02_02.do" target="_blank" rel="noopener" class="underline font-semibold">공식 예상연금조회</a>에서 확인하세요.</p>' +
    '</div>' +
    '<div class="grid grid-cols-2 gap-2 mb-5">' +
      '<div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">' +
        '<p class="text-xs text-gray-500 mb-1">연간 수령액</p>' +
        '<p class="font-extrabold text-gray-800">' + yearlyAmt + '만원</p>' +
      '</div>' +
      '<div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">' +
        '<p class="text-xs text-gray-500 mb-1">20년 총수령액 (단순 곱, 참고)</p>' +
        '<p class="font-extrabold text-gray-800">' + total20yr + '만원</p>' +
      '</div>' +
    '</div>' +
    preferentialNote +
    '<button onclick="document.getElementById(\'hp-result\').classList.add(\'hidden\')" ' +
      'class="w-full py-2.5 border-2 border-blue-200 text-blue-600 hover:border-blue-400 font-semibold text-sm rounded-xl transition-colors">' +
      '<i class="fas fa-redo mr-1"></i> 다시 계산하기' +
    '</button>';

  resultEl.classList.remove('hidden');
  setTimeout(function() { resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
}

// ─── 읽기 진행바 ─────────────────────────────────────────────────────────────

function initReadingProgress() {
  const article = document.querySelector('.prose-article');
  if (!article) return;

  // 상단 진행바 생성
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#1a5c3e,#4ade80);width:0%;z-index:9999;transition:width 0.1s';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(100, (scrollTop / docHeight) * 100);
    bar.style.width = `${progress}%`;
  });
}


// ─── 소득인정액 계산기 ────────────────────────────────────────────────────────

/**
 * 2026년 기초연금 소득인정액 계산 기준
 * 기본재산액 공제: 대도시 1억 3,500만원 / 중소도시 8,500만원 / 농어촌 7,250만원
 * 금융재산 공제: 2,000만원
 * 소득환산율: 연 4% (월 4%/12)
 * 차량: 월 차량가액/12
 */
const IC_BASE_PROPERTY = { '대도시': 13500, '중소도시': 8500, '농어촌': 7250 }; // 만원
const IC_FINANCE_DEDUCTION = 2000; // 만원
const IC_PROPERTY_RATE = 0.04 / 12; // 월 환산율

// 2026년 선정기준액 (만원)
const IC_THRESHOLD = { single: 247, couple: 395.2 };
// 기초연금 기준연금액
const IC_BASE_PENSION = 34.97; // 만원 (349,700원)

/** 실시간 미리보기 (oninput 이벤트) */
function calcIncome() {
  const { incomeEval, assetEval, total } = _calcIC();
  const fmt = (v) => v > 0 ? v.toFixed(1) + '만원' : '0만원';

  const liveIncome = document.getElementById('ic-live-income');
  const liveAsset  = document.getElementById('ic-live-asset');
  const liveTotal  = document.getElementById('ic-live-total');
  if (liveIncome) liveIncome.textContent = fmt(incomeEval);
  if (liveAsset)  liveAsset.textContent  = fmt(assetEval);
  if (liveTotal)  liveTotal.textContent  = fmt(total);

  // 라디오 버튼 시각적 강조
  ['single','couple'].forEach(v => {
    const el = document.getElementById(`ic-${v}-label`);
    const radio = document.getElementById(`ic-${v}`);
    if (!el || !radio) return;
    if (radio.checked) {
      el.style.borderColor = '#166a47';
      el.style.background  = '#f0faf5';
    } else {
      el.style.borderColor = '#e5e7eb';
      el.style.background  = '#fff';
    }
  });
}

/** 핵심 계산 로직 */
function _calcIC() {
  const labor       = parseFloat(document.getElementById('ic-labor')?.value)        || 0;
  const otherIncome = parseFloat(document.getElementById('ic-other-income')?.value) || 0;
  const property    = parseFloat(document.getElementById('ic-property')?.value)     || 0;
  const finance     = parseFloat(document.getElementById('ic-finance')?.value)      || 0;
  const car         = parseFloat(document.getElementById('ic-car')?.value)          || 0;
  const region      = document.getElementById('ic-region')?.value || '대도시';
  const household   = document.querySelector('input[name="ic-household"]:checked')?.value || 'single';

  // 소득평가액 = (근로소득 - 110만원) × 70% + 기타소득  (단, 근로소득 ≤110만원이면 0)
  const laborDeducted = Math.max(0, labor - 110);
  const incomeEval    = laborDeducted * 0.7 + otherIncome;

  // 재산의 소득환산액
  const baseProperty  = IC_BASE_PROPERTY[region] || 13500;
  const propertyNet   = Math.max(0, property - baseProperty);   // 기본재산액 차감
  const financeNet    = Math.max(0, finance - IC_FINANCE_DEDUCTION); // 금융재산 2000만원 공제
  const carMonthly    = car / 12;                                // 차량 월 환산
  const assetEval     = (propertyNet + financeNet) * IC_PROPERTY_RATE + carMonthly;

  const total = incomeEval + assetEval;

  return { labor, otherIncome, property, finance, car, region, household,
           laborDeducted, incomeEval, assetEval, propertyNet, financeNet, carMonthly, total };
}

/** 결과 출력 */
function runIncomeCalc() {
  const d = _calcIC();
  const threshold = IC_THRESHOLD[d.household];
  const isEligible = d.total <= threshold;
  const gap = Math.abs(d.total - threshold);
  const pct = Math.min(100, Math.round((d.total / threshold) * 100));

  // 국민연금 감액 여부 (기준연금액 150% = 약 52.45만원)
  const pensionReduceThreshold = IC_BASE_PENSION * 1.5;

  const resultEl = document.getElementById('ic-result');
  if (!resultEl) return;

  const barColor    = isEligible ? '#059669' : '#dc2626';
  const bgColor     = isEligible ? '#ecfdf5' : '#fef2f2';
  const textColor   = isEligible ? '#065f46' : '#991b1b';
  const borderColor = isEligible ? '#6ee7b7' : '#fca5a5';

  // ① 소득평가액 상세
  var laborDetail = '';
  if (d.labor > 0) {
    laborDetail += '<div class="flex justify-between text-xs text-gray-500 pl-2">' +
      '<span>근로소득 (' + d.labor + '만원 - 110만원) × 70%</span>' +
      '<span>' + (d.laborDeducted * 0.7).toFixed(1) + '만원</span></div>';
  }
  if (d.otherIncome > 0) {
    laborDetail += '<div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">' +
      '<span>기타소득 (전액)</span>' +
      '<span>' + d.otherIncome.toFixed(1) + '만원</span></div>';
  }
  if (d.labor === 0 && d.otherIncome === 0) {
    laborDetail = '<p class="text-xs text-gray-400 pl-2">소득 입력값 없음 → 0원</p>';
  }

  // ② 재산환산액 상세
  var assetDetail = '';
  if (d.property > 0) {
    assetDetail += '<div class="flex justify-between text-xs text-gray-500 pl-2">' +
      '<span>일반재산 (' + d.property + '만원 - ' + IC_BASE_PROPERTY[d.region] + '만원) × 4%÷12</span>' +
      '<span>' + (d.propertyNet * IC_PROPERTY_RATE).toFixed(1) + '만원</span></div>';
  }
  if (d.finance > 0) {
    assetDetail += '<div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">' +
      '<span>금융재산 (' + d.finance + '만원 - 2,000만원) × 4%÷12</span>' +
      '<span>' + (d.financeNet * IC_PROPERTY_RATE).toFixed(1) + '만원</span></div>';
  }
  if (d.car > 0) {
    assetDetail += '<div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">' +
      '<span>차량 ' + d.car + '만원 ÷ 12개월</span>' +
      '<span>' + d.carMonthly.toFixed(1) + '만원</span></div>';
  }
  if (d.property === 0 && d.finance === 0 && d.car === 0) {
    assetDetail = '<p class="text-xs text-gray-400 pl-2">재산 입력값 없음 → 0원</p>';
  }

  // 감액 안내
  var pensionNote = '';
  if (d.total <= threshold) {
    pensionNote = '<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">' +
      '<p class="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">' +
        '<i class="fas fa-lightbulb text-blue-500"></i> 국민연금 수령자라면 확인하세요</p>' +
      '<p class="text-xs text-blue-600 leading-relaxed">국민연금을 월 <strong>' +
        pensionReduceThreshold.toFixed(1) + '만원(52만 4,550원)</strong> 이상 받으신다면 ' +
        '기초연금이 최대 50%까지 감액될 수 있습니다. 주민센터에 문의하세요.</p></div>';
  } else {
    pensionNote = '<div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">' +
      '<p class="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">' +
        '<i class="fas fa-lightbulb text-amber-500"></i> 줄일 수 있는 방법이 있습니다</p>' +
      '<ul class="text-xs text-amber-700 space-y-1 leading-relaxed">' +
        '<li>• 금융재산 중 <strong>생활비 목적 예금</strong>은 일부 공제 가능 (주민센터 확인)</li>' +
        '<li>• <strong>부채(대출)</strong>가 있으면 재산에서 차감 가능</li>' +
        '<li>• <strong>10년 이상 노후 차량</strong>은 일반재산 완화 규정 적용 가능 (2026년 개정)</li>' +
      '</ul></div>';
  }

  var gapText = isEligible
    ? '기준보다 ' + gap.toFixed(1) + '만원 낮음'
    : '기준보다 ' + gap.toFixed(1) + '만원 초과';
  var statusText = isEligible ? '수급 가능 가능성 높음' : '수급 어려울 수 있음';
  var iconName   = isEligible ? 'circle-check' : 'circle-xmark';

  resultEl.innerHTML =
    '<div class="rounded-xl px-5 py-4 mb-5 flex items-center gap-4" style="background:' + bgColor + '; border:1.5px solid ' + borderColor + '">' +
      '<div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background:' + barColor + '20">' +
        '<i class="fas fa-' + iconName + ' text-2xl" style="color:' + barColor + '"></i></div>' +
      '<div class="flex-1">' +
        '<p class="font-extrabold text-lg leading-tight" style="color:' + barColor + '">' + statusText + '</p>' +
        '<p class="text-sm mt-0.5" style="color:' + textColor + '">소득인정액 <strong>' + d.total.toFixed(1) + '만원</strong> vs 선정기준액 <strong>' + threshold + '만원</strong> (' + gapText + ')</p>' +
      '</div></div>' +
    '<div class="mb-5">' +
      '<div class="flex justify-between text-xs text-gray-500 mb-1.5"><span>내 소득인정액</span>' +
        '<span>' + d.total.toFixed(1) + '만원 / ' + threshold + '만원 (' + pct + '%)</span></div>' +
      '<div class="h-3 bg-gray-100 rounded-full overflow-hidden">' +
        '<div class="h-full rounded-full transition-all duration-700" style="width:' + Math.min(pct,100) + '%; background:' + barColor + '"></div></div>' +
      '<div class="flex justify-between text-xs mt-1"><span class="text-gray-400">0</span>' +
        '<span class="font-semibold" style="color:' + barColor + '">선정기준: ' + threshold + '만원</span></div></div>' +
    '<div class="bg-gray-50 rounded-xl p-4 mb-5">' +
      '<p class="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5"><i class="fas fa-list-ol text-gray-400"></i> 계산 상세 내역</p>' +
      '<div class="space-y-2.5 text-sm">' +
        '<div class="bg-white rounded-lg p-3 border border-gray-100">' +
          '<div class="flex justify-between items-center mb-2">' +
            '<span class="font-semibold text-gray-700 text-xs">① 소득평가액</span>' +
            '<span class="font-extrabold text-primary-700">' + d.incomeEval.toFixed(1) + '만원</span></div>' +
          laborDetail + '</div>' +
        '<div class="bg-white rounded-lg p-3 border border-gray-100">' +
          '<div class="flex justify-between items-center mb-2">' +
            '<span class="font-semibold text-gray-700 text-xs">② 재산의 소득환산액</span>' +
            '<span class="font-extrabold text-primary-700">' + d.assetEval.toFixed(1) + '만원</span></div>' +
          assetDetail + '</div>' +
        '<div class="flex justify-between items-center px-3 py-2.5 rounded-lg font-extrabold" style="background:' + bgColor + '">' +
          '<span class="text-sm" style="color:' + textColor + '">① + ② 소득인정액 합계</span>' +
          '<span class="text-base" style="color:' + barColor + '">' + d.total.toFixed(1) + '만원</span></div>' +
      '</div></div>' +
    pensionNote +
    '<div class="flex flex-col sm:flex-row gap-2.5">' +
      '<a href="https://www.bokjiro.go.kr" target="_blank" rel="noopener noreferrer" ' +
        'class="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-700 hover:bg-primary-600 text-white font-semibold text-sm rounded-xl transition-colors">' +
        '<i class="fas fa-arrow-right"></i> 복지로에서 정식 신청</a>' +
      '<button id="ic-reset-btn" ' +
        'class="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm rounded-xl transition-colors">' +
        '<i class="fas fa-redo"></i> 다시 계산하기</button>' +
    '</div>';

  resultEl.classList.remove('hidden');
  // 부드럽게 스크롤
  setTimeout(function() { resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);

  // 다시 계산하기 버튼 이벤트 바인딩
  var resetBtn = document.getElementById('ic-reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetIncomeCalc);
}

function resetIncomeCalc() {
  // 입력 초기화
  ['ic-labor','ic-other-income','ic-property','ic-finance','ic-car'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const regionEl = document.getElementById('ic-region');
  if (regionEl) regionEl.value = '대도시';
  const singleRadio = document.getElementById('ic-single');
  if (singleRadio) { singleRadio.checked = true; }

  // 결과 숨기기 & 라이브 초기화
  const resultEl = document.getElementById('ic-result');
  if (resultEl) resultEl.classList.add('hidden');

  ['ic-live-income','ic-live-asset','ic-live-total'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  calcIncome(); // 라디오 스타일 초기화
}


// ─── 초기화 ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  initMobileSearch();
  buildTOC();
  initReadingProgress();

  // 상황별 포스트 초기 렌더링 (홈 페이지)
  if (document.getElementById('situation-posts')) {
    renderSituationPosts();
  }

  // 소득인정액 계산기 초기화 (아티클 페이지)
  if (document.getElementById('income-calc-widget')) {
    calcIncome();
  }

  // 주택연금 가격 입력 이벤트 (oninput 속성 보조 - 이스케이프 우회)
  var hpPriceEl = document.getElementById('hp-price');
  if (hpPriceEl) {
    hpPriceEl.addEventListener('input', function() { hpOnPriceInput(); });
  }

  // ── FAQ 아코디언: onclick="toggleFaq(n)" 이 HTML에 직접 렌더링되므로
  // 이벤트 위임 불필요. 이중 실행 방지를 위해 위임 코드 제거.

  // ── 사이드바 "진단 시작하기" 버튼 — onclick="window.scrollTo(..." 이스케이프 우회
  // JSX SSR에서 onclick 속성 내 작은따옴표가 &#39; 로 이스케이프되어 미작동
  // → href="/" 링크로 동작하되, 부드러운 스크롤 대신 페이지 이동 사용
  var sidebarDiagBtns = document.querySelectorAll('a[href="/"].block.text-center');
  sidebarDiagBtns.forEach(function(btn) {
    // onclick 속성 제거 후 정상 href 이동으로 대체
    btn.removeAttribute('onclick');
  });

  // ── 메인 CTA 배너 "지금 진단하기" 버튼도 동일 처리
  var mainCtaBtns = document.querySelectorAll('a[href="#diagnosis-form"]');
  mainCtaBtns.forEach(function(btn) {
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ── 메인 노후자금 충분지수 CTA 버튼 (id="main-diag-cta-btn")
  // 메인 페이지에서는 스크롤 top, 다른 페이지에서는 메인 페이지로 이동
  var mainDiagBtn = document.getElementById('main-diag-cta-btn');
  if (mainDiagBtn) {
    mainDiagBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.href = '/';
      }
    });
  }

  // ── 카카오톡 공유 버튼 (id="kakao-share-btn") 이벤트 바인딩
  // onclick 속성 대신 addEventListener 사용하여 이스케이프 문제 우회
  var kakaoBtn = document.getElementById('kakao-share-btn');
  if (kakaoBtn) {
    kakaoBtn.addEventListener('click', function() { shareKakao(); });
  }

  // ── 재계산 버튼 이벤트 위임 (주택연금 계산기)
  var hpWidget = document.getElementById('hp-calc-widget');
  if (hpWidget) {
    hpWidget.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (btn && btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('runHpCalc') !== -1) {
        runHpCalc();
      }
    });
  }

  // ── 뉴스레터 구독 버튼 — 준비중 안내 처리
  var newsletterBtn = document.getElementById('newsletter-btn');
  var newsletterMsg = document.getElementById('newsletter-msg');
  var newsletterEmail = document.getElementById('newsletter-email');
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', function() {
      var email = newsletterEmail ? newsletterEmail.value.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (newsletterMsg) {
          newsletterMsg.textContent = '올바른 이메일 주소를 입력해 주세요.';
          newsletterMsg.style.color = '#fca5a5';
        }
        return;
      }
      // 현재 구독 시스템 준비중 안내
      newsletterBtn.disabled = true;
      newsletterBtn.textContent = '✓ 신청 완료';
      newsletterBtn.style.background = '#166a47';
      if (newsletterMsg) {
        newsletterMsg.textContent = '감사합니다! 뉴스레터 발송 시스템 준비 완료 후 발송드립니다.';
        newsletterMsg.style.color = '#86efac';
      }
      // GA4 이벤트
      if (typeof gtag === 'function') {
        gtag('event', 'newsletter_signup_attempt', { email_provided: true });
      }
    });
  }

  // ── 내부 링크 클릭 GA4 추적
  // Phase B: data-link-position, data-content-type 속성이 있으면 추가 파라미터 포함
  // 기존 링크(속성 없음): link_position='general', content_type='navigation'
  document.querySelectorAll('a[href^="/"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        var params = {
          link_url: link.getAttribute('href'),
          link_text: (link.textContent || '').trim().slice(0, 80),
          source_page: window.location.pathname,
          link_position: link.getAttribute('data-link-position') || 'general',
          content_type: link.getAttribute('data-content-type') || 'navigation'
        };
        gtag('event', 'internal_link_click', params);
      }
    });
  });

  // ── 계산기 완료 GA4 추적 (진단기)
  var diagBtn = document.getElementById('diagnosis-btn');
  if (diagBtn) {
    diagBtn.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'calculator_start', { calculator_name: 'retirement_diagnosis' });
      }
    });
  }
});
