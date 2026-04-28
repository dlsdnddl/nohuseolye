import type { Post } from '../types'

interface PostCardProps {
  post: Post
  variant?: 'default' | 'featured' | 'compact'
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  pillar:     { label: '기둥글',     color: 'bg-blue-100 text-blue-700' },
  comparison: { label: '비교분석',   color: 'bg-amber-100 text-amber-700' },
  checklist:  { label: '체크리스트', color: 'bg-green-100 text-green-700' },
}

export const PostCard = ({ post, variant = 'default' }: PostCardProps) => {
  const badge = TYPE_BADGE[post.type]

  if (variant === 'compact') {
    return (
      <a
        href={`/pension-asset/${post.slug}`}
        class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
      >
        <div class="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
          <div class="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <i class="fas fa-file-alt text-primary-500"></i>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <span class={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
          <h3 class="text-sm font-semibold text-gray-800 mt-1 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p class="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span><i class="fas fa-clock mr-1"></i>{post.readTime}분</span>
            <span>{post.updatedAt}</span>
          </p>
        </div>
      </a>
    )
  }

  if (variant === 'featured') {
    return (
      <a
        href={`/pension-asset/${post.slug}`}
        class="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
      >
        {/* 썸네일 */}
        <div class="relative h-44 bg-gradient-to-br from-primary-700 to-primary-900 overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center opacity-10">
            <i class="fas fa-coins text-9xl text-white"></i>
          </div>
          <div class="absolute top-3 left-3 flex gap-2">
            <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
            {post.situation && (
              <span class="text-xs font-semibold bg-white/20 text-white backdrop-blur-sm px-2.5 py-1 rounded-full">
                {post.situation}
              </span>
            )}
          </div>
          <div class="absolute bottom-3 right-3 text-white/60 text-xs">
            <i class="fas fa-clock mr-1"></i>{post.readTime}분
          </div>
        </div>
        {/* 내용 */}
        <div class="p-5">
          <p class="text-xs text-primary-600 font-semibold mb-1">{post.categoryLabel}</p>
          <h3 class="font-bold text-gray-900 text-base leading-snug group-hover:text-primary-700 transition-colors mb-2 line-clamp-2">
            {post.title}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.description}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-400">{post.updatedAt} 업데이트</span>
            <span class="text-xs font-semibold text-primary-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              읽기 <i class="fas fa-arrow-right text-xs"></i>
            </span>
          </div>
        </div>
      </a>
    )
  }

  // default
  return (
    <a
      href={`/pension-asset/${post.slug}`}
      class="group flex flex-col bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
    >
      <div class="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>
      <div class="p-5 flex-1">
        <div class="flex items-start justify-between gap-2 mb-3">
          <span class={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          {post.situation && (
            <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">{post.situation}</span>
          )}
        </div>
        <h3 class="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary-700 transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.description}</p>
      </div>
      <div class="px-5 pb-4 flex items-center justify-between text-xs text-gray-400">
        <span><i class="fas fa-clock mr-1"></i>{post.readTime}분 읽기</span>
        <span class="text-primary-600 font-semibold group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </a>
  )
}
