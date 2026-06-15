'use client'

import { CardQuality, CARD_QUALITY } from '@/lib/types'

interface CardDisplayProps {
  cardId: string
  cardName: string
  level: number
  quality: CardQuality
  isRevealed?: boolean
}

const qualityBorderColors: Record<CardQuality, string> = {
  common: 'border-gray-400',
  fine: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  divine: 'border-red-400',
  treasure: 'border-yellow-400',
}

const qualityBgColors: Record<CardQuality, string> = {
  common: 'bg-gray-400/10',
  fine: 'bg-green-400/10',
  rare: 'bg-blue-400/10',
  epic: 'bg-purple-400/10',
  divine: 'bg-red-400/10',
  treasure: 'bg-yellow-400/10',
}

const qualityLabels: Record<CardQuality, string> = {
  common: '凡品',
  fine: '精良',
  rare: '稀有',
  epic: '极品',
  divine: '神品',
  treasure: '至宝',
}

export function CardDisplay({
  cardId,
  cardName,
  level,
  quality,
  isRevealed = true,
}: CardDisplayProps) {
  return (
    <div
      className={`card-frame w-full aspect-[2/3] border-2 ${qualityBorderColors[quality]} ${
        !isRevealed ? 'flex items-center justify-center cursor-pointer' : ''
      }`}
    >
      {!isRevealed ? (
        <div className="text-center">
          <div className="card-border-top" />
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="text-4xl">🎴</div>
            <p className="text-xs text-paper/60">点击翻开</p>
          </div>
          <div className="card-border-bottom" />
        </div>
      ) : (
        <div className={`card-content p-4 h-full flex flex-col justify-between ${qualityBgColors[quality]}`}>
          <div className="card-border-top" />

          {/* 占位符艺术区域 */}
          <div className="flex-1 flex items-center justify-center border border-bronze/20 rounded my-3 bg-ink/30">
            <div className="text-center">
              <div className="text-6xl opacity-30 mb-2">🏛️</div>
              <p className="text-xs text-paper/40">{cardId}</p>
            </div>
          </div>

          {/* 卡牌信息 */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-bronze leading-tight">{cardName}</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-paper/70">等级 {level}</span>
              <span className="px-2 py-1 rounded text-xs font-bold">{qualityLabels[quality]}</span>
            </div>
          </div>

          <div className="card-border-bottom" />
        </div>
      )}
    </div>
  )
}
