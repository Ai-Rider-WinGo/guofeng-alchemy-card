'use client'

interface CardDisplayProps {
  cardId: string
  cardName: string
  level: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isRevealed?: boolean
}

const rarityLabels: Record<CardDisplayProps['rarity'], string> = {
  common: 'N',
  uncommon: 'R',
  rare: 'SR',
  epic: 'SSR',
  legendary: 'UR',
}

const cardArt: Record<string, string> = {
  liubang_002: '/ui/reference-route-liubang.png',
  jixin_002: '/ui/reference-route-jixin.png',
  xiangyu_002: '/ui/reference-route-xiangyu.png',
  zhanghan_002: '/ui/reference-route-jixin.png',
  xingyang_escape_004: '/ui/reference-route-xingyang.png',
  julu_battle_004: '/ui/reference-route-chuhan.png',
  chuhan_conflict_005: '/ui/reference-route-chuhan.png',
}

export function CardDisplay({
  cardId,
  cardName,
  level,
  rarity,
  isRevealed = true,
}: CardDisplayProps) {
  const image = cardArt[cardId] ?? '/ui/reference-route-chuhan.png'

  return (
    <div className={`game-card ${rarity} ${!isRevealed ? 'unrevealed' : ''}`}>
      {isRevealed ? (
        <>
          <img src={image} alt={cardName} />
          <div className="game-card-shade" />
          <div className="game-card-rarity">{rarityLabels[rarity]}</div>
          <div className="game-card-name">{cardName}</div>
          <div className="game-card-level">阶 {level}</div>
        </>
      ) : (
        <>
          <img src="/art/chronicle-cardback.png" alt="未揭示卡牌" />
          <div className="game-card-shade" />
          <div className="game-card-name">未揭示</div>
          <div className="game-card-level">点击翻开</div>
        </>
      )}
    </div>
  )
}
