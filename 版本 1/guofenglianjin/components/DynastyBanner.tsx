'use client'

import { useGame } from '@/lib/gameContext'
import { DYNASTY_META } from '@/lib/types'
import { WEEKLY_DYNASTY_ORDER } from '@/lib/constants'

export function DynastyBanner() {
  const { gameState } = useGame()
  const currentDynasty = gameState.currentWeeklyDynasty
  const meta = DYNASTY_META[currentDynasty]
  const currentIndex = WEEKLY_DYNASTY_ORDER.indexOf(currentDynasty)
  const nextDynasty = WEEKLY_DYNASTY_ORDER[(currentIndex + 1) % 6]

  return (
    <div className="bronze-panel p-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-parchment/50 uppercase tracking-wider">本周朝代</p>
          <h2 className="text-lg font-black text-bronze">{meta.name}</h2>
          <p className="text-xs text-parchment/60">{meta.period}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-parchment/50">下周预告</p>
          <p className="text-sm text-parchment/70">{DYNASTY_META[nextDynasty].name}</p>
        </div>
      </div>
      {/* 六朝进度条 */}
      <div className="flex gap-1 mt-3">
        {WEEKLY_DYNASTY_ORDER.map((d, i) => (
          <div
            key={d}
            className={`h-1 flex-1 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-bronze'
                : i < currentIndex
                ? 'bg-bronze/30'
                : 'bg-parchment/10'
            }`}
            title={DYNASTY_META[d].name}
          />
        ))}
      </div>
    </div>
  )
}
