'use client'

interface StickyHeaderProps {
  title: string
  subtitle?: string
  collectedCount: number
  totalCount: number
}

/** 全局吸顶标题栏 — 所有页面统一，展示品牌标题 + 收集进度 */
export function StickyHeader({ title, subtitle, collectedCount, totalCount }: StickyHeaderProps) {
  const percent = totalCount > 0 ? Math.min(100, Math.round((collectedCount / totalCount) * 100)) : 0

  return (
    <header className="sticky-header">
      <div className="sticky-header-row">
        <div className="sticky-header-brand">
          <h1 className="sticky-header-title">{title}</h1>
          {subtitle ? <p className="sticky-header-subtitle">{subtitle}</p> : null}
        </div>
        <div className="sticky-header-progress">
          <span className="sticky-header-count">
            {collectedCount.toLocaleString()}
            <span className="sticky-header-total"> / {totalCount.toLocaleString()}</span>
          </span>
          <span className="sticky-header-percent">{percent}%</span>
        </div>
      </div>
      <div className="sticky-header-bar" aria-hidden>
        <div className="sticky-header-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </header>
  )
}
