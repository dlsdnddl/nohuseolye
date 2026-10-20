// 미리보기 전용 검토 화면 (/_review, /_review/:slug) — 운영 빌드에서는 라우트가 등록되지 않습니다.
import type { Post, VerificationSheet } from '../types'

const RESULT: Record<string, { label: string; cls: string }> = {
  verified: { label: '확인 완료', cls: 'bg-green-100 text-green-800' },
  partial: { label: '부분 확인', cls: 'bg-amber-100 text-amber-800' },
  unverified: { label: '미확인', cls: 'bg-red-100 text-red-800' },
  conflict: { label: '출처 간 불일치', cls: 'bg-red-100 text-red-800' },
}
const STATUS_CLS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  review: 'bg-amber-200 text-amber-900',
  published: 'bg-green-200 text-green-900',
}

export const ReviewIndex = ({ posts, sheets }: { posts: Post[]; sheets: Record<string, VerificationSheet> }) => {
  const md = posts.filter(p => p.origin === 'md')
  return (
    <main class="max-w-5xl mx-auto px-4 py-10">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-2">운영자 검토 목록 (미리보기 전용)</h1>
      <p class="text-sm text-gray-500 mb-6">이 환경은 noindex · 광고/GA 비활성 · 비밀번호 보호 상태입니다. 운영 사이트에는 아래 draft/review 글이 존재하지 않습니다.</p>
      <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50 text-left text-xs text-gray-500">
            <th class="px-3 py-2">상태</th><th class="px-3 py-2">카테고리</th><th class="px-3 py-2">제목</th><th class="px-3 py-2">검증일</th><th class="px-3 py-2">검증표</th><th class="px-3 py-2">링크</th>
          </tr></thead>
          <tbody>
            {md.map(p => {
              const rows = sheets[p.slug]?.rows ?? []
              const c = (k: string) => rows.filter(r => r.result === k).length
              return (
                <tr class="border-t border-gray-100 align-top">
                  <td class="px-3 py-2"><span class={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[p.status ?? 'published']}`}>{(p.status ?? 'published').toUpperCase()}</span></td>
                  <td class="px-3 py-2 whitespace-nowrap">{p.categoryLabel}</td>
                  <td class="px-3 py-2 font-medium text-gray-800">{p.title}</td>
                  <td class="px-3 py-2 whitespace-nowrap">{p.verifiedAt ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-xs">확인 {c('verified')} · 부분 {c('partial')} · 미확인 {c('unverified') + c('conflict')}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-xs">
                    <a class="text-primary-600 underline mr-2" href={`/${p.category}/${p.slug}`}>글 보기</a>
                    <a class="text-primary-600 underline" href={`/_review/${p.slug}`}>검증표</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export const ReviewDetail = ({ post, sheet }: { post: Post; sheet?: VerificationSheet }) => (
  <main class="max-w-6xl mx-auto px-4 py-10">
    <p class="text-sm mb-3"><a href="/_review" class="text-primary-600 underline">← 검토 목록</a> · <a href={`/${post.category}/${post.slug}`} class="text-primary-600 underline">글 화면 보기</a></p>
    <h1 class="text-2xl font-extrabold text-gray-900 mb-1">{post.title}</h1>
    <p class="text-sm text-gray-500 mb-6">상태 {post.status?.toUpperCase()} · 기준연도 {post.basisYear ?? '-'} · 검증일 {post.verifiedAt ?? '-'} · 시스템 확인일 {sheet?.checkedAt ?? '-'}</p>

    {post.review?.differentiation && (
      <div class="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700"><strong>기존 글과의 차별점:</strong> {post.review.differentiation}</div>
    )}
    {post.review?.reviewNotes && (
      <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700 whitespace-pre-line"><strong>검토 메모:</strong>{'\n'}{post.review.reviewNotes}</div>
    )}

    <h2 class="text-lg font-bold text-gray-900 mb-3">공식자료 검증표</h2>
    {!sheet ? <p class="text-sm text-red-600">검증표가 없습니다.</p> : (
      <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-xs">
          <thead><tr class="bg-gray-50 text-left text-gray-500">
            <th class="px-3 py-2">검증 항목</th><th class="px-3 py-2">적용 수치·조건</th><th class="px-3 py-2">기관</th><th class="px-3 py-2">공식 문서명</th><th class="px-3 py-2">원문</th><th class="px-3 py-2">시행일</th><th class="px-3 py-2">확인일</th><th class="px-3 py-2">결과</th>
          </tr></thead>
          <tbody>
            {sheet.rows.map(r => (
              <tr class="border-t border-gray-100 align-top">
                <td class="px-3 py-2 font-medium text-gray-800">{r.item}</td>
                <td class="px-3 py-2">{r.value}{r.note ? <div class="text-gray-400 mt-1">※ {r.note}</div> : null}</td>
                <td class="px-3 py-2 whitespace-nowrap">{r.agency}</td>
                <td class="px-3 py-2">{r.document}</td>
                <td class="px-3 py-2"><a href={r.url} target="_blank" rel="noopener noreferrer" class="text-primary-600 underline break-all">링크</a></td>
                <td class="px-3 py-2 whitespace-nowrap">{r.effectiveDate}</td>
                <td class="px-3 py-2 whitespace-nowrap">{r.checkedAt}</td>
                <td class="px-3 py-2 whitespace-nowrap"><span class={`px-2 py-0.5 rounded-full font-bold ${RESULT[r.result]?.cls ?? ''}`}>{RESULT[r.result]?.label ?? r.result}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </main>
)
