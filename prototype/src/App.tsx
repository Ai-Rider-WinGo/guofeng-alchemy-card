import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DrawPage } from './pages/DrawPage';
import { InventoryPage } from './pages/InventoryPage';
import { MergePage } from './pages/MergePage';
import { CodexPage } from './pages/CodexPage';
import { TabBar } from './components/TabBar';
import { CardDetail } from './components/CardDetail';
import { useGameStore } from './store/gameStore';
import { CARD_MAP } from './data/cards';

const pages = [DrawPage, InventoryPage, MergePage, CodexPage];
const pageNames = ['抽卡', '库存', '合成', '图鉴'];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const remainingDraws = useGameStore((s) => s.remainingDraws);

  const ActivePage = pages[activeTab];

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto relative">
      {/* 顶部状态栏 */}
      <header
        className="sticky top-0 z-20 px-4 py-2 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, rgba(14,11,8,0.95) 0%, rgba(14,11,8,0.85) 80%, transparent 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#B88A3B', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            国风炼金
          </span>
          <span style={{ color: '#8D8170', fontSize: 11 }}>· 秦汉篇</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-md"
          style={{
            background: 'rgba(26, 21, 16, 0.8)',
            border: '1px solid rgba(184, 138, 59, 0.25)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B463" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ color: '#D8B463', fontSize: 13, fontWeight: 600 }}>{remainingDraws}</span>
          <span style={{ color: '#8D8170', fontSize: 10 }}>次</span>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ActivePage onCardClick={(id) => setDetailCardId(id)} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部导航 */}
      <TabBar tabs={pageNames} activeIndex={activeTab} onChange={setActiveTab} />

      {/* 卡牌详情弹窗 */}
      <AnimatePresence>
        {detailCardId && CARD_MAP[detailCardId] && (
          <CardDetail
            card={CARD_MAP[detailCardId]}
            onClose={() => setDetailCardId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
