// Tailwind 설정 — 빌드 때 public/static/tailwind.css 를 생성합니다 (npm run css:build)
// 예전에는 브라우저에서 매번 계산하는 CDN 방식(cdn.tailwindcss.com)을 썼습니다.
// 색상·글꼴 값은 CDN 방식 때 renderer.tsx 에 있던 설정과 같습니다.
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 클래스 이름을 찾을 파일: 화면 코드, 글 데이터, 브라우저 스크립트(app.js 안의 HTML 조각)
  content: ['./src/**/*.{ts,tsx}', './public/static/app.js'],
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
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
}
