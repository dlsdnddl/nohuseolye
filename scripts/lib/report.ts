import type { Issue } from './content-lib'

export function printReport(issues: Issue[], title: string) {
  const errors = issues.filter(i => i.level === 'error')
  const warns = issues.filter(i => i.level === 'warn')
  console.log(`\n══ ${title} ══  오류 ${errors.length} · 경고 ${warns.length}`)
  const byFile = new Map<string, Issue[]>()
  for (const i of issues) (byFile.get(i.file) ?? byFile.set(i.file, []).get(i.file)!).push(i)
  for (const [file, list] of byFile) {
    console.log(`\n▸ ${file}`)
    for (const i of list.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))) {
      console.log(`  ${i.level === 'error' ? '✖ ERROR' : '⚠ warn '} [${i.rule}] ${i.message}`)
      if (i.fix) console.log(`      → 수정 방법: ${i.fix}`)
    }
  }
}
