import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { CARDS, LEVEL_NAMES, TYPE_NAMES } from '../data/cards';
import { Card } from '../components/Card';

interface CodexPageProps {
  onCardClick: (cardId: string) => void;
}

const levelOptions = [null, 1, 2, 3, 4, 5];
const typeOptions = [null, 'person', 'place', 'event', 'system', 'force'];

export function CodexPage({ onCardClick }: CodexPageProps) {
  const discovered = useGameStore((s) => s.discovered);
  const inventory = useGameStore((s) => s.inventory);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filtered = CARDS.filter((c) => {
    if (filterLevel !== null && c.level !== filterLevel) return false;
    if (filterType !== null && c.type !== filterType) return false;
    return true;
  });

  const discoveredCount = filtered.filter((c) => discovered.has(c.card_id)).length;

  return (
    <div className="px-4 py-6">
      {/* 标题 */}
      <motion.div
        className="page-title mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: '#D8B463', letterSpacing: 4 }}
        >
          图鉴
        </h2>
        <p style={{ color: '#8D8170', fontSize: 12, letterSpacing: 1 }}>
          已收集 {discoveredCount} / {filtered.length} 张
        </p>
      </motion.div>

      {/* 收集进度条 */}
      <motion.div
        className="mb-4 rounded-lg overflow-hidden"
        style={{
          background: 'rgba(26, 21, 16, 0.6)',
          border: '1px solid rgba(184, 138, 59, 0.15)',
          padding: 12,
        }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: '#E9D8B0', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
            收集进度
          </span>
          <span style={{ color: '#D8B463', fontSize: 12, fontWeight: 600 }}>
            {CARDS.length > 0 ? Math.round((discovered.size / CARDS.length) * 100) : 0}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: 'rgba(14, 11, 8, 0.8)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #8A6D2B, #B88A3B, #D8B463)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(discovered.size / CARDS.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </motion.div>

      {/* 筛选器 */}
      <motion.div
        className="mb-4 flex flex-col gap-2"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-1.5">
          <span style={{ color: '#8D8170', fontSize: 11, lineHeight: '32px', marginRight: 4 }}>等级</span>
          {levelOptions.map((lv) => (
            <button
              key={`lv-${lv}`}
              className={`filter-chip ${filterLevel === lv ? 'filter-chip-active' : ''}`}
              onClick={() => setFilterLevel(lv)}
            >
              {lv === null ? '全部' : LEVEL_NAMES[lv]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span style={{ color: '#8D8170', fontSize: 11, lineHeight: '32px', marginRight: 4 }}>类型</span>
          {typeOptions.map((tp) => (
            <button
              key={`tp-${tp}`}
              className={`filter-chip ${filterType === tp ? 'filter-chip-active' : ''}`}
              onClick={() => setFilterType(tp)}
            >
              {tp === null ? '全部' : TYPE_NAMES[tp as keyof typeof TYPE_NAMES]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 卡牌网格 */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((card, i) => {
          const isDiscovered = discovered.has(card.card_id);
          const item = inventory[card.card_id];

          return (
            <motion.div
              key={card.card_id}
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              {isDiscovered ? (
                <Card
                  cardId={card.card_id}
                  item={item}
                  size="sm"
                  onClick={() => onCardClick(card.card_id)}
                />
              ) : (
                <div
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 72,
                    height: 96,
                    borderRadius: 8,
                    background: 'rgba(14, 11, 8, 0.6)',
                    border: '2px solid rgba(90, 81, 69, 0.3)',
                  }}
                  onClick={() => onCardClick(card.card_id)}
                >
                  <span style={{ color: '#5A5145', fontSize: 16 }}>?</span>
                  <span style={{ color: '#5A5145', fontSize: 8, marginTop: 1 }}>
                    {LEVEL_NAMES[card.level]}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: '#8D8170', fontSize: 14 }}>没有匹配的卡牌</p>
        </div>
      )}
    </div>
  );
}
