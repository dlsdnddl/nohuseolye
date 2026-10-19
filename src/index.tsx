import { Hono } from 'hono'
import { renderer } from './renderer'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HeroDiagnosis } from './components/HeroDiagnosis'
import { QuickLinks } from './components/QuickLinks'
import { ContentCuration } from './components/ContentCuration'
import { AdSlot } from './components/AdSlot'
import { ArticlePage } from './pages/ArticlePage'
import { posts, getPostBySlug } from './data/posts'

const app = new Hono()
app.use(renderer)

// ─── www 리다이렉트 (SEO: 중복 도메인 방지) ────────────────────────────────────
// luckyu.co.kr → www.luckyu.co.kr 301 영구 리다이렉트
app.use('*', (c, next) => {
  const host = c.req.header('host') || ''
  if (host === 'luckyu.co.kr') {
    const url = new URL(c.req.url)
    url.host = 'www.luckyu.co.kr'
    return c.redirect(url.toString(), 301)
  }
  return next()
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

// ─── 카테고리 목록 ─────────────────────────────────────────────────────────────
app.get('/pension-asset', (c) => {
  const categoryPosts = posts.filter(p => p.category === 'pension-asset')

  return c.render(
    <>
      <Header />
      <main class="max-w-6xl mx-auto px-4 py-12">
        {/* 카테고리 헤더 */}
        <div class="mb-10">
          <nav class="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <a href="/" class="hover:text-primary-600">홈</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <span class="text-gray-700 font-medium">연금·자산</span>
          </nav>
          <h1 class="text-3xl font-extrabold text-gray-900 mb-2">연금·자산</h1>
          <p class="text-gray-500">국민연금, 주택연금, 기초연금 등 노후 소득 관련 핵심 정보</p>
        </div>

        {/* 포스트 그리드 */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryPosts.map(post => {
            const badge = post.type === 'pillar' ? { label: '기둥글', color: 'bg-blue-100 text-blue-700' }
              : post.type === 'comparison' ? { label: '비교분석', color: 'bg-amber-100 text-amber-700' }
              : { label: '체크리스트', color: 'bg-green-100 text-green-700' }
            return (
              <a key={post.id} href={`/pension-asset/${post.slug}`}
                class="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div class="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>
                <div class="p-6">
                  <div class="flex gap-2 mb-3">
                    <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                    {post.situation && <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{post.situation}</span>}
                  </div>
                  <h2 class="font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary-700 transition-colors">{post.title}</h2>
                  <p class="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{post.description}</p>
                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <span><i class="fas fa-clock mr-1"></i>{post.readTime}분</span>
                    <span class="text-primary-600 font-semibold">읽기 →</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </main>
      <Footer />
    </>,
    { title: '연금·자산 정보', description: '국민연금, 주택연금, 기초연금 등 노후 소득 관련 핵심 정보를 공식 자료 기반으로 제공합니다.', canonicalUrl: 'https://www.luckyu.co.kr/pension-asset' }
  )
})

// ─── 아티클 상세 ───────────────────────────────────────────────────────────────
app.get('/pension-asset/:slug', (c) => {
  const slug = c.req.param('slug')
  const post = getPostBySlug(slug)

  if (!post) return renderNotFound(c)

  // JSON-LD 구조화 데이터
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt, // 동적 렌더링 — 하드코딩 금지
      author: {
        '@type': 'Organization',
        name: '노후설계 가이드'
      },
      publisher: {
        '@type': 'Organization',
        name: '노후설계 가이드',
        logo: { '@type': 'ImageObject', url: 'https://www.luckyu.co.kr/static/favicon.svg' }
      },
      image: `https://www.luckyu.co.kr${post.thumbnail}`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.luckyu.co.kr' },
        { '@type': 'ListItem', position: 2, name: post.categoryLabel, item: `https://www.luckyu.co.kr/${post.category}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.luckyu.co.kr/${post.category}/${post.slug}` }
      ]
    },
    ...(post.faq ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    }] : [])
  ]

  return c.render(
    <>
      <Header />
      <ArticlePage post={post} />
      <Footer />
    </>,
    { title: post.title, description: post.description, jsonLd, canonicalUrl: `https://www.luckyu.co.kr/${post.category}/${post.slug}` }
  )
})

// ─── 관리자 ────────────────────────────────────────────────────────────────────
// 인증 시스템/실데이터가 없는 정적 목업 화면이었으므로 운영에서는 비공개(404) 처리.
// (Cloudflare Pages는 Hosted 접근규칙을 적용할 수 없어, 공개 라우트 자체를 제거)
app.all('/admin', (c) => renderNotFound(c))
app.all('/admin/*', (c) => renderNotFound(c))

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

app.get('/housing-income', comingSoonPage('집·노후소득'))
app.get('/support', comingSoonPage('지원금'))

// ─── 부모님 돌봄 카테고리 목록 ────────────────────────────────────────────────
app.get('/care', (c) => {
  const categoryPosts = posts.filter(p => p.category === 'care')

  return c.render(
    <>
      <Header />
      <main class="max-w-6xl mx-auto px-4 py-12">
        <div class="mb-10">
          <nav class="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <a href="/" class="hover:text-primary-600">홈</a>
            <i class="fas fa-chevron-right text-xs"></i>
            <span class="text-gray-700 font-medium">부모님 돌봄</span>
          </nav>
          <h1 class="text-3xl font-extrabold text-gray-900 mb-2">부모님 돌봄</h1>
          <p class="text-gray-500">장기요양등급, 병원비 지원 등 부모님 돌봄 관련 핵심 정보</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryPosts.map(post => {
            const badge = post.type === 'pillar' ? { label: '기둥글', color: 'bg-blue-100 text-blue-700' }
              : post.type === 'comparison' ? { label: '비교분석', color: 'bg-amber-100 text-amber-700' }
              : { label: '체크리스트', color: 'bg-green-100 text-green-700' }
            return (
              <a key={post.id} href={`/care/${post.slug}`}
                class="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div class="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>
                <div class="p-6">
                  <div class="flex gap-2 mb-3">
                    <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                    {post.situation && <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{post.situation}</span>}
                  </div>
                  <h2 class="font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary-700 transition-colors">{post.title}</h2>
                  <p class="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{post.description}</p>
                  <div class="flex items-center justify-between text-xs text-gray-400">
                    <span><i class="fas fa-clock mr-1"></i>{post.readTime}분</span>
                    <span class="text-primary-600 font-semibold">읽기 →</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </main>
      <Footer />
    </>,
    { title: '부모님 돌봄 정보', description: '장기요양등급, 병원비 지원 등 부모님 돌봄 관련 핵심 정보를 공식 자료 기반으로 제공합니다.', canonicalUrl: 'https://www.luckyu.co.kr/care' }
  )
})

// ─── 부모님 돌봄 아티클 상세 ──────────────────────────────────────────────────
app.get('/care/:slug', (c) => {
  const slug = c.req.param('slug')
  const post = getPostBySlug(slug)

  if (!post) return renderNotFound(c)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Organization', name: '노후설계 가이드' },
      publisher: {
        '@type': 'Organization',
        name: '노후설계 가이드',
        logo: { '@type': 'ImageObject', url: 'https://www.luckyu.co.kr/static/favicon.svg' }
      },
      image: `https://www.luckyu.co.kr${post.thumbnail}`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://www.luckyu.co.kr' },
        { '@type': 'ListItem', position: 2, name: post.categoryLabel, item: `https://www.luckyu.co.kr/${post.category}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.luckyu.co.kr/${post.category}/${post.slug}` }
      ]
    },
    ...(post.faq ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    }] : [])
  ]

  return c.render(
    <>
      <Header />
      <ArticlePage post={post} />
      <Footer />
    </>,
    { title: post.title, description: post.description, jsonLd, canonicalUrl: `https://www.luckyu.co.kr/${post.category}/${post.slug}` }
  )
})

