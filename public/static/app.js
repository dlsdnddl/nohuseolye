/* ══════════════════════════════════════════════
   노후설계 가이드 — 메인 JavaScript
   ══════════════════════════════════════════════ */

// ─── 노후자금 충분지수 진단기 ─────────────────────────────────────────────────

/**
 * 국민연금 예상 수령액 계산 (2026년 기준)
 * 공식: (A값 + B값) × P × 소득대체율보정계수
 * A값: 2026년 전체 가입자 평균소득 = 319만 3,511원 (보건복지부 고시)
 * 소득대체율: 2026년 43% 적용
 * 간략화 공식: (A + B) × P × 0.00215 (43% / 20년 = 2.15%/년 기준)
 */
function calcNationalPension(workYears, avgIncome) {
  const A = 319.3511; // 2026년 기준 전체 가입자 평균소득 (만원, 보건복지부 고시)
  const B = avgIncome;
  const P = workYears; // 가입기간(년)
  // 2026년 소득대체율 43% 기반 간략 산출식
  // 기준산식: (A+B)/2 × (P/20) × 0.43 를 만원 단위로 환산
  const base = ((A + B) / 2) * (P / 20) * 0.43;
  return Math.round(base * 10) / 10; // 소수점 1자리
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
      const monthlyAmt = Math.round(basePension * (1 - reductionRate / 100) * 10) / 10;
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
    const monthlyAmt = Math.round(basePension * (1 + increaseRate / 100) * 10) / 10;
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
 *   · 임의계속가입: 60세~64세 (65세 미만까지)
 *   · 실제 최대 납부 가능 나이: 64세 (만 64세 도달 시까지)
 * - 나이(age)를 반드시 전달받아 제도적 한계 내에서 계산
 */
function calcAdditionalYearsNeeded(currentYears, avgIncome, targetMonthly, age) {
  const A = 319.3511;
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
  // 최대 납부 가능 나이: 64세 (임의계속가입 포함, 65세 미만)
  const MAX_CONTRIBUTION_AGE = 64;
  const maxAdditionalByAge = Math.max(0, MAX_CONTRIBUTION_AGE - age); // 나이 기준 한계
  const maxAdditionalByRule = Math.max(0, 45 - currentYears);          // 45년 상한 기준
  const maxAdditional = Math.min(maxAdditionalByAge, maxAdditionalByRule); // 둘 중 작은 값

  // ③ 목표 달성에 필요한 이론적 납부 기간 역산
  // target = (A+B)/2 × (P/20) × 0.43  →  P = target × 20 / ((A+B)/2 × 0.43)
  const targetYearsRaw = (targetMonthly * 20) / (((A + B) / 2) * 0.43);
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
    maxContributeAge: Math.min(age + maxAdditional, MAX_CONTRIBUTION_AGE),
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
  }, 1500);
}

function buildResultHTML({ score, gradeInfo, pension, monthlyExpense, shortfall, age, years, optimalInfo, additionalInfo }) {
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (score / 100) * circumference;

  return `
    <div class="text-center mb-6">
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
        const progressPct = ai.neededAdditional > 0
          ? Math.round((ai.maxAdditionalYears / ai.neededAdditional) * 100)
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
            <p class="text-xs text-amber-500">목표 달성에 ${ai.neededAdditional}년 필요 / 실제 납부 가능 ${ai.maxAdditionalYears}년 (${Math.min(100,progressPct)}%)</p>
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
        위 수치는 <strong>국민연금공단 2026년 A값(319만원)·소득대체율(43%) 기준</strong>을 바탕으로 한 <strong>참고용 예상값</strong>입니다.
        실제 수령액은 납부 이력·소득 변동에 따라 달라집니다.
        정확한 금액은 <a href="https://www.nps.or.kr" target="_blank" class="underline font-semibold">국민연금공단 공식 홈페이지</a>에서 확인하세요.
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
const ALL_POSTS_DATA = [
  { id: '1', slug: 'national-pension-amount-calculation', situation: '은퇴 5년 전', type: 'pillar',     title: '국민연금 수령액 2026 완벽 계산법 — A값 319만원 기준', category: 'pension-asset', readTime: 8 },
  { id: '2', slug: 'housing-pension-calculation',         situation: '은퇴 5년 전', type: 'comparison', title: '주택연금 계산기 2026 — 3월부터 3.13% 인상, 내 집으로 얼마?', category: 'pension-asset', readTime: 9 },
  { id: '3', slug: 'basic-pension-eligibility',           situation: '은퇴 후 생활비 걱정될 때', type: 'checklist', title: '기초연금 자격조건 2026 — 월 최대 34만 9,700원', category: 'pension-asset', readTime: 7 },
  { id: '4', slug: 'long-term-care-grade-application',    situation: '부모님 돌봄이 필요할 때',   type: 'pillar',     title: '장기요양등급 신청 방법 2026 총정리 — 재가급여 한도 대폭 인상', category: 'care', readTime: 10 },
  { id: '5', slug: 'retirement-5years-checklist',         situation: '은퇴 5년 전', type: 'checklist', title: '은퇴 5년 전 반드시 해야 할 7가지 체크리스트 (2026 최신)', category: 'pension-asset', readTime: 7 },
  { id: '6', slug: 'medical-expense-support-parents',     situation: '부모님 병원비 걱정될 때',   type: 'comparison', title: '부모님 병원비 지원제도 2026 — 몰라서 못 받는 5가지', category: 'care', readTime: 9 },
];

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
  const answer = document.getElementById(`faq-answer-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);
  if (!answer || !icon) return;

  const isOpen = !answer.classList.contains('hidden');
  answer.classList.toggle('hidden', isOpen);
  icon.style.transform = isOpen ? '' : 'rotate(180deg)';
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

  const headings = document.querySelectorAll('.prose-article h2, .prose-article h3');
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

