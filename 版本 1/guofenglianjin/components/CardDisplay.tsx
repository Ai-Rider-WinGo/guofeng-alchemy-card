'use client'

interface CardDisplayProps {
  cardId: string
  cardName: string
  level: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isRevealed?: boolean
}

const rarityColors: Record<string, string> = {
  'common': 'border-rarity-common',
  'uncommon': 'border-rarity-uncommon',
  'rare': 'border-rarity-rare',
  'epic': 'border-rarity-epic',
  'legendary': 'border-rarity-legendary',
}

const rarityBgColors: Record<string, string> = {
  'common': 'bg-rarity-common/10',
  'uncommon': 'bg-rarity-uncommon/10',
  'rare': 'bg-rarity-rare/10',
  'epic': 'bg-rarity-epic/10',
  'legendary': 'bg-rarity-legendary/10',
}

export function CardDisplay({
  cardId,
  cardName,
  level,
  rarity,
  isRevealed = true,
}: CardDisplayProps) {
  return (
    <div
      className={`card-frame w-full aspect-[2/3] border-2 ${rarityColors[rarity]} ${
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
        <div className={`card-content p-4 h-full flex flex-col justify-between ${rarityBgColors[rarity]}`}>
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
              <span className={`px-2 py-1 rounded text-xs font-bold`}>{rarity}</span>
            </div>
          </div>

          <div className="card-border-bottom" />
        </div>
      )}
    </div>
  )
}
