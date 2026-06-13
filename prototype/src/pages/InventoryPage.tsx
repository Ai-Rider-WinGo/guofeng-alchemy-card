import { useGameStore } from '../store/gameStore';
import { Card } from '../components/Card';
import { CARD_MAP, LEVEL_NAMES } from '../data/cards';
import { motion } from 'framer-motion';

interface InventoryPageProps {
  onCardClick: (cardId: string) => void;
}

export function InventoryPage({ onCardClick }: InventoryPageProps) {
  const getInventoryCards = useGameStore((s) => s.getInventoryCards);
  const resetGame = useGameStore((s) => s.resetGame);
  const discovered = useGameStore((s) => s.discovered);

  const items = getInventoryCards();
  const totalCards = items.reduce((s, i) => s + i.quantity, 0);

  // 按等级分组
  const grouped: Record<number, typeof items> = {};
  items.forEach((item) => {
    const card = CARD_MAP[item.card_id];
    if (!card) return;
    const lv = card.level;
    if (!grouped[lv]) grouped[lv] = [];
    grouped[lv].push(item);
  });

  const sortedLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);

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
          我的库存
        </h2>
        <p style={{ color: '#8D8170', fontSize: 12, letterSpacing: 1 }}>
          共 {totalCards} 张卡牌 · 发现 {discovered.size} 种
        </p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📦</div>
          <p style={{ color: '#8D8170', fontSize: 14 }}>还没有卡牌，去抽卡吧</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {sortedLevels.map((level, gi) => (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              {/* 等级标题 */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded"
                  style={{
                    background: 'rgba(184, 138, 59, 0.08)',
                    border: '1px solid rgba(184, 138, 59, 0.2)',
                  }}
                >
                  <span style={{ color: '#D8B463', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
                    {LEVEL_NAMES[level]}
                  </span>
                  <span style={{ color: '#8D8170', fontSize: 11 }}>
                    · {grouped[level].length}种
                  </span>
                </div>
                <div className="flex-1 divider-bronze" />
              </div>

              {/* 卡牌网格 */}
              <div className="grid grid-cols-3 gap-3">
                {grouped[level].map((item) => (
                  <Card
                    key={item.card_id}
                    cardId={item.card_id}
                    item={item}
                    size="sm"
                    showQuantity
                    onClick={() => onCardClick(item.card_id)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 重置按钮 */}
      {items.length > 0 && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            className="btn-secondary"
            onClick={() => {
              if (confirm('确定要重置游戏吗？所有卡牌将被清除。')) {
                resetGame();
              }
            }}
          >
            重置游戏
          </button>
        </motion.div>
      )}
    </div>
  );
}
