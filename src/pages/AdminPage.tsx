import type { Post } from '../types'
import { posts } from '../data/posts'

export const AdminPage = () => {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <header class="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-seedling text-white text-sm"></i>
          </div>
          <span class="font-bold">노후설계 가이드 — 관리자</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="/" target="_blank" class="text-sm text-gray-400 hover:text-white transition-colors">
            <i class="fas fa-external-link-alt mr-1"></i>사이트 보기
          </a>
          <span class="text-xs text-gray-600 border border-gray-700 rounded px-2 py-1">v1.0</span>
        </div>
      </header>

      <div class="flex min-h-[calc(100vh-56px)]">
        {/* 사이드바 */}
        <nav class="w-56 bg-gray-800 text-gray-300 p-4 flex-shrink-0">
          <ul class="space-y-1">
            {[
              { icon: 'fas fa-tachometer-alt', label: '대시보드', href: '/admin', active: true },
              { icon: 'fas fa-file-alt', label: '포스트 목록', href: '/admin/posts', active: false },
              { icon: 'fas fa-plus-circle', label: '새 글 작성', href: '/admin/posts/new', active: false },
              { icon: 'fas fa-cog', label: '설정', href: '/admin/settings', active: false },
            ].map(item => (
              <li key={item.href}>
                <a
                  href={item.href}
                  class={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.active ? 'bg-primary-700 text-white' : 'hover:bg-gray-700 hover:text-white'}`}
                >
                  <i class={`${item.icon} w-4 text-center`}></i>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 메인 콘텐츠 */}
        <main class="flex-1 p-8 overflow-auto">
          {/* 대시보드 통계 */}
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">대시보드</h1>
            <p class="text-gray-500 text-sm">노후설계 가이드 콘텐츠 관리 패널</p>
          </div>

          {/* 통계 카드 */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {[
              { label: '전체 포스트', value: posts.length, icon: 'fas fa-file-alt', color: 'bg-blue-50 text-blue-600' },
              { label: '게시됨', value: posts.length, icon: 'fas fa-check-circle', color: 'bg-green-50 text-green-600' },
              { label: '추천 글', value: posts.filter(p => p.featured).length, icon: 'fas fa-star', color: 'bg-amber-50 text-amber-600' },
              { label: '활성 카테고리', value: 1, icon: 'fas fa-folder', color: 'bg-purple-50 text-purple-600' },
            ].map(stat => (
              <div key={stat.label} class="bg-white rounded-xl border border-gray-100 p-5">
                <div class={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <i class={stat.icon}></i>
                </div>
                <p class="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                <p class="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* 새 글 작성 버튼 */}
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-gray-900">포스트 관리</h2>
            <a
              href="/admin/posts/new"
              class="flex items-center gap-2 px-5 py-2.5 bg-primary-700 hover:bg-primary-600 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              <i class="fas fa-plus"></i> 새 글 작성
            </a>
          </div>

          {/* 포스트 목록 테이블 */}
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">제목</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">카테고리</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">유형</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">업데이트</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">상태</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">관리</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  {posts.map(post => (
                    <tr key={post.id} class="hover:bg-gray-50 transition-colors">
                      <td class="px-5 py-4">
                        <div class="flex items-start gap-3">
                          {post.featured && (
                            <i class="fas fa-star text-amber-400 text-xs mt-1 flex-shrink-0"></i>
                          )}
                          <div>
                            <p class="text-sm font-semibold text-gray-800 line-clamp-1">{post.title}</p>
                            <p class="text-xs text-gray-400 mt-0.5">/pension-asset/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-4">
                        <span class="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full font-medium">
                          {post.categoryLabel}
                        </span>
                      </td>
                      <td class="px-5 py-4">
                        <span class={`text-xs px-2 py-1 rounded-full font-medium ${
                          post.type === 'pillar' ? 'bg-blue-50 text-blue-600' :
                          post.type === 'comparison' ? 'bg-amber-50 text-amber-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {post.type === 'pillar' ? '기둥글' : post.type === 'comparison' ? '비교글' : '체크리스트'}
                        </span>
                      </td>
                      <td class="px-5 py-4 text-xs text-gray-400">{post.updatedAt}</td>
                      <td class="px-5 py-4">
                        <span class="text-xs bg-green-50 text-green-600 font-semibold px-2 py-1 rounded-full">게시됨</span>
                      </td>
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-2">
                          <a
                            href={`/pension-asset/${post.slug}`}
                            target="_blank"
                            class="text-xs text-gray-400 hover:text-primary-600 transition-colors"
                            title="보기"
                          >
                            <i class="fas fa-eye"></i>
                          </a>
                          <a
                            href={`/admin/posts/edit/${post.slug}`}
                            class="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                            title="편집"
                          >
                            <i class="fas fa-edit"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 새 글 작성 폼 안내 */}
          <div class="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 class="font-bold text-blue-800 text-sm mb-2">
              <i class="fas fa-info-circle mr-2"></i>새 글 추가 방법
            </h3>
            <p class="text-xs text-blue-700 leading-relaxed">
              현재 버전에서는 <code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">src/data/posts.ts</code> 파일에 포스트 객체를 추가하고 배포하면 새 글이 등록됩니다.
              추후 업데이트를 통해 이 페이지에서 직접 글 작성이 가능하도록 개선될 예정입니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
