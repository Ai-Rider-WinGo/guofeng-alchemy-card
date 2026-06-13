import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { CARD_MAP, RARITY_COLORS } from '../data/cards';

interface DrawPageProps {
  onCardClick: (cardId: string) => void;
}

export function DrawPage({ onCardClick }: DrawPageProps) {
  const { drawSingle, drawTen, lastDrawResults, clearDrawResults, remainingDraws } = useGameStore();
  const [showResults, setShowResults] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const handleDraw = (multi: boolean) => {
    if (isDrawing || remainingDraws <= 0) return;
    setIsDrawing(true);
    setFlippedCards(new Set());
    if (multi) drawTen();
    else drawSingle();
    setTimeout(() => {
      setShowResults(true);
      setIsDrawing(false);
      // 逐张翻转
      const count = multi ? 10 : 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          setFlippedCards(prev => new Set([...prev, i]));
        }, i * 120 + 300);
      }
    }, 500);
  };

  const handleClose = () => {
    setShowResults(false);
    clearDrawResults();
    setFlippedCards(new Set());
  };

  return (
    <div className="px-4 py-6 flex flex-col items-center gap-6">
      {/* 标题装饰 */}
      <motion.div
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: '#D8B463', letterSpacing: 4 }}
        >
          秦汉卡池
        </h2>
        <p style={{ color: '#8D8170', fontSize: 12, letterSpacing: 1 }}>
          每日可抽取 {remainingDraws} 次 · 概率均等
        </p>
      </motion.div>

      {/* 卡背展示区 */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: '100%', height: 220 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* 背景光晕 */}
        <div
          className="absolute"
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,138,59,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        {/* 卡背 */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="card-frame absolute"
            style={{
              width: 120,
              height: 168,
              background: 'linear-gradient(180deg, #1E1914 0%, #14100C 100%)',
              borderColor: 'rgba(138, 109, 43, 0.4)',
              transform: `rotate(${(i - 1) * 6}deg)`,
              zIndex: 3 - i,
            }}
            animate={isDrawing ? {
              rotateY: [0, 180, 360],
              scale: [1, 1.1, 1],
            } : {}}
            transition={{ duration: 0.8, delay: i * 0.1 }}
          >
            <img
              src="/cards/card_back.png"
              alt="卡背"
              className="w-full h-full object-cover"
              style={{ borderRadius: 4 }}
              draggable={false}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 抽卡按钮 */}
      <motion.div
        className="flex flex-col gap-3 w-full px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* 抽10次 - 高价值按钮 */}
        <button
          className="btn-premium w-full"
          onClick={() => handleDraw(true)}
          disabled={isDrawing || remainingDraws < 10}
        >
          <span style={{ marginRight: 8 }}>抽 十 连</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>(10次)</span>
        </button>

        {/* 抽1次 - 主按钮 */}
        <button
          className="btn-primary w-full"
          onClick={() => handleDraw(false)}
          disabled={isDrawing || remainingDraws < 1}
        >
          抽 一 次
        </button>
      </motion.div>

      {/* 抽卡中动画 */}
      <AnimatePresence>
        {isDrawing && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(10, 8, 5, 0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                width: 60,
                height: 60,
                border: '2px solid rgba(184, 138, 59, 0.2)',
                borderTopColor: '#B88A3B',
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 抽卡结果弹窗 */}
      <AnimatePresence>
        {showResults && lastDrawResults.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 遮罩 */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 5, 0.88)', backdropFilter: 'blur(4px)' }}
              onClick={handleClose}
            />

            {/* 结果面板 */}
            <motion.div
              className="modal-content relative z-10 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto"
              style={{ padding: 20, marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* 标题 */}
              <div className="page-title mb-4">
                <h3 style={{ color: '#D8B463', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
                  抽卡结果
                </h3>
              </div>

              {/* 卡牌网格 */}
              <div className={`grid gap-3 mb-6 ${lastDrawResults.length > 5 ? 'grid-cols-5' : lastDrawResults.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {lastDrawResults.map((result, i) => {
                  const card = CARD_MAP[result.card_id];
                  if (!card) return null;
                  const rc = RARITY_COLORS[card.rarity];
                  const isFlipped = flippedCards.has(i);

                  return (
                    <motion.div
                      key={`${result.card_id}-${i}`}
                      className="flex flex-col items-center gap-1.5 cursor-pointer"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => onCardClick(result.card_id)}
                    >
                      {/* 翻转卡牌 */}
                      <div
                        className="relative"
                        style={{
                          width: lastDrawResults.length > 5 ? 52 : 80,
                          height: lastDrawResults.length > 5 ? 69 : 107,
                          perspective: 600,
                        }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{ transformStyle: 'preserve-3d' }}
                          animate={{ rotateY: isFlipped ? 0 : 180 }}
                          transition={{ duration: 0.4 }}
                        >
                          {/* 正面 */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              borderRadius: 8,
                              border: `2px solid ${rc}`,
                            }}
                          >
                            <img
                              src={`/cards/${card.image}`}
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* 背面 */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                              background: 'linear-gradient(180deg, #1E1914 0%, #14100C 100%)',
                              borderRadius: 8,
                              border: '2px solid rgba(138, 109, 43, 0.4)',
                            }}
                          >
                            <img
                              src="/cards/card_back.png"
                              alt="卡背"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </motion.div>

                        {/* NEW标记 */}
                        {result.is_new && isFlipped && (
                          <motion.div
                            className="absolute -top-1 -right-1 z-10 px-1 py-0.5 rounded"
                            style={{
                              background: '#A64232',
                              border: '1px solid #D8B463',
                              fontSize: 8,
                              fontWeight: 700,
                              color: '#E9D8B0',
                              letterSpacing: 1,
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                          >
                            NEW
                          </motion.div>
                        )}
                      </div>

                      {/* 卡名 */}
                      <span
                        className="text-center truncate w-full"
                        style={{
                          fontSize: 11,
                          color: rc,
                          fontWeight: result.is_new ? 600 : 400,
                          maxWidth: lastDrawResults.length > 5 ? 52 : 80,
                        }}
                      >
                        {card.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* 关闭按钮 */}
              <button
                className="btn-secondary w-full"
                onClick={handleClose}
              >
                收下
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
