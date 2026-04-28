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
    const retirementAge = Math.max(65, 65 + Math.floor((65 - age) * 0.1));

    // 결과 HTML 생성
    result.innerHTML = buildResultHTML({
      score, gradeInfo, pension, monthlyExpense, shortfall, age, years
    });

    loading.classList.add('hidden');
    result.classList.remove('hidden');
    result.classList.add('fade-in-up');
  }, 1500);
}

function buildResultHTML({ score, gradeInfo, pension, monthlyExpense, shortfall, age, years }) {
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


// ─── 초기화 ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMobileSearch();
  buildTOC();
  initReadingProgress();

  // 상황별 포스트 초기 렌더링 (홈 페이지)
  if (document.getElementById('situation-posts')) {
    renderSituationPosts();
  }
});
