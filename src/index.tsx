import { Hono } from 'hono'
import { renderer } from './renderer'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HeroDiagnosis } from './components/HeroDiagnosis'
import { QuickLinks } from './components/QuickLinks'
import { ContentCuration } from './components/ContentCuration'
import { AdSlot } from './components/AdSlot'
import { PostCard } from './components/PostCard'
import { ArticlePage } from './pages/ArticlePage'
import { CategoryPage } from './pages/CategoryPage'
import { ReviewIndex, ReviewDetail } from './pages/ReviewPage'
import { posts, indexablePosts, getPostBySlug, isPreview, latestUpdate } from './data/posts'
import { categories, getCategory } from './data/categories'
import { verificationSheets } from './generated/content'
import { SITE_URL, SITE_NAME, articleJsonLd, postPath, postCanonical, xmlEscape, toRfc822 } from './lib/seo'
import { isNewsletterConfigured, isValidEmail, submitNewsletterEmail } from './lib/newsletter'

type Bindings = { PREVIEW_PASSWORD?: string }
const app = new Hono<{ Bindings: Bindings }>()

// ─── 미리보기 빌드 전용: 전 페이지 noindex 헤더 + 간단한 비밀번호 보호(Basic Auth) ───────────
// 운영 빌드(BUILD_MODE=production)에서는 이 블록이 실행되지 않습니다.
if (isPreview) {
  app.use('*', async (c, next) => {
    const expected = c.env?.PREVIEW_PASSWORD
    const header = c.req.header('authorization') || ''
    let ok = false
    if (expected && header.startsWith('Basic ')) {
      try {
        const given = atob(header.slice(6)).split(':').slice(1).join(':')
        // 길이가 달라도 전체 비교(타이밍 편차 최소화)
        let diff = given.length ^ expected.length
        for (let i = 0; i < Math.max(given.length, expected.length); i++) diff |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0)
        ok = diff === 0
      } catch { ok = false }
    }
    if (!ok) {
      // 비밀번호가 설정되지 않은 경우에도 접근 거부(fail-closed)
      return new Response('Unauthorized — LuckyU preview', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="LuckyU Preview", charset="UTF-8"', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
      })
    }
    await next()
    c.res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    c.res.headers.set('Cache-Control', 'no-store')
  })
}

app.use(renderer)

// ─── www 리다이렉트 (SEO: 중복 도메인 방지) ────────────────────────────────────
// luckyu.co.kr → www.luckyu.co.kr 301 영구 리다이렉트
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host === 'luckyu.co.kr') {
    const url = new URL(c.req.url)
    url.host = 'www.luckyu.co.kr'
    return c.redirect(url.toString(), 301)
  }
  await next()
})

// ─── 주소 끝 '/' 정리 (SEO: 같은 글의 주소를 하나로) ───────────────────────────
// /care/ → /care 처럼 끝의 '/'를 뗀 주소로 301 이동. 홈('/')은 그대로.
app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    const cleanPath = url.pathname.replace(/\/+$/, '') || '/'
    return c.redirect(cleanPath + url.search, 301)
  }
  await next()
})

// ─── 404 페이지 (실제 HTTP 404 + noindex) ──────────────────────────────────────
const renderNotFound = (c: any) => {
  c.status(404)
  c.header('X-Robots-Tag', 'noindex, nofollow')
  return c.render(
    <>
      <Header />
      <main class="max-w-6xl mx-auto px-4 py-20 text-center">
        <i class="fas fa-search text-5xl text-gray-200 mb-6"></i>
        <h1 class="text-2xl font-bold text-gray-700 mb-2">페이지를 찾을 수 없습니다</h1>
        <p class="text-gray-400 mb-8">요청하신 글이 존재하지 않거나 이동되었습니다.</p>
        <a href="/" class="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-600">
          <i class="fas fa-home"></i> 홈으로 돌아가기
        </a>
      </main>
      <Footer />
    </>,
    { title: '페이지 없음', noindex: true }
  )
}

// ─── 구 티스토리 URL 410 Gone 처리 ────────────────────────────────────────────
// 티스토리 시절 글 URL 패턴: /숫자 (예: /1, /2, /3, /100 등)
// 404 대신 410으로 응답 → 구글이 색인에서 더 빠르게 제거함
app.get('/:id{[0-9]+}', (c) => {
  return c.text('Gone', 410)
})

