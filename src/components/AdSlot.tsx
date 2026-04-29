// 애드센스 광고 슬롯 컴포넌트 — ca-pub-5237218812452624
// 자동 광고(Auto Ads) 방식 사용: data-ad-format="auto"
interface AdSlotProps {
  type: 'leaderboard' | 'rectangle' | 'square' | 'in-article'
  id: string
  className?: string
}

const AD_DIMENSIONS: Record<string, { minHeight: string }> = {
  leaderboard:  { minHeight: '90px'  },
  rectangle:    { minHeight: '250px' },
  square:       { minHeight: '250px' },
  'in-article': { minHeight: '280px' },
}

export const AdSlot = ({ type, id, className = '' }: AdSlotProps) => {
  const dim = AD_DIMENSIONS[type]

  return (
    <div
      class={`ad-slot ad-slot--${type} ${className} overflow-hidden`}
      style={`min-height: ${dim.minHeight};`}
      aria-label="광고"
    >
      <ins
        class="adsbygoogle"
        style="display:block; text-align:center;"
        data-ad-client="ca-pub-5237218812452624"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <script dangerouslySetInnerHTML={{__html: `(adsbygoogle = window.adsbygoogle || []).push({});`}} />
    </div>
  )
}
