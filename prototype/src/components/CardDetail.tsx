import { motion } from 'framer-motion';
import type { CardDef } from '../data/cards';
import { RARITY_COLORS, RARITY_NAMES, LEVEL_NAMES } from '../data/cards';
import { useGameStore } from '../store/gameStore';

interface CardDetailProps {
  card: CardDef;
  onClose: () => void;
}

export function CardDetail({ card, onClose }: CardDetailProps) {
  const inventory = useGameStore((s) => s.inventory);
  const item = inventory[card.card_id];
  const rc = RARITY_COLORS[card.rarity];
  const isLegend = card.rarity === 'legendary';
  const isEpic = card.rarity === 'epic';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(10, 8, 5, 0.92)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* 卡牌容器 - 沉浸式布局 */}
      <motion.div
        className="relative z-10"
        style={{
          width: 'min(86vw, 420px)',
          aspectRatio: '2 / 3',
          borderRadius: 18,
          border: '1px solid rgba(214, 170, 82, 0.45)',
          background: '#080604',
          overflow: 'hidden',
          boxShadow: isLegend
            ? '0 0 40px rgba(184, 138, 59, 0.3), 0 20px 60px rgba(0, 0, 0, 0.8)'
            : isEpic
            ? '0 0 30px rgba(122, 74, 138, 0.2), 0 20px 60px rgba(0, 0, 0, 0.8)'
            : '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* 图片层 - 完整铺满 */}
        <img
          src={`/cards/${card.image}`}
          alt={card.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* 遮罩层 - 底部渐变保证文字可读 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `
              linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.2) 60%, transparent 100%),
              radial-gradient(circle at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)
            `,
          }}
        />

        {/* 稀有度光效 */}
        {(isLegend || isEpic) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(ellipse at 50% 80%, ${isLegend ? 'rgba(184,138,59,0.12)' : 'rgba(122,74,138,0.1)'} 0%, transparent 60%)`,
            }}
          />
        )}

        {/* 关闭按钮 */}
        <button
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 3,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.42)',
            border: '1px solid rgba(214, 170, 82, 0.4)',
            borderRadius: 10,
            color: '#f6d27a',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        {/* 右上角信息 - 数量/星级 */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 16,
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          {item && item.quantity > 1 && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#f6d27a',
                textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              }}
            >
              ×{item.quantity}
            </div>
          )}
          {item && item.star > 0 && (
            <div
              style={{
                fontSize: 14,
                color: '#f6d27a',
                textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                letterSpacing: 2,
              }}
            >
              {'★'.repeat(item.star)}
            </div>
          )}
        </div>

        {/* 文字内容层 - 底部 overlay，简化内容 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '0 24px 24px',
            zIndex: 2,
            color: '#f7e7bd',
            textShadow: '0 2px 6px rgba(0,0,0,0.85)',
          }}
        >
          {/* 卡名 */}
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f6d27a',
              letterSpacing: 3,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {card.name}
          </h2>

          {/* 级别 + 稀有度 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 12,
                color: '#d9b96e',
                border: '1px solid rgba(214, 170, 82, 0.35)',
                background: 'rgba(0, 0, 0, 0.32)',
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {LEVEL_NAMES[card.level]}
            </span>
            <span
              style={{
                fontSize: 12,
                color: rc,
                border: `1px solid ${rc}40`,
                background: 'rgba(0, 0, 0, 0.32)',
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {RARITY_NAMES[card.rarity]}
            </span>
          </div>

          {/* 知识点 */}
          <div
            style={{
              background: 'rgba(10, 7, 4, 0.5)',
              border: '1px solid rgba(214, 170, 82, 0.22)',
              borderRadius: 10,
              backdropFilter: 'blur(6px)',
              padding: '12px 14px',
              marginBottom: 12,
            }}
          >
            <p style={{ fontSize: 14, color: 'rgba(233, 216, 176, 0.95)', lineHeight: 1.7 }}>
              {card.knowledge_point}
            </p>
          </div>

          {/* 标签 */}
          {card.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    color: '#8D8170',
                    border: '1px solid rgba(122, 78, 44, 0.25)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 999,
                    padding: '2px 8px',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