// ─── 홈 ───────────────────────────────────────────────────────────────────────
app.get('/', (c) => {
  const SITE_URL = 'https://www.luckyu.co.kr'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '노후설계 가이드',
    description: '4070 세대를 위한 연금·복지·노후 현금흐름 설계 정보 플랫폼',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return c.render(
    <>
      <Header />
      <main>
        {/* Hero - 진단기 */}
        <HeroDiagnosis />

        {/* 퀵링크 */}
        <QuickLinks />

        {/* 콘텐츠 큐레이션 */}
        <ContentCuration posts={posts} />

        {/* 하단 광고 — 콘텐츠 다 읽은 후 1개만 */}
        <div class="max-w-6xl mx-auto px-4 py-8">
          {/* slotId: 애드센스 '노후설계-홈하단' 광고 단위 ID 입력 */}
          <AdSlot type="leaderboard" id="home-bottom-ad" slotId="9401725799" />
        </div>
      </main>
      <Footer />
    </>,
    { title: null, description: null, jsonLd, canonicalUrl: SITE_URL }
  )
})

// ─── 미리보기 전용 검토 화면 (/_review) — 운영 빌드에는 등록되지 않음 ──────────────────
if (isPreview) {
  app.get('/_review', (c) => c.render(<><Header /><ReviewIndex posts={posts} sheets={verificationSheets} /><Footer /></>, { title: '운영자 검토 목록', noindex: true }))
  app.get('/_review/:slug', (c) => {
    const post = getPostBySlug(c.req.param('slug'))
    if (!post) return renderNotFound(c)
    return c.render(<><Header /><ReviewDetail post={post} sheet={verificationSheets[post.slug]} /><Footer /></>, { title: `검토: ${post.title}`, noindex: true })
  })
}

// ─── 관리자 ────────────────────────────────────────────────────────────────────
// 인증 시스템/실데이터가 없는 정적 목업 화면이었으므로 운영에서는 비공개(404) 처리.
// (Cloudflare Pages는 Hosted 접근규칙을 적용할 수 없어, 공개 라우트 자체를 제거)
app.all('/admin', (c) => renderNotFound(c))
app.all('/admin/*', (c) => renderNotFound(c))

// ─── 뉴스레터 구독 신청 ────────────────────────────────────────────────────────
// 푸터 양식(app.js)에서 호출. 이메일을 Google 설문지로 전달해 연결된 스프레드시트에 쌓습니다.
app.post('/api/subscribe', async (c) => {
  c.header('X-Robots-Tag', 'noindex, nofollow')
  c.header('Cache-Control', 'no-store')
  // 다른 사이트에서 보낸 요청은 받지 않음
  const origin = c.req.header('origin')
  if (origin) {
    let originHost = ''
    try { originHost = new URL(origin).host } catch { originHost = '' }
    if (originHost !== (c.req.header('host') || '')) return c.json({ ok: false, error: 'forbidden' }, 403)
  }
  let data: any = null
  try { data = await c.req.json() } catch { data = null }
  const email = typeof data?.email === 'string' ? data.email.trim() : ''
  const page = typeof data?.page === 'string' ? data.page.slice(0, 200) : ''
  // 사람에게 보이지 않는 칸(website)이 채워져 있으면 자동 프로그램으로 보고 저장하지 않음
  if (typeof data?.website === 'string' && data.website !== '') return c.json({ ok: true })
  if (!isValidEmail(email)) return c.json({ ok: false, error: 'invalid_email' }, 400)
  if (!isNewsletterConfigured()) return c.json({ ok: false, error: 'not_configured' }, 503)
  try {
    const saved = await submitNewsletterEmail(email, page)
    if (!saved) return c.json({ ok: false, error: 'save_failed' }, 502)
  } catch {
    return c.json({ ok: false, error: 'save_failed' }, 502)
  }
  return c.json({ ok: true })
})

