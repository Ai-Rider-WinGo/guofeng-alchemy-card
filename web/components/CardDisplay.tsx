'use client'

import { CardQuality, Card } from '@/lib/types'

// ============ 品质视觉配置（引用 tailwind.config.ts quality.* tokens） ============
const Q: Record<CardQuality, { label: string; border: string; bg: string; text: string; icon: string }> = {
  common:   { label: '凡品', border: 'border-quality-common-border', bg: 'bg-quality-common-bg', text: 'text-quality-common-text', icon: '◇' },
  fine:     { label: '精良', border: 'border-quality-fine-border',  bg: 'bg-quality-fine-bg',  text: 'text-quality-fine-text',  icon: '◆' },
  rare:     { label: '稀有', border: 'border-quality-rare-border',  bg: 'bg-quality-rare-bg',  text: 'text-quality-rare-text',  icon: '◇' },
  epic:     { label: '极品', border: 'border-quality-epic-border',  bg: 'bg-quality-epic-bg',  text: 'text-quality-epic-text',  icon: '⬡' },
  divine:   { label: '神品', border: 'border-quality-divine-border', bg: 'bg-quality-divine-bg', text: 'text-quality-divine-text', icon: '◆' },
  treasure: { label: '至宝', border: 'border-quality-treasure-border', bg: 'bg-quality-treasure-bg', text: 'text-quality-treasure-text', icon: '⬢' },
}

// ============ 朝代印章（引用 tailwind.config.ts dynasty.* tokens） ============
const DYNASTY_SEAL: Record<string, { icon: string; border: string; text: string }> = {
  qinhan:  { icon: '秦', border: 'border-dynasty-qinhan',  text: 'text-dynasty-qinhan' },
  sanguo:  { icon: '三', border: 'border-dynasty-sanguo',  text: 'text-dynasty-sanguo' },
  tang:    { icon: '唐', border: 'border-dynasty-tang',    text: 'text-dynasty-tang' },
  song:    { icon: '宋', border: 'border-dynasty-song',    text: 'text-dynasty-song' },
  ming:    { icon: '明', border: 'border-dynasty-ming',    text: 'text-dynasty-ming' },
  chunqiu: { icon: '战', border: 'border-dynasty-chunqiu', text: 'text-dynasty-chunqiu' },
}

// ============ Props: 兼容 Card 对象和单独字段 ============
interface CardDisplayProps {
  card?: Card
  cardId?: string
  cardName?: string
  level?: number
  quality?: CardQuality
  dynasty?: string
  /** 卡牌图片 URL（不含 CDN_BASE 前缀） */
  image?: string
  isRevealed?: boolean
  isNew?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/** 本地开发：图片基础路径（symlink → assets-output/cards/zh-v1，扁平结构） */
const LOCAL_IMG_BASE = '/cards'

/** 将配置中的图片 URL 解析为可访问的本地路径
 *  配置格式: "{CDN_BASE}/cards/qin_han/liubang_002.png"
 *  本地实际: "/cards/liubang_002.png"（扁平，无朝代子目录）
 *  策略: 取末段文件名拼到 /cards/ 下
 */
function resolveCardImage(imgSrc: string): string {
  if (!imgSrc) return ''
  // 去掉 CDN_BASE 前缀
  const cleaned = imgSrc.replace(/\{CDN_BASE\}\/?/g, '')
  // 取最后一段文件名（兼容 qin_han/x.png 与扁平 x.png）
  const fileName = cleaned.split('/').filter(Boolean).pop() || ''
  return `${LOCAL_IMG_BASE}/${fileName}`
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
  const imgSrc = c?.image || props.image || ''

  // 解析图片 URL 为本地可访问路径
  const resolvedImg = resolveCardImage(imgSrc)

  const style = Q[q]
  const seal = DYNASTY_SEAL[dyn] || DYNASTY_SEAL.qinhan
  const sizeClass = size === 'sm' ? 'w-[56px]' : size === 'lg' ? 'w-[200px]' : 'w-[120px]'

  // ===== 未收集：封印卡背 =====
  if (!revealed) {
    return (
      <div className={`${sizeClass} aspect-[5/7] relative`}>
        <div className="w-full h-full rounded-lg border border-gold/15 bg-void-100 flex flex-col items-center justify-center gap-1.5 overflow-hidden">
          {/* 朝代水印 */}
          <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center text-5xl font-black select-none pointer-events-none">
            {seal.icon}
          </div>
          {/* 装饰线 */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gold/15 rounded" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-gold/15 rounded" />
          {/* 问号 */}
          <div className="relative z-10 w-8 h-8 rounded-full border border-gold/15 bg-void-200 flex items-center justify-center">
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
          ${style.bg}
        `}
      >
        {/* 光晕 overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

        {/* 顶部金线 */}
        <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

        {/* 主视觉区 — 有图显示图，无图显示占位符 */}
        <div className="absolute inset-3 top-7 bottom-14 flex items-center justify-center">
          {resolvedImg ? (
            <img
              src={resolvedImg}
              alt={name}
              className="w-full h-full object-contain rounded-sm"
              loading="lazy"
              onError={(e) => {
                // 图片加载失败时隐藏，露出下方占位符
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
          <div className={`text-center select-none ${resolvedImg ? 'absolute inset-0 -z-10' : ''}`}>
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
            className={`w-5 h-5 rounded-seal flex items-center justify-center text-[9px] font-black border bg-black/60 ${seal.border} ${seal.text}`}
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
          <div
            className="absolute inset-0 pointer-events-none bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"
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
