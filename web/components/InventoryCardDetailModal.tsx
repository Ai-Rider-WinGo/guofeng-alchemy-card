'use client'

import Link from 'next/link'
import { CardDisplay } from '@/components/CardDisplay'
import { CARD_QUALITY, DYNASTY_META, type Card } from '@/lib/types'

interface InventoryCardDetailModalProps {
  card: Card | null
  quantity: number
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  person: '人物',
  event: '事件',
  place: '地点',
  artifact: '文物',
  strategy: '战略',
}

export function InventoryCardDetailModal({ card, quantity, onClose }: InventoryCardDetailModalProps) {
  if (!card) return null

  const dynasty = DYNASTY_META[card.dynasty]
  const quality = CARD_QUALITY[card.quality]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="paper-panel w-full max-w-sm max-h-[82vh] overflow-y-auto p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-bronze/70">背包详情</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{card.name}</h2>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-ink/50 hover:text-ink">
            &times;
          </button>
        </div>

        <div className="flex justify-center">
          <CardDisplay
            cardId={card.id}
            cardName={card.name}
            level={card.level}
            quality={card.quality}
            dynasty={card.dynasty}
            image={card.image}
            isRevealed
            size="lg"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-bronze/20 bg-ink-2/10 p-3">
            <p className="text-xs text-ink/50">持有数量</p>
            <p className="mt-1 text-xl font-black text-bronze">x{quantity}</p>
          </div>
          <div className="rounded-md border border-bronze/20 bg-ink-2/10 p-3">
            <p className="text-xs text-ink/50">卡牌等级</p>
            <p className="mt-1 text-xl font-black text-bronze">Lv.{card.level}</p>
          </div>
          <div className="rounded-md border border-bronze/20 bg-ink-2/10 p-3">
            <p className="text-xs text-ink/50">稀有度</p>
            <p className="mt-1 text-sm font-bold text-ink">{quality.name}</p>
          </div>
          <div className="rounded-md border border-bronze/20 bg-ink-2/10 p-3">
            <p className="text-xs text-ink/50">朝代</p>
            <p className="mt-1 text-sm font-bold text-ink">{dynasty?.name || card.dynasty}</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-bronze/20 bg-bronze/5 p-3">
          <p className="text-xs text-ink/50">类型</p>
          <p className="mt-1 text-sm font-bold text-ink">{TYPE_LABELS[card.type] || card.type}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{card.description || '暂无简介'}</p>
          {card.knowledgePoint && (
            <p className="mt-3 text-xs leading-relaxed text-ink/55">{card.knowledgePoint}</p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/merge" className="btn-primary text-center" onClick={onClose}>
            去合成
          </Link>
          <Link href="/collection" className="btn-secondary text-center" onClick={onClose}>
            去图鉴
          </Link>
        </div>
      </div>
    </div>
  )
}