// ─── 준비 중 카테고리 (noindex) ────────────────────────────────────────────────
const comingSoonPage = (label: string) => (c: any) => {
  c.header('X-Robots-Tag', 'noindex, follow')
  return c.render(
  <>
    <Header />
    <main class="max-w-3xl mx-auto px-4 py-24 text-center">
      <div class="text-6xl mb-6">🚧</div>
      <h1 class="text-2xl font-bold text-gray-700 mb-3">{label} — 준비 중입니다</h1>
      <p class="text-gray-400 mb-8">더 좋은 정보로 곧 찾아오겠습니다. 지금은 <strong>연금·자산</strong> 섹션을 먼저 확인해보세요.</p>
      <a href="/" class="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-600">
        <i class="fas fa-home"></i> 홈으로
      </a>
    </main>
    <Footer />
  </>,
  { title: `${label} — 준비 중`, noindex: true }
  )
}

// ─── 카테고리 허브 (categories.ts 한 곳에서 관리) ──────────────────────────────────
//  open        → 공개 글 목록(+대표 글) 표시, canonical, sitemap 포함
//  coming-soon → noindex 안내 페이지 (미리보기 빌드에서는 검토용으로 목록 표시)
for (const cat of categories) {
  app.get(`/${cat.slug}`, (c) => {
    if (!isPreview && cat.state !== 'open') return comingSoonPage(cat.label)(c)
    const catPosts = posts.filter(p => p.category === cat.slug)
    const pinned = (cat.pinned ?? []).map(slug => getPostBySlug(slug)).filter(Boolean) as typeof posts
    const otherHubs = categories
      .filter(o => o.slug !== cat.slug && (isPreview || o.state === 'open'))
      .map(o => ({ slug: o.slug, label: o.label, intro: o.intro }))
    return c.render(
      <>
        <Header />
        <CategoryPage category={cat} posts={catPosts} pinned={pinned} otherHubs={otherHubs} preview={isPreview} />
        <Footer />
      </>,
      { title: cat.seoTitle, description: cat.seoDescription, canonicalUrl: `${SITE_URL}/${cat.slug}` }
    )
  })
}

// ─── 아티클 상세 (모든 카테고리 공통: /:category/:slug) ───────────────────────────────
// - 글은 자신이 속한 카테고리 URL에서만 200 (다른 카테고리 경로는 301 → 정규 URL: 중복 콘텐츠 방지)
// - 비공개(draft/review)·미오픈 카테고리 글은 운영 번들에 없으므로 404
app.get('/:category/:slug', (c) => {
  const category = c.req.param('category')
  const slug = c.req.param('slug')
  if (!getCategory(category)) return renderNotFound(c)

  const post = getPostBySlug(slug)
  if (!post) return renderNotFound(c)
  if (post.category !== category) return c.redirect(postPath(post), 301)

  const noindex = post.noindex === true
  if (noindex) c.header('X-Robots-Tag', 'noindex, follow')

  return c.render(
    <>
      <Header />
      <ArticlePage post={post} preview={isPreview} />
      <Footer />
    </>,
    {
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.description,
      jsonLd: articleJsonLd(post),
      canonicalUrl: postCanonical(post),
      ogImage: post.image?.src,
      ogType: 'article',
      noindex,
    }
  )
})

