import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title, description, ogImage, jsonLd }) => {
  const siteTitle = title ? `${title} | 노후설계 가이드` : '노후설계 가이드 — 4070 은퇴·연금·복지 실전 해설'
  const metaDesc = description || '국민연금·주택연금·기초연금·장기요양 등 4070 세대를 위한 노후 현금흐름 설계 정보를 보건복지부·금감원 공식 자료 기반으로 제공합니다.'
  const ogImg = ogImage || '/static/images/og-default.png'

  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a5c3e" />
        <title>{siteTitle}</title>
        <meta name="description" content={metaDesc} />
        {/* Open Graph */}
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={ogImg} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={ogImg} />
        {/* JSON-LD */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {/* Canonical */}
        <link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Tailwind */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* FontAwesome */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
        {/* Custom CSS */}
        <link rel="stylesheet" href="/static/style.css" />
        {/* Google Search Console 소유권 확인 */}
        <meta name="google-site-verification" content="a57r9VKSo4eR77ebK5nrIlr0-mCJYnpZSn-Oovxrte4" />
        {/* 네이버 서치어드바이저 소유권 확인 */}
        <meta name="naver-site-verification" content="fb50d5f71e40bc597ff17079cb19b01310c2b1c3" />
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5237218812452624" crossorigin="anonymous"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#f0faf5',
                    100: '#dcf4e8',
                    200: '#bbe9d4',
                    300: '#87d8b5',
                    400: '#4bbf8d',
                    500: '#28a56e',
                    600: '#1a8558',
                    700: '#166a47',
                    800: '#145439',
                    900: '#124530',
                    DEFAULT: '#1a5c3e',
                  },
                  warm: {
                    50: '#fdf8f0',
                    100: '#faefd9',
                    500: '#d97706',
                    600: '#b45309',
                  }
                },
                fontFamily: {
                  sans: ['Noto Sans KR', 'sans-serif'],
                }
              }
            }
          }
        `}} />
      </head>
      <body class="font-sans bg-gray-50 text-gray-800 antialiased">
        {children}
        {/* 공통 JS */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
