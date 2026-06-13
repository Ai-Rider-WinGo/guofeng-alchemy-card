import { motion } from 'framer-motion';
import { CARD_MAP, LEVEL_NAMES, TYPE_NAMES } from '../data/cards';
import type { InventoryItem } from '../store/gameStore';

interface CardProps {
  cardId: string;
  item?: InventoryItem;
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  onClick?: () => void;
  locked?: boolean;
}

// 竖版卡牌尺寸 (约 2:3 比例，匹配图片)
const sizeConfig = {
  sm: { w: 72, h: 108, fontSize: 9, nameSize: 11 },
  md: { w: 108, h: 162, fontSize: 10, nameSize: 13 },
  lg: { w: 160, h: 240, fontSize: 12, nameSize: 15 },
};

export function Card({ cardId, item, size = 'md', showQuantity = false, onClick, locked = false }: CardProps) {
  const card = CARD_MAP[cardId];
  if (!card) return null;

  const s = sizeConfig[size];
  const isLegend = card.rarity === 'legendary';
  const isEpic = card.rarity === 'epic';

  const borderColor = isLegend ? '#B88A3B' : isEpic ? '#7A4A8A' : 'rgba(138, 109, 43, 0.5)';

  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{
        width: s.w,
        height: s.h,
        borderRadius: 8,
        border: `2px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: isLegend
          ? '0 0 15px rgba(184,138,59,0.15), 0 2px 8px rgba(0,0,0,0.4)'
          : '0 2px 6px rgba(0,0,0,0.3)',
        opacity: locked ? 0.4 : 1,
        background: '#1a1510',
      }}
      whileHover={!locked ? { scale: 1.04, y: -2 } : undefined}
      whileTap={!locked ? { scale: 0.97 } : undefined}
      onClick={onClick}
    >
      {/* 卡图 - 使用 img 标签确保完整填充 */}
      <img
        src={`/cards/${card.image}`}
        alt={card.name}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* 等级角标 - 左上透明文字 */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          color: '#D8B463',
          fontSize: s.fontSize - 1,
          fontWeight: 600,
          lineHeight: 1.2,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          zIndex: 2,
        }}
      >
        {LEVEL_NAMES[card.level]}
      </div>

      {/* 类型角标 - 右上透明文字 */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: 'rgba(233, 216, 176, 0.8)',
          fontSize: s.fontSize - 1,
          lineHeight: 1.2,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          zIndex: 2,
        }}
      >
        {TYPE_NAMES[card.type]}
      </div>

      {/* 数量角标 */}
      {showQuantity && item && item.quantity > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(166, 66, 50, 0.9)',
            borderRadius: 9,
            fontSize: 10,
            fontWeight: 'bold',
            color: '#E9D8B0',
            zIndex: 2,
          }}
        >
          ×{item.quantity}
        </div>
      )}

      {/* 星级 */}
      {item && item.star > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 6,
            display: 'flex',
            gap: 2,
            zIndex: 2,
          }}
        >
          {Array.from({ length: item.star }).map((_, i) => (
            <span key={i} style={{ fontSize: 8, color: '#D8B463', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>★</span>
          ))}
        </div>
      )}

      {/* 底部半透明渐变层 + 卡名/描述文字 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 8px 8px 8px',
          background: 'linear-gradient(0deg, rgba(10,8,5,0.9) 0%, rgba(10,8,5,0.6) 60%, transparent 100%)',
          zIndex: 1,
        }}
      >
        {/* 卡名 */}
        <div
          style={{
            fontSize: s.nameSize,
            fontWeight: 600,
            color: isLegend ? '#D8B463' : isEpic ? '#C8A0F0' : '#E9D8B0',
            letterSpacing: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {card.name}
        </div>

        {/* 描述 */}
        {size !== 'sm' && (
          <div
            style={{
              fontSize: s.fontSize,
              color: 'rgba(196, 170, 126, 0.9)',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              lineHeight: 1.3,
              marginTop: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.short_desc}
          </div>
        )}
      </div>
    </motion.div>
  );
}