// ─── 정보 페이지 (애드센스·신뢰도용) ─────────────────────────────────────────────
// ─── 사이트 검색 ───────────────────────────────────────────────────────────────
// 헤더 검색창(GET /search?q=)과 홈의 JSON-LD SearchAction이 가리키는 주소.
// 공개 글의 제목·설명·태그·본문에서 찾습니다. 검색 결과 페이지는 색인하지 않습니다.
app.get('/search', (c) => {
  const q = (c.req.query('q') || '').trim().slice(0, 50)
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const results = words.length === 0 ? [] : posts
    .map(p => {
      const title = p.title.toLowerCase()
      const meta = `${p.description} ${(p.tags || []).join(' ')}`.toLowerCase()
      const body = p.content.toLowerCase()
      if (!words.every(w => title.includes(w) || meta.includes(w) || body.includes(w))) return null
      const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (meta.includes(w) ? 2 : 0) + (body.includes(w) ? 1 : 0), 0)
      return { post: p, score }
    })
    .filter((r): r is { post: (typeof posts)[number]; score: number } => r !== null)
    .sort((a, b) => b.score - a.score || b.post.updatedAt.localeCompare(a.post.updatedAt))
    .map(r => r.post)

  c.header('X-Robots-Tag', 'noindex, follow')
  return c.render(
    <>
      <Header />
      <main class="max-w-6xl mx-auto px-4 py-10">
        <h1 class="text-2xl font-extrabold text-gray-900 mb-2">
          {q ? <>'{q}' 검색 결과</> : '검색'}
        </h1>
        <p class="text-sm text-gray-500 mb-6">
          {q ? `${results.length}개의 글을 찾았습니다.` : '찾고 싶은 내용을 입력해 주세요.'}
        </p>
        <form action="/search" method="get" role="search" class="relative max-w-xl mb-8">
          <input
            type="search"
            name="q"
            value={q}
            aria-label="사이트 검색"
            placeholder="예: 국민연금, 기초연금, 주택연금"
            class="w-full pl-10 pr-24 py-3 text-base border border-gray-300 rounded-full bg-white focus:outline-none focus:border-primary-400"
          />
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <button type="submit" class="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-full transition-colors">
            검색
          </button>
        </form>
        {results.length > 0 ? (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map(post => <PostCard key={post.id} post={post} variant="default" />)}
          </div>
        ) : q ? (
          <div class="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p class="text-gray-700 font-semibold mb-2">찾는 글이 없습니다.</p>
            <p class="text-sm text-gray-500 mb-5">검색어를 짧게 바꾸거나 아래 분야에서 찾아보세요.</p>
            <div class="flex flex-wrap justify-center gap-2">
              {categories.filter(cat => cat.state === 'open' || isPreview).map(cat => (
                <a href={`/${cat.slug}`} class="px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors">{cat.label}</a>
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </>,
    { title: q ? `'${q}' 검색 결과` : '검색', noindex: true }
  )
})

app.get('/about', (c) => {
  return c.render(
    <>
      <Header />
      <main class="max-w-3xl mx-auto px-4 py-16">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <a href="/" class="hover:text-primary-600">홈</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-700">운영자 소개</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-8">운영자 소개</h1>
        <div class="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            <strong>노후설계 가이드</strong>는 4070 세대가 복잡한 연금·복지 제도를 쉽게 이해하고 올바른 결정을 내릴 수 있도록 돕기 위해 만들어진 정보 플랫폼입니다.
          </p>
          <p>
            보건복지부·금융감독원·국민연금공단·한국주택금융공사 등 공신력 있는 기관의 공식 자료를 바탕으로,
            전문 용어를 일상 언어로 풀어 제공합니다.
          </p>
          <h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">운영 방침</h2>
          <ul class="list-disc list-inside space-y-2">
            <li>모든 정보는 공식 기관 발표 자료를 출처로 합니다.</li>
            <li>법령·고시 변경 시 최대한 빠르게 내용을 업데이트합니다.</li>
            <li>본 사이트의 정보는 참고용이며, 개인별 상황은 반드시 해당 기관에 직접 확인하시기 바랍니다.</li>
          </ul>
          <h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">문의</h2>
          <p>오류 제보 및 문의는 <a href="/contact" class="text-primary-600 hover:underline">문의하기</a> 페이지를 이용해 주세요.</p>
        </div>
      </main>
      <Footer />
    </>,
    { title: '운영자 소개 | 노후설계 가이드', description: '노후설계 가이드의 운영 방침과 정보 출처 기준을 안내합니다.', canonicalUrl: 'https://www.luckyu.co.kr/about' }
  )
})

app.get('/privacy', (c) => {
  return c.render(
    <>
      <Header />
      <main class="max-w-3xl mx-auto px-4 py-16">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <a href="/" class="hover:text-primary-600">홈</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-700">개인정보처리방침</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-2">개인정보처리방침</h1>
        <p class="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 11월 11일</p>
        <div class="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
            <p>본 사이트는 뉴스레터 구독 신청 시 이메일 주소를 수집하며, 신청 시각과 신청한 페이지 주소가 함께 기록됩니다. 그 외 서비스 이용 과정에서 IP 주소, 쿠키, 방문 기록 등이 자동으로 생성될 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
            <p>수집된 이메일 주소는 뉴스레터 발송 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
            <p class="mt-3">구독 신청 정보는 Google LLC가 제공하는 Google 설문지·Google 스프레드시트 서비스에 저장·보관되며(보관 업무 위탁), 사이트 운영자만 열람할 수 있습니다. Google의 개인정보 처리에 대한 자세한 내용은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">Google 개인정보처리방침</a>에서 확인할 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">3. 광고 및 쿠키</h2>
            <p>본 사이트는 Google 애드센스를 통해 광고를 게재합니다. Google은 쿠키를 사용하여 방문자에게 맞춤 광고를 제공할 수 있습니다. Google의 광고 쿠키 사용에 대한 자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">Google 개인정보처리방침</a>에서 확인할 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">4. 개인정보의 보유 및 이용 기간</h2>
            <p>뉴스레터 구독 해지 시 즉시 이메일 주소를 삭제합니다. 구독 해지와 이메일 주소 삭제는 <a href="/contact" class="text-primary-600 hover:underline">문의하기</a> 페이지를 통해 요청할 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">5. 문의</h2>
            <p>개인정보 관련 문의는 <a href="/contact" class="text-primary-600 hover:underline">문의하기</a> 페이지를 이용해 주세요.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>,
    { title: '개인정보처리방침 | 노후설계 가이드', description: '노후설계 가이드의 개인정보처리방침을 안내합니다.', canonicalUrl: 'https://www.luckyu.co.kr/privacy' }
  )
})

app.get('/disclaimer', (c) => {
  return c.render(
    <>
      <Header />
      <main class="max-w-3xl mx-auto px-4 py-16">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <a href="/" class="hover:text-primary-600">홈</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-700">면책 고지</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-2">면책 고지</h1>
        <p class="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 1월 1일</p>
        <div class="space-y-6 text-gray-700 leading-relaxed">
          <p>
            본 사이트(<strong>노후설계 가이드</strong>, luckyu.co.kr)의 모든 정보는 보건복지부·금융감독원·국민연금공단·한국주택금융공사 등의 공식 발표 자료를 기반으로 작성된 <strong>참고용 정보</strong>입니다.
          </p>
          <p>
            연금 수령액, 기초연금 자격, 장기요양 등급 등은 개인의 가입 이력, 재산 상황, 소득 수준에 따라 실제 결과가 달라질 수 있습니다.
            중요한 의사결정(연금 신청 시기 결정, 자산 처분 등) 전에는 반드시 <strong>해당 공식 기관에 직접 확인</strong>하시기 바랍니다.
          </p>
          <p>
            본 사이트는 법령·고시 변경 시 내용을 업데이트하기 위해 노력하나, 업데이트 지연으로 인한 정보 불일치에 대한 법적 책임을 지지 않습니다.
          </p>
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-6">
            <p class="font-semibold text-amber-800 mb-2">⚠️ 반드시 직접 확인이 필요한 사항</p>
            <ul class="list-disc list-inside space-y-1 text-amber-700 text-sm">
              <li>국민연금 예상 수령액 → 국민연금공단(1355) 또는 nps.or.kr</li>
              <li>기초연금 신청 자격 → 주민센터 또는 복지로(bokjiro.go.kr)</li>
              <li>장기요양 등급 → 국민건강보험공단(1577-1000)</li>
              <li>주택연금 수령액 → 한국주택금융공사(1688-8114)</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>,
    { title: '면책 고지 | 노후설계 가이드', description: '노후설계 가이드의 면책 고지 사항을 안내합니다.', canonicalUrl: 'https://www.luckyu.co.kr/disclaimer' }
  )
})

app.get('/contact', (c) => {
  return c.render(
    <>
      <Header />
      <main class="max-w-3xl mx-auto px-4 py-16">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <a href="/" class="hover:text-primary-600">홈</a>
          <i class="fas fa-chevron-right text-xs"></i>
          <span class="text-gray-700">문의하기</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-4">문의하기</h1>
        <p class="text-gray-500 mb-10">오류 제보, 정보 수정 요청, 제휴 문의 등 아래 이메일로 연락해 주세요. 영업일 기준 2~3일 내에 답변 드립니다.</p>
        <div class="bg-gray-50 rounded-2xl p-8 text-center">
          <i class="fas fa-envelope text-4xl text-primary-600 mb-4"></i>
          <p class="text-lg font-semibold text-gray-800">이메일 문의</p>
          <p class="text-gray-500 mt-2 text-sm">오류 제보 및 수정 요청 시 해당 URL과 함께 내용을 보내주시면 빠르게 처리하겠습니다.</p>
          <div class="mt-6 p-4 bg-white rounded-xl border border-gray-200 inline-block">
            <p class="text-primary-700 font-bold text-lg">admin@luckyu.co.kr</p>
          </div>
        </div>
      </main>
      <Footer />
    </>,
    { title: '문의하기 | 노후설계 가이드', description: '노후설계 가이드에 오류 제보, 정보 수정 요청, 제휴 문의를 보내주세요.', canonicalUrl: 'https://www.luckyu.co.kr/contact' }
  )
})

// ─── sitemap.xml (자동 생성) ────────────────────────────────────────────────────
// 포함: 홈 + open 카테고리 허브 + 정식 발행(published)·noindex 아님 글 — 데이터에서 파생되므로 수동 편집 불필요
// 제외: draft/review, 미오픈 카테고리, noindex, 존재하지 않는 URL
// lastmod: 요청 시각이 아닌 콘텐츠의 updatedAt(의미 있는 수정일)만 사용
app.get('/sitemap.xml', (c) => {
  if (isPreview) return c.text('Not Found', 404)

  type Entry = { url: string; lastmod?: string; changefreq: string; priority: string }
  const entries: Entry[] = [{ url: '/', lastmod: latestUpdate(indexablePosts), changefreq: 'weekly', priority: '1.0' }]
  for (const cat of categories.filter(x => x.state === 'open')) {
    entries.push({ url: `/${cat.slug}`, lastmod: latestUpdate(indexablePosts.filter(p => p.category === cat.slug)), changefreq: 'weekly', priority: '0.8' })
  }
  for (const post of indexablePosts) {
    entries.push({ url: postPath(post), lastmod: post.updatedAt, changefreq: 'monthly', priority: post.featured ? '0.9' : '0.7' })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(p => `  <url>
    <loc>${SITE_URL}${p.url === '/' ? '/' : p.url}</loc>${p.lastmod ? `
    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' })
})

// ─── rss.xml (네이버 서치어드바이저 RSS 제출용 · RSS 2.0) ─────────────────────────────
// 정식 발행·noindex 아님 글만 최신 발행순으로 포함. 글이 추가/수정되면 배포 시 자동 갱신.
app.get('/rss.xml', (c) => {
  if (isPreview) return c.text('Not Found', 404)

  const items = [...indexablePosts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 50)
  const lastBuild = latestUpdate(indexablePosts)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${SITE_URL}/</link>
    <description>${xmlEscape('4070 세대를 위한 연금·복지·노후 현금흐름 설계 정보 — 공식 자료 기반 칼럼')}</description>
    <language>ko-KR</language>${lastBuild ? `
    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>` : ''}
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items.map(p => `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${postCanonical(p)}</link>
      <guid isPermaLink="true">${postCanonical(p)}</guid>
      <pubDate>${toRfc822(p.publishedAt)}</pubDate>
      <dc:creator>${xmlEscape(SITE_NAME)}</dc:creator>
      <category>${xmlEscape(p.categoryLabel)}</category>
      <description>${xmlEscape(p.metaDescription || p.description)}</description>
    </item>`).join('\n')}
  </channel>
</rss>`

  return c.text(xml, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' })
})

// ─── ads.txt ──────────────────────────────────────────────────────────────────
app.get('/ads.txt', (c) => {
  return c.text(
    'google.com, pub-5237218812452624, DIRECT, f08c47fec0942fa0',
    200,
    { 'Content-Type': 'text/plain; charset=utf-8' }
  )
})

// ─── robots.txt ───────────────────────────────────────────────────────────────
app.get('/robots.txt', (c) => {
  // 운영: 전체 허용(/admin만 차단) + sitemap 안내. 미리보기: 전체 차단
  const txt = isPreview
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://www.luckyu.co.kr/sitemap.xml
`

  return c.text(txt, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

app.notFound((c) => renderNotFound(c))

export default app
