'use client'

import { CardQuality, Card } from '@/lib/types'

// ============ 品质视觉配置 ============
const Q: Record<CardQuality, { label: string; border: string; bg: string; text: string; icon: string }> = {
  common:   { label: '凡品', border: 'border-[#6b5b3a]', bg: 'bg-[#3d3113]', text: 'text-[#8e7a55]', icon: '◇' },
  fine:     { label: '精良', border: 'border-[#1f6b5a]', bg: 'bg-[#0d2b24]', text: 'text-[#5aab9a]', icon: '◆' },
  rare:     { label: '稀有', border: 'border-[#1f4f8b]', bg: 'bg-[#0d1f38]', text: 'text-[#5a9ad8]', icon: '◇' },
  epic:     { label: '极品', border: 'border-[#7b3fa3]', bg: 'bg-[#1a0d24]', text: 'text-[#b37fd8]', icon: '⬡' },
  divine:   { label: '神品', border: 'border-[#d84315]', bg: 'bg-[#2a0a04]', text: 'text-[#f98b55]', icon: '◆' },
  treasure: { label: '至宝', border: 'border-[#d8b15a]', bg: 'bg-[#1a1005]', text: 'text-[#ffe19a]', icon: '⬢' },
}

const DYNASTY_SEAL: Record<string, { icon: string; hex: string }> = {
  qinhan:  { icon: '秦', hex: '#1f6b5a' },
  sanguo:  { icon: '三', hex: '#8b1e18' },
  tang:    { icon: '唐', hex: '#c98d26' },
  song:    { icon: '宋', hex: '#7fa99b' },
  ming:    { icon: '明', hex: '#1f4f8b' },
  chunqiu: { icon: '战', hex: '#6b8f3a' },
}

// ============ Props: 兼容 Card 对象和单独字段 ============
interface CardDisplayProps {
  card?: Card
  cardId?: string
  cardName?: string
  level?: number
  quality?: CardQuality
  dynasty?: string
  isRevealed?: boolean
  isNew?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CardDisplay(props: CardDisplayProps) {
  const c = props.card
  const id = c?.id || props.cardId || '???'
  const name = c?.name || props.cardName || '???'
  const lv = c?.level || props.level || 1
  const q: CardQuality = c?.quality || props.quality || 'common'
  const dyn = c?.dynasty || props.dynasty || 'qinhan'
  const revealed = props.isRevealed ?? true
  const size = props.size || 'md'

  const style = Q[q]
  const seal = DYNASTY_SEAL[dyn] || DYNASTY_SEAL.qinhan
  const sizeClass = size === 'sm' ? 'w-[56px]' : size === 'lg' ? 'w-[200px]' : 'w-[120px]'

  // ===== 未收集：封印卡背 =====
  if (!revealed) {
    return (
      <div className={`${sizeClass} aspect-[5/7] relative`}>
        <div className="w-full h-full rounded-lg border border-[#5c4a1d]/30 bg-[#0d0b09] flex flex-col items-center justify-center gap-1.5 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center text-5xl font-black select-none pointer-events-none">
            {seal.icon}
          </div>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gold/15 rounded" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gold/15 rounded" />
          <div className="relative z-10 w-8 h-8 rounded-full border border-gold/15 bg-[#110e0b] flex items-center justify-center">
            <span className="text-gold/25 text-lg">?</span>
          </div>
          <span className="relative z-10 text-[9px] text-gold/20 tracking-wider">未解封</span>
        </div>
      </div>
    )
  }

  // ===== 已收集：完整卡面 =====
  const isTreasure = q === 'treasure'

  return (
    <div className={`${sizeClass} aspect-[5/7] relative group/perspective`}>
      <div
        className={`
          relative w-full h-full rounded-lg overflow-hidden border-2 ${style.border}
          ${isTreasure ? 'animate-pulse-gold' : ''}
          transition-transform duration-200
          ${props.isNew ? 'animate-flip-in' : ''}
        `}
        style={{
          backgroundColor: style.bg.split('-')[1] || '#1a1005',
        }}
      >
        {/* 底色 + 光晕 */}
        <div className={`absolute inset-0 ${style.bg}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

        {/* 顶部金线 */}
        <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

        {/* 主视觉区 */}
        <div className="absolute inset-3 top-7 bottom-14 flex items-center justify-center">
          <div className="text-center select-none">
            <div className={`text-3xl opacity-15 ${isTreasure ? 'opacity-25' : ''}`}>
              {isTreasure ? '👑' : q === 'divine' ? '🔥' : q === 'epic' ? '💎' : '🏛️'}
            </div>
            {isTreasure && (
              <div className="mt-1 text-[8px] text-gold/30 tracking-[0.2em]">CN-GOLD</div>
            )}
          </div>
        </div>

        {/* 左上：朝代印 */}
        <div className="absolute top-1 left-1">
          <div
            className="w-5 h-5 rounded-seal flex items-center justify-center text-[9px] font-black border bg-black/60"
            style={{ borderColor: seal.hex, color: seal.hex }}
          >
            {seal.icon}
          </div>
        </div>

        {/* 右上：品质角标 */}
        <div className="absolute top-1 right-1">
          <div className={`px-1 py-0.5 rounded-seal text-[8px] font-bold border ${style.border} bg-black/60 ${style.text}`}>
            {style.label}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-6">
          <h4 className="text-[11px] font-bold text-text-primary leading-tight truncate text-center font-display">
            {name}
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-text-muted">Lv.{lv}</span>
            <span className={`text-[8px] font-bold ${style.text}`}>{style.label}</span>
          </div>
        </div>

        {/* 底部金线 */}
        <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

        {/* 至宝特殊：流光扫过 */}
        {isTreasure && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,225,154,0.06) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
          />
        )}

        {/* 新卡标记 */}
        {props.isNew && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-flame rounded-full flex items-center justify-center text-[10px] animate-seal-stamp">
            ✨
          </div>
        )}
      </div>
    </div>
  )
}
