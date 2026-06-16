'use client'

import { useState, useEffect } from 'react'

interface PoolBannerProps {
  poolName: string
  dynastyTag: string
  endTime: string
  collectedCount: number
  totalCards: number
  featuredCards?: Array<{ id: string; name: string; rarity: string }>
  onViewPool?: () => void
}

function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; expired: boolean }>({
    days: 0, hours: 0, minutes: 0, seconds: 0, expired: false,
  })

  useEffect(() => {
    function calc() {
      const now = Date.now()
      const end = new Date(endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        return
      }

      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setRemaining({ days, hours, minutes, seconds, expired: false })
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [endTime])

  return remaining
}

export function PoolBanner({
  poolName,
  dynastyTag,
  endTime,
  collectedCount,
  totalCards,
  featuredCards,
  onViewPool,
}: PoolBannerProps) {
  const remaining = useCountdown(endTime)
  const progress = totalCards > 0 ? Math.round((collectedCount / totalCards) * 100) : 0

  return (
    <div className="paper-panel relative overflow-hidden p-4">
      {/* 朝代标签 */}
      <div className="absolute right-3 top-3 rounded-full border border-bronze/30 px-3 py-1 text-xs text-bronze">
        {dynastyTag}
      </div>

      <div className="space-y-4">
        {/* 标题区 */}
        <div>
          <p className="text-xs tracking-[0.35em] text-bronze/70">本周主题卡池</p>
          <h2 className="mt-1 text-2xl font-black tracking-[0.08em] text-ink">{poolName}</h2>

          {/* 倒计时 */}
          <div className="mt-2 flex items-center gap-1 text-sm text-ink/70">
            <span className="mr-1">⏳</span>
            {remaining.expired ? (
              <span className="text-red-600 font-bold">已结束</span>
            ) : (
              <span className="font-mono tabular-nums">
                {remaining.days > 0 && `${remaining.days}天 `}
                {String(remaining.hours).padStart(2, '0')}:
                {String(remaining.minutes).padStart(2, '0')}:
                {String(remaining.seconds).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* 主推卡牌 */}
        {featuredCards && featuredCards.length > 0 && (
          <div className="flex gap-2 overflow-x-auto route-scroll">
            {featuredCards.map((card) => (
              <div key={card.id} className="shrink-0 text-center">
                <div className="h-16 w-12 rounded-md border border-bronze/30 bg-ink-2 flex items-center justify-center">
                  <span className="text-2xl">🏛️</span>
                </div>
                <p className="mt-1 text-xs font-bold text-ink">{card.name}</p>
                <p className="text-[10px] text-ink/50">{card.rarity}</p>
              </div>
            ))}
          </div>
        )}

        {/* 收集进度 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-ink/70">
            <span className="font-bold">收集进度</span>
            <span>{collectedCount}/{totalCards}</span>
          </div>
          <div className="h-2 rounded-full border border-bronze/20 bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-jade via-bronze to-bronze/50 transition-all duration-500"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>

        {/* 操作入口 */}
        {onViewPool && (
          <button onClick={onViewPool} className="seal-button w-full py-2 text-sm">
            查看卡池详情 ›
          </button>
        )}
      </div>
    </div>
  )
}
