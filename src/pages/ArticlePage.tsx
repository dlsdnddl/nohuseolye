import type { Post } from '../types'
import { AdSlot } from '../components/AdSlot'
import { posts } from '../data/posts'

interface ArticlePageProps {
  post: Post
}

export const ArticlePage = ({ post }: ArticlePageProps) => {
  const relatedPosts = post.relatedPosts
    ? post.relatedPosts.map(slug => posts.find(p => p.slug === slug)).filter(Boolean) as Post[]
    : []

  const breadcrumbs = [
    { name: '홈', url: '/' },
    { name: post.categoryLabel, url: `/${post.category}` },
    { name: post.title, url: `/${post.category}/${post.slug}` },
  ]

  // content에서 '이 글이 필요한 분' 섹션과 '3줄 요약' 섹션 추출
  const { targetLines, summaryLines, bodyContent } = parseContentSections(post.content)

  return (
    <div class="max-w-6xl mx-auto px-4 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ─── 메인 콘텐츠 ─── */}
        <main class="lg:col-span-2">

          {/* 브레드크럼 */}
          <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.url} class="flex items-center gap-2">
                {i < breadcrumbs.length - 1 ? (
                  <>
                    <a href={crumb.url} class="hover:text-primary-600 transition-colors">{crumb.name}</a>
                    <i class="fas fa-chevron-right text-xs"></i>
                  </>
                ) : (
                  <span class="text-gray-600 font-medium line-clamp-1">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>

          {/* 아티클 헤더 */}
          <header class="mb-8">
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-primary-100 text-primary-700">
                {post.categoryLabel}
              </span>
              <span class={`text-xs font-bold px-3 py-1 rounded-full ${
                post.type === 'pillar' ? 'bg-blue-100 text-blue-700' :
                post.type === 'comparison' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {post.type === 'pillar' ? '기둥글' : post.type === 'comparison' ? '비교분석' : '체크리스트'}
              </span>
              {post.situation && (
                <span class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">{post.situation}</span>
              )}
            </div>

            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span><i class="fas fa-calendar-alt mr-1"></i>최초 작성: {post.publishedAt}</span>
              <span><i class="fas fa-sync-alt mr-1"></i>최종 업데이트: {post.updatedAt}</span>
              <span><i class="fas fa-clock mr-1"></i>약 {post.readTime}분</span>
            </div>
          </header>

          {/* 이 글이 필요한 분 + 3줄 요약 */}
          <div class="bg-primary-50 border border-primary-100 rounded-2xl p-6 mb-8">
            {targetLines.length > 0 && (
              <>
                <h2 class="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <i class="fas fa-user-check"></i> 이 글이 필요한 분
                </h2>
                <ul class="space-y-2 text-sm text-gray-700 mb-5">
                  {targetLines.map((line, i) => (
                    <li key={i} class="flex items-start gap-2">
                      <span class="text-primary-500 mt-0.5 flex-shrink-0">✓</span>
                      <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {summaryLines.length > 0 && (
              <div class={targetLines.length > 0 ? 'border-t border-primary-100 pt-4' : ''}>
                <h3 class="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <i class="fas fa-bolt"></i> 3줄 핵심 요약
                </h3>
                <div class="space-y-2 text-sm text-gray-700">
                  {summaryLines.map((line, i) => (
                    <div key={i} class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 인아티클 광고 */}
          <AdSlot type="in-article" id="article-top-ad" className="mb-8" />

          {/* 본문 */}
          <article class="prose-article" dangerouslySetInnerHTML={{ __html: markdownToHtml(bodyContent) }} />

          {/* 본문 중간 CTA */}
          {relatedPosts.length > 0 && (
            <div class="my-8 p-5 bg-warm-50 border border-warm-200 rounded-xl">
              <p class="text-sm font-bold text-warm-600 mb-3">
                <i class="fas fa-link mr-1"></i> 함께 읽으면 좋은 글
              </p>
              <div class="space-y-2">
                {relatedPosts.slice(0, 2).map(related => (
                  <a
                    key={related.id}
                    href={`/${related.category}/${related.slug}`}
                    class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-primary-50 transition-colors group"
                  >
                    <i class="fas fa-arrow-right text-primary-500 text-sm group-hover:translate-x-1 transition-transform"></i>
                    <span class="text-sm font-medium text-gray-700 group-hover:text-primary-700">{related.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 인아티클 하단 광고 */}
          <AdSlot type="rectangle" id="article-bottom-ad" className="my-8" />

          {/* 공식 출처 */}
          {post.sources && post.sources.length > 0 && (
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
              <h3 class="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                <i class="fas fa-landmark text-gray-500"></i> 공식 출처 및 참고 자료
              </h3>
              <ul class="space-y-2">
                {post.sources.map(source => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                    >
                      <i class="fas fa-external-link-alt text-xs text-gray-400"></i>
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
              <p class="text-xs text-gray-400 mt-3">
                ※ 본 글의 모든 수치는 위 공식 자료를 기반으로 작성되었으며 참고용입니다.
              </p>
            </div>
          )}

          {/* 공유 버튼 */}
          <div class="border-t border-gray-100 pt-6 mb-8">
            <p class="text-sm font-semibold text-gray-600 mb-3">이 글이 도움이 됐다면 공유해 주세요</p>
            <div class="flex flex-wrap gap-3">
              <button
                onclick="shareKakao()"
                class="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold text-sm rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.82 5.47 4.58 6.96L5.5 21.5l4.32-2.89c.71.1 1.44.14 2.18.14 5.52 0 10-3.69 10-8.25S17.52 3 12 3z"/></svg>
                카카오톡 공유
              </button>
              <button
                onclick="copyLink()"
                class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
              >
                <i class="fas fa-link"></i> 링크 복사
              </button>
              <button
                onclick="window.print()"
                class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
              >
                <i class="fas fa-print"></i> 인쇄
              </button>
            </div>
          </div>

          {/* FAQ 아코디언 */}
          {post.faq && post.faq.length > 0 && (
            <section class="mb-8">
              <h2 class="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-question-circle text-primary-600"></i>
                자주 묻는 질문 (FAQ)
              </h2>
              <div class="space-y-3" id="faq-container">
                {post.faq.map((item, i) => (
                  <div key={i} class="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onclick={`toggleFaq(${i})`}
                      class="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span class="font-semibold text-gray-800 text-sm pr-4">
                        <span class="text-primary-600 font-bold mr-2">Q.</span>{item.question}
                      </span>
                      <i id={`faq-icon-${i}`} class="fas fa-chevron-down text-gray-400 flex-shrink-0 transition-transform text-sm"></i>
                    </button>
                    <div id={`faq-answer-${i}`} class="hidden px-5 pb-4 bg-gray-50">
                      <p class="text-sm text-gray-600 leading-relaxed pt-3">
                        <span class="text-primary-600 font-bold mr-2">A.</span>{item.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>

        {/* ─── 사이드바 ─── */}
        <aside class="hidden lg:block">
          <div class="sticky top-24 space-y-6">

            {/* 목차 */}
            <div class="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 class="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                <i class="fas fa-list text-primary-600"></i> 목차
              </h3>
              <nav class="space-y-2 text-sm" id="toc">
                <a href="#" class="block text-gray-500 hover:text-primary-600 transition-colors">글을 불러오는 중...</a>
              </nav>
            </div>

            {/* 사이드바 광고 */}
            <AdSlot type="rectangle" id="sidebar-ad" />

            {/* 관련 글 */}
            {relatedPosts.length > 0 && (
              <div class="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 class="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                  <i class="fas fa-layer-group text-primary-600"></i> 관련 글
                </h3>
                <div class="space-y-1">
                  {relatedPosts.map(related => (
                    <a
                      key={related.id}
                      href={`/${related.category}/${related.slug}`}
                      class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <i class="fas fa-angle-right text-primary-400 mt-0.5 text-xs flex-shrink-0"></i>
                      <span class="text-xs text-gray-600 group-hover:text-primary-700 leading-snug">{related.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 진단기 CTA */}
            <div class="bg-primary-700 rounded-2xl p-5 text-white">
              <p class="text-primary-300 text-xs font-semibold mb-2">🔍 무료 진단</p>
              <h4 class="font-bold mb-2 text-sm">내 노후자금 지금 충분한가요?</h4>
              <p class="text-primary-200 text-xs mb-4">1분 진단으로 확인하세요</p>
              <a
                href="/"
                onclick="window.scrollTo({top:0,behavior:'smooth'}); return false;"
                class="block text-center py-2.5 bg-white text-primary-800 font-bold text-sm rounded-xl hover:bg-primary-50 transition-colors"
              >
                진단 시작하기
              </a>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

// ─── content 섹션 파서 ──────────────────────────────────────────────────────
// content에서 '이 글이 필요한 분', '3줄 요약', 본문(body) 세 부분으로 분리
function parseContentSections(content: string) {
  const lines = content.split('\n')
  const targetLines: string[] = []
  const summaryLines: string[] = []
  const bodyLines: string[] = []

  type Section = 'none' | 'target' | 'summary' | 'body'
  let section: Section = 'none'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '## 이 글이 필요한 분') { section = 'target'; continue }
    if (trimmed === '## 3줄 요약') { section = 'summary'; continue }
    // 세 번째 ## 섹션부터 body
    if (/^## .+/.test(trimmed) && section !== 'none') { section = 'body' }

    if (section === 'target') {
      if (trimmed.startsWith('- ')) targetLines.push(trimmed.slice(2))
    } else if (section === 'summary') {
      const m = trimmed.match(/^\d+\.\s+(.+)/)
      if (m) summaryLines.push(m[1])
    } else if (section === 'body') {
      bodyLines.push(line)
    }
  }

  return {
    targetLines,
    summaryLines,
    bodyContent: bodyLines.join('\n'),
  }
}

// ─── 인라인 마크다운 (bold, 링크) ─────────────────────────────────────────
function inlineMarkdown(text: string): string {
  return text
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline hover:text-primary-800">$1</a>')
    .replace(/\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>')
}

// ─── 마크다운 → HTML 변환 (본문 전용) ─────────────────────────────────────
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []

  type Mode = 'none' | 'table' | 'ul' | 'ol' | 'p'
  let mode: Mode = 'none'
  let tableHasHeader = false

  const flushMode = () => {
    if (mode === 'table') { result.push('</tbody></table></div>') }
    else if (mode === 'ul') { result.push('</ul>') }
    else if (mode === 'ol') { result.push('</ol>') }
    else if (mode === 'p') { result.push('</p>') }
    mode = 'none'
    tableHasHeader = false
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // ── 빈 줄 ────────────────────────────────────────────────────────
    if (trimmed === '') {
      if (mode !== 'none') flushMode()
      continue
    }

    // ── H2 ──────────────────────────────────────────────────────────
    if (/^## .+/.test(trimmed)) {
      if (mode !== 'none') flushMode()
      const text = trimmed.slice(3)
      result.push(
        `<h2 class="text-xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b-2 border-primary-100">${inlineMarkdown(text)}</h2>`
      )
      continue
    }

    // ── H3 ──────────────────────────────────────────────────────────
    if (/^### .+/.test(trimmed)) {
      if (mode !== 'none') flushMode()
      const text = trimmed.slice(4)
      result.push(
        `<h3 class="text-base font-bold text-gray-800 mt-8 mb-3 flex items-center gap-2"><span class="w-1 h-5 bg-primary-500 rounded-full inline-block"></span>${inlineMarkdown(text)}</h3>`
      )
      continue
    }

    // ── 테이블 행 ────────────────────────────────────────────────────
    if (/^\|.+\|$/.test(trimmed)) {
      // 구분선 행 (|---|---| 형태) → 다음 행부터 tbody
      if (/^\|[\s\-\|:]+\|$/.test(trimmed)) {
        tableHasHeader = true
        continue
      }
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim())

      if (mode !== 'table') {
        if (mode !== 'none') flushMode()
        mode = 'table'
        result.push('<div class="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm"><table class="w-full text-sm">')
        result.push('<thead>')
        result.push(
          `<tr>${cells.map(c =>
            `<th class="px-4 py-3 text-left text-xs font-bold text-white bg-primary-700 first:rounded-tl-xl last:rounded-tr-xl">${inlineMarkdown(c)}</th>`
          ).join('')}</tr>`
        )
        result.push('</thead><tbody>')
        tableHasHeader = true
      } else {
        // tbody 행
        result.push(
          `<tr class="even:bg-gray-50 hover:bg-primary-50 transition-colors">${cells.map(c =>
            `<td class="px-4 py-3 text-sm text-gray-700 border-t border-gray-100">${inlineMarkdown(c)}</td>`
          ).join('')}</tr>`
        )
      }
      continue
    }

    // ── 위젯 태그 [[WIDGET:xxx]] ──────────────────────────────────────
    if (/^\[\[WIDGET:(.+)\]\]$/.test(trimmed)) {
      if (mode !== 'none') flushMode()
      const widgetId = trimmed.match(/^\[\[WIDGET:(.+)\]\]$/)![1]
      if (widgetId === 'income-calculator') {
        result.push(buildIncomeCalculatorWidget())
      }
      continue
    }

    // ── 인용구 ───────────────────────────────────────────────────────
    if (trimmed.startsWith('> ')) {
      if (mode !== 'none') flushMode()
      const text = trimmed.slice(2)
      result.push(
        `<blockquote class="border-l-4 border-primary-400 bg-primary-50 pl-4 pr-3 py-3 rounded-r-xl my-5 text-sm text-gray-600 leading-relaxed">${inlineMarkdown(text)}</blockquote>`
      )
      continue
    }

    // ── 체크리스트 항목 (- [ ]) ───────────────────────────────────────
    if (/^- \[[ x]\] /.test(trimmed)) {
      if (mode !== 'ul') {
        if (mode !== 'none') flushMode()
        mode = 'ul'
        result.push('<ul class="space-y-2 my-4">')
      }
      const checked = trimmed[3] === 'x'
      const text = trimmed.slice(6)
      result.push(
        `<li class="flex items-start gap-2 text-sm text-gray-700">
          <span class="flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 ${checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'} flex items-center justify-center">
            ${checked ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
          </span>
          <span>${inlineMarkdown(text)}</span>
        </li>`
      )
      continue
    }

    // ── 비정렬 목록 (- ) ─────────────────────────────────────────────
    if (/^- .+/.test(trimmed)) {
      if (mode !== 'ul') {
        if (mode !== 'none') flushMode()
        mode = 'ul'
        result.push('<ul class="space-y-2 my-4 pl-1">')
      }
      const text = trimmed.slice(2)
      result.push(
        `<li class="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
          <span class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-2"></span>
          <span>${inlineMarkdown(text)}</span>
        </li>`
      )
      continue
    }

    // ── 정렬 목록 (1. 2. 3.) ─────────────────────────────────────────
    const olMatch = trimmed.match(/^(\d+)\. (.+)/)
    if (olMatch) {
      if (mode !== 'ol') {
        if (mode !== 'none') flushMode()
        mode = 'ol'
        result.push('<ol class="space-y-2 my-4 pl-1">')
      }
      result.push(
        `<li class="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center mt-0.5">${olMatch[1]}</span>
          <span>${inlineMarkdown(olMatch[2])}</span>
        </li>`
      )
      continue
    }

    // ── 일반 단락 ────────────────────────────────────────────────────
    if (mode !== 'p') {
      if (mode !== 'none') flushMode()
      mode = 'p'
      result.push('<p class="text-gray-700 text-base leading-relaxed my-4">')
    }
    result.push(inlineMarkdown(trimmed))
  }

  if (mode !== 'none') flushMode()

  return result.join('\n')
}

// ─── 소득인정액 계산기 위젯 HTML ──────────────────────────────────────────
function buildIncomeCalculatorWidget(): string {
  return `
<div class="my-8 rounded-2xl border-2 border-primary-100 overflow-hidden shadow-md" id="income-calc-widget">

  <!-- 위젯 헤더 -->
  <div class="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4 flex items-center gap-3">
    <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      <i class="fas fa-calculator text-white text-base"></i>
    </div>
    <div>
      <p class="text-primary-200 text-xs font-semibold">2026 기준 · 무료 계산기</p>
      <h3 class="text-white font-extrabold text-base leading-tight">소득인정액 간편 계산기</h3>
    </div>
    <span class="ml-auto text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">참고용</span>
  </div>

  <!-- 입력 폼 -->
  <div class="bg-white px-6 py-6" id="ic-form">

    <!-- STEP 1: 소득 -->
    <div class="mb-5">
      <p class="text-xs font-extrabold text-primary-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">1</span>
        소득 입력
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">월 근로소득 <span class="text-gray-400 font-normal">(직장·사업 등)</span></label>
          <div class="relative">
            <input type="number" id="ic-labor" min="0" max="2000" placeholder="0"
              oninput="calcIncome()"
              class="w-full pl-3 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"/>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">110만원 공제 후 70% 반영</p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">월 기타소득 <span class="text-gray-400 font-normal">(임대·이자 등)</span></label>
          <div class="relative">
            <input type="number" id="ic-other-income" min="0" max="2000" placeholder="0"
              oninput="calcIncome()"
              class="w-full pl-3 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"/>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">전액 반영</p>
        </div>
      </div>
    </div>

    <!-- STEP 2: 재산 -->
    <div class="mb-5">
      <p class="text-xs font-extrabold text-primary-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">2</span>
        재산 입력
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">일반재산 <span class="text-gray-400 font-normal">(주택·토지 공시가)</span></label>
          <div class="relative">
            <input type="number" id="ic-property" min="0" max="200000" placeholder="0"
              oninput="calcIncome()"
              class="w-full pl-3 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"/>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">금융재산 <span class="text-gray-400 font-normal">(예금·주식 등)</span></label>
          <div class="relative">
            <input type="number" id="ic-finance" min="0" max="200000" placeholder="0"
              oninput="calcIncome()"
              class="w-full pl-3 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"/>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">2,000만원 공제 후 반영</p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">차량가액 <span class="text-gray-400 font-normal">(시가표준액)</span></label>
          <div class="relative">
            <input type="number" id="ic-car" min="0" max="10000" placeholder="0"
              oninput="calcIncome()"
              class="w-full pl-3 pr-12 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"/>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">전액 소득환산 (월 100%÷12)</p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">거주 지역</label>
          <select id="ic-region" onchange="calcIncome()"
            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all bg-white">
            <option value="대도시">대도시 (서울·광역시·특례시)</option>
            <option value="중소도시">중소도시 (그 외 시 지역)</option>
            <option value="농어촌">농어촌 (군 지역)</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">기본재산액 공제에 사용</p>
        </div>
      </div>
    </div>

    <!-- 가구 유형 -->
    <div class="mb-6">
      <p class="text-xs font-extrabold text-primary-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">3</span>
        가구 유형
      </p>
      <div class="flex gap-3">
        <label class="flex items-center gap-2 cursor-pointer flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-primary-300 transition-all has-checked:border-primary-500 has-checked:bg-primary-50" id="ic-single-label">
          <input type="radio" name="ic-household" value="single" id="ic-single" checked onchange="calcIncome()" class="accent-primary-600"/>
          <span class="text-sm font-semibold text-gray-700">단독가구</span>
          <span class="ml-auto text-xs text-gray-400">기준 247만원</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-primary-300 transition-all has-checked:border-primary-500 has-checked:bg-primary-50" id="ic-couple-label">
          <input type="radio" name="ic-household" value="couple" id="ic-couple" onchange="calcIncome()" class="accent-primary-600"/>
          <span class="text-sm font-semibold text-gray-700">부부가구</span>
          <span class="ml-auto text-xs text-gray-400">기준 395.2만원</span>
        </label>
      </div>
    </div>

    <!-- 실시간 계산 결과 미니 요약 -->
    <div id="ic-live" class="bg-gray-50 rounded-xl px-5 py-4 mb-5 transition-all">
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p class="text-gray-400 mb-1">소득평가액</p>
          <p class="font-extrabold text-gray-800 text-sm" id="ic-live-income">—</p>
        </div>
        <div class="border-x border-gray-200">
          <p class="text-gray-400 mb-1">재산환산액</p>
          <p class="font-extrabold text-gray-800 text-sm" id="ic-live-asset">—</p>
        </div>
        <div>
          <p class="text-gray-400 mb-1">소득인정액</p>
          <p class="font-extrabold text-primary-700 text-sm" id="ic-live-total">—</p>
        </div>
      </div>
    </div>

    <button onclick="runIncomeCalc()"
      class="w-full py-3.5 bg-primary-700 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
      <i class="fas fa-search-dollar"></i>
      기초연금 수급 가능 여부 확인하기
    </button>
  </div>

  <!-- 결과 패널 (초기 숨김) -->
  <div id="ic-result" class="hidden bg-white border-t-2 border-dashed border-gray-100 px-6 py-6">
    <!-- JS로 동적 렌더링 -->
  </div>

  <!-- 주의 문구 -->
  <div class="bg-amber-50 border-t border-amber-100 px-5 py-3 flex items-start gap-2">
    <i class="fas fa-info-circle text-amber-500 mt-0.5 flex-shrink-0 text-xs"></i>
    <p class="text-xs text-amber-700 leading-relaxed">
      이 계산기는 <strong>2026년 보건복지부 기준</strong>을 바탕으로 한 참고용 도구입니다. 실제 수급 여부는 재산 형태·부채·공제 등 세부 조건에 따라 달라질 수 있으므로, 정확한 확인은 주민센터 또는 <a href="https://www.bokjiro.go.kr" target="_blank" class="underline font-semibold">복지로</a>에서 받으세요.
    </p>
  </div>
</div>
`
}
