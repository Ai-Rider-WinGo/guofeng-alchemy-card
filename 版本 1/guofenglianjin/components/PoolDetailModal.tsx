'use client'

interface PoolDetailModalProps {
  poolName: string
  isOpen: boolean
  onClose: () => void
  rarityWeights: Record<string, number>
  cardList: Array<{ id: string; name: string; rarity: string; level: number }>
}

export function PoolDetailModal({ poolName, isOpen, onClose, rarityWeights, cardList }: PoolDetailModalProps) {
  if (!isOpen) return null

  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/80 backdrop-blur-sm p-4 safe-area-inset"
         onClick={onClose}>
      <div
        className="paper-panel w-full max-w-sm max-h-[70vh] overflow-y-auto p-5 space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-[0.08em] text-ink">{poolName}</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        {/* 概率说明 */}
        <div>
          <h3 className="text-sm font-bold text-bronze mb-2">概率说明</h3>
          <div className="space-y-2">
            {Object.entries(rarityWeights).map(([rarity, weight]) => (
              <div key={rarity} className="flex items-center justify-between text-sm">
                <span className="text-paper capitalize">{rarity}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-ink-2/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-bronze"
                      style={{ width: `${(weight / totalWeight) * 100}%` }}
                    />
                  </div>
                  <span className="text-paper/70 text-xs w-12 text-right">
                    {Math.round((weight / totalWeight) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 卡池内容 */}
        <div>
          <h3 className="text-sm font-bold text-bronze mb-2">卡池内容</h3>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {cardList.map((card) => (
              <div key={card.id} className="flex items-center gap-2 rounded-md border border-bronze/20 bg-ink-2/30 p-2">
                <span className="text-lg">🏛️</span>
                <div>
                  <p className="text-xs font-bold text-paper">{card.name}</p>
                  <p className="text-[10px] text-paper/50">
                    Lv.{card.level} · {card.rarity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 保底提示 */}
        <div className="rounded-md border border-bronze/20 bg-bronze/5 p-3 text-center">
          <p className="text-xs text-bronze/80">每 10 次十连抽保底获得 SR 或以上卡牌</p>
        </div>

        <button onClick={onClose} className="btn-primary w-full text-sm">
          知道了
        </button>
      </div>
    </div>
  )
}
