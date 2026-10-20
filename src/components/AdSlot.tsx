// 애드센스 수동 광고 슬롯 컴포넌트 — ca-pub-5237218812452624
// data-ad-slot: 애드센스 광고 단위별 고유 ID (필수)
// slotId 미입력 시 광고 미출력 (광고 영역 자체를 숨김)
import { BUILD_MODE } from '../generated/content'

interface AdSlotProps {
  type: 'leaderboard' | 'rectangle' | 'square' | 'in-article'
  id: string
  slotId?: string   // 애드센스 data-ad-slot 값 (예: "1234567890")
  className?: string
  desktopOnly?: boolean // true: 뷰포트 ≥1024px 에서만 광고 요청 (모바일에서 숨겨진 슬롯의 push 오류 방지)
}

const AD_CONFIG: Record<string, { minHeight: string; format: string; layoutKey?: string }> = {
  leaderboard:  { minHeight: '90px',  format: 'auto' },
  rectangle:    { minHeight: '250px', format: 'auto' },
  square:       { minHeight: '250px', format: 'auto' },
  'in-article': { minHeight: '280px', format: 'fluid', layoutKey: '-fb+5w+4e-db+86' },
}

export const AdSlot = ({ type, id, slotId, className = '', desktopOnly = false }: AdSlotProps) => {
  // slotId 없으면 광고 영역 자체를 렌더링하지 않음
  if (!slotId) return null
  // 미리보기 빌드에서는 광고 요청을 하지 않음 (AdSense 정책/성과 보호)
  if (BUILD_MODE === 'preview') return null

  const cfg = AD_CONFIG[type]

  return (
    <div
      class={`ad-slot ad-slot--${type} ${className} overflow-hidden`}
      style={`min-height: ${cfg.minHeight};`}
      aria-label="광고"
    >
      <ins
        class="adsbygoogle"
        style="display:block; text-align:center;"
        data-ad-client="ca-pub-5237218812452624"
        data-ad-slot={slotId}
        data-ad-format={cfg.format}
        {...(cfg.layoutKey ? { 'data-ad-layout-key': cfg.layoutKey } : {})}
        data-full-width-responsive="true"
      ></ins>
      <script dangerouslySetInnerHTML={{__html: desktopOnly
        ? `if (window.matchMedia('(min-width:1024px)').matches) { (adsbygoogle = window.adsbygoogle || []).push({}); }`
        : `(adsbygoogle = window.adsbygoogle || []).push({});`}} />
    </div>
  )
}
