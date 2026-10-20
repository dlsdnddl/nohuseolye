import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

// OUT_DIR: 미리보기 빌드(build:preview)는 dist-preview 로 분리 출력 (기본값 dist = 운영)
const outDir = process.env.OUT_DIR || 'dist'

export default defineConfig({
  plugins: [
    build({ outputDir: outDir }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  build: {
    outDir
  }
})