// ─── 정보 페이지 (애드센스·신뢰도용) ─────────────────────────────────────────────
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
        <p class="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 1월 1일</p>
        <div class="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
            <p>본 사이트는 뉴스레터 구독 신청 시 이메일 주소를 수집합니다. 그 외 서비스 이용 과정에서 IP 주소, 쿠키, 방문 기록 등이 자동으로 생성될 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
            <p>수집된 이메일 주소는 뉴스레터 발송 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">3. 광고 및 쿠키</h2>
            <p>본 사이트는 Google 애드센스를 통해 광고를 게재합니다. Google은 쿠키를 사용하여 방문자에게 맞춤 광고를 제공할 수 있습니다. Google의 광고 쿠키 사용에 대한 자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">Google 개인정보처리방침</a>에서 확인할 수 있습니다.</p>
          </section>
          <section>
            <h2 class="text-lg font-bold text-gray-900 mb-3">4. 개인정보의 보유 및 이용 기간</h2>
            <p>뉴스레터 구독 해지 시 즉시 이메일 주소를 삭제합니다.</p>
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

// ─── sitemap.xml ─────────────────────────────────────────────────────────────
app.get('/sitemap.xml', (c) => {
  const BASE = 'https://www.luckyu.co.kr'
  const now = new Date().toISOString().split('T')[0]

  const staticPages = [
    { url: '/',              changefreq: 'weekly',  priority: '1.0' },
    { url: '/pension-asset', changefreq: 'weekly',  priority: '0.8' },
    { url: '/care',          changefreq: 'weekly',  priority: '0.8' },
  ]

  const postPages = posts.map(post => ({
    url: `/${post.category}/${post.slug}`,
    changefreq: 'monthly',
    priority: post.featured ? '0.9' : '0.7',
    lastmod: post.updatedAt || now,
  }))

  const allPages = [...staticPages, ...postPages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${p.lastmod || now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
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
  const txt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://www.luckyu.co.kr/sitemap.xml
`

  return c.text(txt, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

app.notFound((c) => renderNotFound(c))

export default app