function shareKakao() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const pageUrl  = location.href;
  const pageTitle = document.title;

  if (isMobile) {
    // ── 모바일: 카카오톡 앱 공유 인텐트 (앱 키 불필요)
    // Android: 카카오톡 intent URL
    // iOS: 카카오톡 앱이 설치된 경우 딥링크로 공유창 열기
    const kakaoScheme = 'kakaotalk://forward?msg=' + encodeURIComponent(pageTitle + '\n' + pageUrl);
    const anchor = document.createElement('a');
    anchor.href = kakaoScheme;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // 앱이 없거나 실패 시 1초 후 링크 복사 fallback
    setTimeout(() => {
      // 페이지가 이동하지 않았으면 복사로 대체
      _copyToClipboard(pageUrl);
      showToast('카카오톡 앱이 없으면 링크를 복사해 카카오톡에 붙여넣기하세요 📋');
    }, 1200);
  } else {
    // ── PC: Web Share API 지원 시 사용 (Chrome 등)
    if (navigator.share) {
      navigator.share({ title: pageTitle, url: pageUrl }).catch(() => {});
    } else {
      // Web Share 미지원 → 링크 복사 + 안내
      _copyToClipboard(pageUrl);
      showToast('링크가 복사됐어요! 카카오톡에 붙여넣기해서 공유하세요 📋');
    }
  }
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

  resultEl.innerHTML = `
    <!-- 최종 판정 배너 -->
    <div class="rounded-xl px-5 py-4 mb-5 flex items-center gap-4" style="background:${bgColor}; border: 1.5px solid ${borderColor}">
      <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background:${barColor}20">
        <i class="fas fa-${isEligible ? 'circle-check' : 'circle-xmark'} text-2xl" style="color:${barColor}"></i>
      </div>
      <div class="flex-1">
        <p class="font-extrabold text-lg leading-tight" style="color:${barColor}">
          ${isEligible ? '수급 가능 가능성 높음' : '수급 어려울 수 있음'}
        </p>
        <p class="text-sm mt-0.5" style="color:${textColor}">
          소득인정액 <strong>${d.total.toFixed(1)}만원</strong> vs 선정기준액 <strong>${threshold}만원</strong>
          (${isEligible ? `기준보다 ${gap.toFixed(1)}만원 낮음` : `기준보다 ${gap.toFixed(1)}만원 초과`})
        </p>
      </div>
    </div>

    <!-- 진행 바 -->
    <div class="mb-5">
      <div class="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>내 소득인정액</span>
        <span>${d.total.toFixed(1)}만원 / ${threshold}만원 (${pct}%)</span>
      </div>
      <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-700"
          style="width:${Math.min(pct,100)}%; background:${barColor}"></div>
      </div>
      <div class="flex justify-between text-xs mt-1">
        <span class="text-gray-400">0</span>
        <span class="font-semibold" style="color:${barColor}">선정기준: ${threshold}만원</span>
      </div>
    </div>

    <!-- 계산 내역 -->
    <div class="bg-gray-50 rounded-xl p-4 mb-5">
      <p class="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
        <i class="fas fa-list-ol text-gray-400"></i> 계산 상세 내역
      </p>
      <div class="space-y-2.5 text-sm">

        <!-- 소득평가액 -->
        <div class="bg-white rounded-lg p-3 border border-gray-100">
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-gray-700 text-xs">① 소득평가액</span>
            <span class="font-extrabold text-primary-700">${d.incomeEval.toFixed(1)}만원</span>
          </div>
          ${d.labor > 0 ? `
          <div class="flex justify-between text-xs text-gray-500 pl-2">
            <span>근로소득 (${d.labor}만원 - 110만원) × 70%</span>
            <span>${(d.laborDeducted * 0.7).toFixed(1)}만원</span>
          </div>` : ''}
          ${d.otherIncome > 0 ? `
          <div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">
            <span>기타소득 (전액)</span>
            <span>${d.otherIncome.toFixed(1)}만원</span>
          </div>` : ''}
          ${d.labor === 0 && d.otherIncome === 0 ? `
          <p class="text-xs text-gray-400 pl-2">소득 입력값 없음 → 0원</p>` : ''}
        </div>

        <!-- 재산의 소득환산액 -->
        <div class="bg-white rounded-lg p-3 border border-gray-100">
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-gray-700 text-xs">② 재산의 소득환산액</span>
            <span class="font-extrabold text-primary-700">${d.assetEval.toFixed(1)}만원</span>
          </div>
          ${d.property > 0 ? `
          <div class="flex justify-between text-xs text-gray-500 pl-2">
            <span>일반재산 (${d.property}만원 - 기본재산액 ${IC_BASE_PROPERTY[d.region]}만원) × 4%÷12</span>
            <span>${(d.propertyNet * IC_PROPERTY_RATE).toFixed(1)}만원</span>
          </div>` : ''}
          ${d.finance > 0 ? `
          <div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">
            <span>금융재산 (${d.finance}만원 - 2,000만원 공제) × 4%÷12</span>
            <span>${(d.financeNet * IC_PROPERTY_RATE).toFixed(1)}만원</span>
          </div>` : ''}
          ${d.car > 0 ? `
          <div class="flex justify-between text-xs text-gray-500 pl-2 mt-1">
            <span>차량 ${d.car}만원 ÷ 12개월</span>
            <span>${d.carMonthly.toFixed(1)}만원</span>
          </div>` : ''}
          ${d.property === 0 && d.finance === 0 && d.car === 0 ? `
          <p class="text-xs text-gray-400 pl-2">재산 입력값 없음 → 0원</p>` : ''}
        </div>

        <!-- 합계 -->
        <div class="flex justify-between items-center px-3 py-2.5 rounded-lg font-extrabold" style="background:${bgColor}">
          <span class="text-sm" style="color:${textColor}">① + ② 소득인정액 합계</span>
          <span class="text-base" style="color:${barColor}">${d.total.toFixed(1)}만원</span>
        </div>
      </div>
    </div>

    <!-- 국민연금 감액 안내 -->
    ${d.total <= threshold ? `
    <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
      <p class="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
        <i class="fas fa-lightbulb text-blue-500"></i> 국민연금 수령자라면 확인하세요
      </p>
      <p class="text-xs text-blue-600 leading-relaxed">
        국민연금을 월 <strong>${pensionReduceThreshold.toFixed(1)}만원(52만 4,550원)</strong> 이상 받으신다면
        기초연금이 최대 50%까지 감액될 수 있습니다. 국민연금 수령액을 확인 후 주민센터에 문의하세요.
      </p>
    </div>` : `
    <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
      <p class="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
        <i class="fas fa-lightbulb text-amber-500"></i> 줄일 수 있는 방법이 있습니다
      </p>
      <ul class="text-xs text-amber-700 space-y-1 leading-relaxed">
        <li>• 금융재산 중 <strong>생활비 목적 예금</strong>은 일부 공제 가능 (주민센터 확인)</li>
        <li>• <strong>부채(대출)</strong>가 있으면 재산에서 차감 가능</li>
        <li>• <strong>10년 이상 노후 차량</strong>은 일반재산 완화 규정 적용 가능 (2026년 개정)</li>
      </ul>
    </div>`}

    <!-- 액션 버튼 -->
    <div class="flex flex-col sm:flex-row gap-2.5">
      <a href="https://www.bokjiro.go.kr" target="_blank" rel="noopener noreferrer"
        class="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-700 hover:bg-primary-600 text-white font-semibold text-sm rounded-xl transition-colors">
        <i class="fas fa-arrow-right"></i> 복지로에서 정식 신청
      </a>
      <button onclick="resetIncomeCalc()"
        class="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm rounded-xl transition-colors">
        <i class="fas fa-redo"></i> 다시 계산하기
      </button>
    </div>
  `;

  resultEl.classList.remove('hidden');
  // 부드럽게 스크롤
  setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
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

document.addEventListener('DOMContentLoaded', () => {
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
});
