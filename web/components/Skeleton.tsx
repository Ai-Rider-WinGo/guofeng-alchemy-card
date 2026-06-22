'use client'

/** 首屏 hydration 时的占位骨架，保持与正式页面接近的竖屏结构 */
export function Skeleton() {
  return (
    <main className="min-h-screen pb-20 safe-area-inset bg-gradient-to-b from-background via-[#0a0908] to-void-100">
      {/* 吸顶栏占位 */}
      <div className="sticky top-0 z-40 px-4 py-3 bg-[#0a0908]/90 backdrop-blur border-b border-gold-100/10">
        <div className="skeleton-bar w-40 h-5 mb-2" />
        <div className="skeleton-bar w-24 h-3" />
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* 炼金炉占位 */}
        <div className="skeleton-block h-48 rounded-2xl" />
        {/* Banner 占位 */}
        <div className="skeleton-block h-20 rounded-xl" />
        {/* 主视觉大卡占位 */}
        <div className="skeleton-block h-64 rounded-2xl" />
        <div className="skeleton-block h-40 rounded-2xl" />
        <div className="skeleton-block h-40 rounded-2xl" />
      </div>

      <style jsx>{`
        .skeleton-bar,
        .skeleton-block {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.04) 0%,
            rgba(255, 255, 255, 0.09) 50%,
            rgba(255, 255, 255, 0.04) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </main>
  )
}
