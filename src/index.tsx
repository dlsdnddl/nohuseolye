import { Hono } from 'hono'
import { renderer } from './renderer'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HeroDiagnosis } from './components/HeroDiagnosis'
import { QuickLinks } from './components/QuickLinks'
import { ContentCuration } from './components/ContentCuration'
import { AdSlot } from './components/AdSlot'
import { ArticlePage } from './pages/ArticlePage'
import { AdminPage } from './pages/AdminPage'
import { posts, getPostBySlug } from './data/posts'

const app = new Hono()
app.use(renderer)

// ─── 홈 ───────────────────────────────────────────────────────────────────────
app.get('/', (c) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '노후설계 가이드',
    description: '4070 세대를 위한 연금·복지·노후 현금흐름 설계 정보 플랫폼',
    url: 'https://nohuseolye.pages.dev',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://nohuseolye.pages.dev/search?q={search_term_string}',
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
          <AdSlot type="leaderboard" id="home-bottom-ad" />
        </div>
      </main>
      <Footer />
    </>,
    { title: null, description: null, jsonLd }
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
    { title: '연금·자산 정보', description: '국민연금, 주택연금, 기초연금 등 노후 소득 관련 핵심 정보를 공식 자료 기반으로 제공합니다.' }
  )
})

// ─── 아티클 상세 ───────────────────────────────────────────────────────────────
app.get('/pension-asset/:slug', (c) => {
  const slug = c.req.param('slug')
  const post = getPostBySlug(slug)

  if (!post) {
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
      { title: '페이지 없음' }
    )
  }

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
        logo: { '@type': 'ImageObject', url: 'https://nohuseolye.pages.dev/static/favicon.svg' }
      },
      image: `https://nohuseolye.pages.dev${post.thumbnail}`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://nohuseolye.pages.dev' },
        { '@type': 'ListItem', position: 2, name: post.categoryLabel, item: `https://nohuseolye.pages.dev/${post.category}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://nohuseolye.pages.dev/${post.category}/${post.slug}` }
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
    { title: post.title, description: post.description, jsonLd }
  )
})

// ─── 관리자 ────────────────────────────────────────────────────────────────────
app.get('/admin', (c) => {
  return c.render(<AdminPage />, { title: '관리자 대시보드' })
})

app.get('/admin/posts', (c) => {
  return c.render(<AdminPage />, { title: '포스트 관리' })
})

// ─── 준비 중 카테고리 (noindex) ────────────────────────────────────────────────
const comingSoonPage = (label: string) => (c: any) => c.render(
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
  { title: `${label} — 준비 중` }
)

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
    { title: '부모님 돌봄 정보', description: '장기요양등급, 병원비 지원 등 부모님 돌봄 관련 핵심 정보를 공식 자료 기반으로 제공합니다.' }
  )
})

// ─── 부모님 돌봄 아티클 상세 ──────────────────────────────────────────────────
app.get('/care/:slug', (c) => {
  const slug = c.req.param('slug')
  const post = getPostBySlug(slug)

  if (!post) {
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
      { title: '페이지 없음' }
    )
  }

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
        logo: { '@type': 'ImageObject', url: 'https://nohuseolye.pages.dev/static/favicon.svg' }
      },
      image: `https://nohuseolye.pages.dev${post.thumbnail}`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://nohuseolye.pages.dev' },
        { '@type': 'ListItem', position: 2, name: post.categoryLabel, item: `https://nohuseolye.pages.dev/${post.category}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://nohuseolye.pages.dev/${post.category}/${post.slug}` }
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
    { title: post.title, description: post.description, jsonLd }
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

// ─── robots.txt ───────────────────────────────────────────────────────────────
app.get('/robots.txt', (c) => {
  const txt = `User-agent: *
Allow: /

Sitemap: https://www.luckyu.co.kr/sitemap.xml`

  return c.text(txt, 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

export default app
