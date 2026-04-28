// 애드센스 광고 슬롯 컴포넌트 — CLS 방지를 위해 min-height 강제 할당
interface AdSlotProps {
  type: 'leaderboard' | 'rectangle' | 'square' | 'in-article'
  id: string
  className?: string
}

const AD_DIMENSIONS: Record<string, { minHeight: string; label: string }> = {
  leaderboard:  { minHeight: '90px',  label: '리더보드 광고 (728×90)' },
  rectangle:    { minHeight: '250px', label: '직사각형 광고 (336×280)' },
  square:       { minHeight: '250px', label: '정사각형 광고 (250×250)' },
  'in-article': { minHeight: '280px', label: '인아티클 광고' },
}

export const AdSlot = ({ type, id, className = '' }: AdSlotProps) => {
  const dim = AD_DIMENSIONS[type]

  return (
    <div
      class={`ad-slot ad-slot--${type} ${className}`}
      style={`min-height: ${dim.minHeight}; background: #f8fafc; border: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; border-radius: 8px; overflow: hidden;`}
      aria-label="광고"
    >
      {/* 실제 애드센스 삽입 시 아래 ins 태그로 교체 */}
      {/* 
        <ins class="adsbygoogle"
          style={`display:block; min-height:${dim.minHeight}`}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true">
        </ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
      <span class="text-xs text-gray-300 select-none">광고</span>
    </div>
  )
}
