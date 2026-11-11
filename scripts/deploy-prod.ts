// 운영 배포 한 번에 실행: 점검 → 타입 검사 → 빌드 → Cloudflare Pages(nohuseolye) 배포 → 최근 배포 목록
//   npm run deploy:nohuseolye
// 토큰은 화면에 출력하지 않습니다. 아래 순서로 찾습니다.
//   1) 환경변수 CLOUDFLARE_API_TOKEN
//   2) .deploy.local.json 의 tokenFile 이 가리키는 파일(git 제외) — 파일 안에서 토큰 한 줄을 찾아 사용
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './lib/content-lib'

const PROJECT = 'nohuseolye' // wrangler.jsonc 의 webapp 이 아니라 실제 운영 프로젝트
const BRANCH = 'main'

function readToken(): string {
  const fromEnv = (process.env.CLOUDFLARE_API_TOKEN || '').trim()
  if (fromEnv) return fromEnv
  const configPath = path.join(ROOT, '.deploy.local.json')
  if (!fs.existsSync(configPath)) return ''
  let tokenFile = ''
  try { tokenFile = String(JSON.parse(fs.readFileSync(configPath, 'utf-8')).tokenFile || '') } catch { return '' }
  if (!tokenFile || !fs.existsSync(tokenFile)) return ''
  const line = fs.readFileSync(tokenFile, 'utf-8').split(/\r?\n/).map(l => l.trim()).find(l => /^[A-Za-z0-9_-]{30,}$/.test(l))
  return line || ''
}

function run(label: string, command: string, args: string[], env?: NodeJS.ProcessEnv) {
  console.log(`\n▶ ${label}`)
  const res = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: true, env: env ?? process.env })
  if (res.status !== 0) {
    console.error(`\n✖ "${label}" 단계에서 멈췄습니다. 운영 사이트는 바뀌지 않았습니다.`)
    process.exit(res.status ?? 1)
  }
}

const token = readToken()
if (!token) {
  console.error('✖ Cloudflare 토큰을 찾지 못했습니다. 환경변수 CLOUDFLARE_API_TOKEN 을 설정하거나 .deploy.local.json 의 tokenFile 을 확인하세요.')
  process.exit(1)
}

run('콘텐츠 점검', 'npm', ['run', 'content:check'])
run('타입 검사', 'npm', ['run', 'typecheck'])
run('운영용 빌드', 'npm', ['run', 'build'])

const deployEnv = { ...process.env, CLOUDFLARE_API_TOKEN: token }
run(`운영 배포 (프로젝트 ${PROJECT}, 브랜치 ${BRANCH})`, 'npx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name', PROJECT, '--branch', BRANCH], deployEnv)
run('최근 배포 목록', 'npx', ['wrangler', 'pages', 'deployment', 'list', '--project-name', PROJECT], deployEnv)
console.log('\n✔ 배포 완료. 운영 사이트(https://www.luckyu.co.kr)에서 확인하세요.')
