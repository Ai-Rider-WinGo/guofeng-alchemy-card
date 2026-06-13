import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { CARD_MAP, RARITY_COLORS, RARITY_NAMES, LEVEL_NAMES } from '../data/cards';
import { MERGE_RULES } from '../data/merges';
import { Card } from '../components/Card';

interface MergePageProps {
  onCardClick: (cardId: string) => void;
}

export function MergePage({ onCardClick }: MergePageProps) {
  const { inventory, merge, lastMergeResult, clearMergeResult, canMerge } = useGameStore();

  const handleQuickMerge = (a: string, b: string) => {
    merge(a, b);
  };

  const handleCloseResult = () => {
    clearMergeResult();
  };

  return (
    <div className="px-4 py-6">
      {/* 标题 */}
      <motion.div
        className="page-title mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: '#D8B463', letterSpacing: 4 }}
        >
          卡牌合成
        </h2>
        <p style={{ color: '#8D8170', fontSize: 12, letterSpacing: 1 }}>
          收集材料卡，合成更高级的历史卡牌
        </p>
      </motion.div>

      {/* 合成配方列表 */}
      <div className="flex flex-col gap-4">
        {MERGE_RULES.map((rule, i) => {
          const inputA = CARD_MAP[rule.input_a];
          const inputB = CARD_MAP[rule.input_b];
          const output = CARD_MAP[rule.output];
          if (!inputA || !inputB || !output) return null;

          const hasA = inventory[rule.input_a]?.quantity > 0;
          const hasB = inventory[rule.input_b]?.quantity > 0;
          const canDo = canMerge(rule.input_a, rule.input_b);
          const outRc = RARITY_COLORS[output.rarity];

          return (
            <motion.div
              key={rule.rule_id}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(30,25,20,0.9) 0%, rgba(20,16,12,0.95) 100%)',
                border: `1px solid ${canDo ? 'rgba(184, 138, 59, 0.35)' : 'rgba(90, 81, 69, 0.25)'}`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* 合成流程 */}
              <div className="p-4 flex items-center gap-2">
                {/* 材料A */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Card cardId={rule.input_a} item={inventory[rule.input_a]} size="sm" onClick={() => onCardClick(rule.input_a)} />
                  <div className="flex items-center gap-1">
                    <span
                      style={{
                        fontSize: 10,
                        color: hasA ? '#D8B463' : '#A64232',
                      }}
                    >
                      {inventory[rule.input_a]?.quantity || 0}/1
                    </span>
                  </div>
                </div>

                {/* 合成符号 */}
                <div className="flex flex-col items-center gap-1" style={{ minWidth: 32 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={canDo ? '#B88A3B' : '#5A5145'} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span style={{ fontSize: 9, color: '#5A5145' }}>合成</span>
                </div>

                {/* 材料B */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Card cardId={rule.input_b} item={inventory[rule.input_b]} size="sm" onClick={() => onCardClick(rule.input_b)} />
                  <div className="flex items-center gap-1">
                    <span
                      style={{
                        fontSize: 10,
                        color: hasB ? '#D8B463' : '#A64232',
                      }}
                    >
                      {inventory[rule.input_b]?.quantity || 0}/1
                    </span>
                  </div>
                </div>

                {/* 箭头 */}
                <div style={{ minWidth: 24 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canDo ? '#D8B463' : '#5A5145'} strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </div>

                {/* 产出 */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Card cardId={rule.output} size="sm" onClick={() => onCardClick(rule.output)} />
                  <span style={{ fontSize: 10, color: outRc }}>
                    {LEVEL_NAMES[output.level]} · {RARITY_NAMES[output.rarity]}
                  </span>
                </div>
              </div>

              {/* 历史关系说明 */}
              <div
                className="px-4 pb-3"
                style={{
                  borderTop: '1px solid rgba(122, 78, 44, 0.15)',
                }}
              >
                <p
                  className="mt-2 leading-relaxed"
                  style={{
                    fontSize: 12,
                    color: 'rgba(196, 170, 126, 0.7)',
                    lineHeight: 1.6,
                  }}
                >
                  {rule.merge_desc}
                </p>
              </div>

              {/* 合成按钮 */}
              <div className="px-4 pb-4">
                <button
                  className={canDo ? 'btn-primary w-full' : 'btn-primary w-full'}
                  disabled={!canDo}
                  onClick={() => handleQuickMerge(rule.input_a, rule.input_b)}
                  style={canDo ? {} : {
                    background: 'linear-gradient(180deg, #3A3530 0%, #2A2520 100%)',
                    borderColor: '#5A5145',
                    color: '#8D8170',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                  }}
                >
                  {canDo ? '立即合成' : '材料不足'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 合成结果弹窗 */}
      <AnimatePresence>
        {lastMergeResult && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 5, 0.88)', backdropFilter: 'blur(4px)' }}
              onClick={handleCloseResult}
            />

            <motion.div
              className="modal-content relative z-10 w-full max-w-sm mx-4"
              style={{ padding: 24 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {lastMergeResult.success ? (
                <div className="flex flex-col items-center gap-4">
                  {/* 成功光效 */}
                  <div
                    className="absolute"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(216,180,99,0.15) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                      top: 20,
                    }}
                  />

                  <div className="page-title">
                    <h3 style={{ color: '#D8B463', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
                      合成成功
                    </h3>
                  </div>

                  {lastMergeResult.output_card_id && (
                    <Card cardId={lastMergeResult.output_card_id} size="lg" onClick={() => onCardClick(lastMergeResult.output_card_id!)} />
                  )}

                  {lastMergeResult.merge_desc && (
                    <p
                      className="text-center leading-relaxed px-2"
                      style={{
                        fontSize: 13,
                        color: 'rgba(196, 170, 126, 0.8)',
                        lineHeight: 1.7,
                      }}
                    >
                      {lastMergeResult.merge_desc}
                    </p>
                  )}

                  <button className="btn-primary w-full" onClick={handleCloseResult}>
                    收下
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="page-title">
                    <h3 style={{ color: '#A64232', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
                      合成失败
                    </h3>
                  </div>
                  <p style={{ color: '#8D8170', fontSize: 14, textAlign: 'center' }}>
                    {lastMergeResult.message}
                  </p>
                  <button className="btn-secondary w-full" onClick={handleCloseResult}>
                    确定
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
