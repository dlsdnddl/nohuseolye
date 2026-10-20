import type { Post } from '../types'

export const SITE_URL = 'https://www.luckyu.co.kr'
export const SITE_NAME = '노후설계 가이드'

export const postPath = (p: Pick<Post, 'category' | 'slug'>) => `/${p.category}/${p.slug}`
export const postCanonical = (p: Pick<Post, 'category' | 'slug'>) => `${SITE_URL}${postPath(p)}`

/** Article + Breadcrumb + (FAQ) JSON-LD — 모든 카테고리 글 상세가 공유 */
export function articleJsonLd(post: Post) {
  const imgPath = post.image?.src ?? post.thumbnail
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription || post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt, // 동적 렌더링 — 하드코딩 금지
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/static/favicon.svg` },
      },
      image: `${SITE_URL}${imgPath}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: post.categoryLabel, item: `${SITE_URL}/${post.category}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: postCanonical(post) },
      ],
    },
    ...(post.faq
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faq.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ]
      : []),
  ]
}

export const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

/** YYYY-MM-DD → RFC-822 (KST 09:00 고정 — 요청/빌드 시각에 의존하지 않음) */
export const toRfc822 = (date: string) => {
  const d = new Date(`${date}T09:00:00+09:00`)
  return isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString().replace('GMT', '+0000')
}
