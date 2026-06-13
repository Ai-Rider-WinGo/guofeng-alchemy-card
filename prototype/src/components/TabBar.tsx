import { motion } from 'framer-motion';

interface TabBarProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

/* 线性图标组件 */
function TabIcon({ index, isActive }: { index: number; isActive: boolean }) {
  const color = isActive ? '#D8B463' : '#8D8170';
  const size = 22;

  switch (index) {
    case 0: // 抽卡
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M12 5v14" />
          <path d="M7 9l2.5 3L7 15" />
          <path d="M17 9l-2.5 3L17 15" />
        </svg>
      );
    case 1: // 库存
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v3" />
          <path d="M21 16v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3" />
          <rect x="4" y="8" width="16" height="8" rx="1" />
          <path d="M8 12h8" />
        </svg>
      );
    case 2: // 合成
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="5" />
          <circle cx="15" cy="15" r="5" />
          <path d="M12 6v6" />
          <path d="M9 12h6" />
        </svg>
      );
    case 3: // 图鉴
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V5a2 2 0 012-2h11a1 1 0 011 1v14" />
          <path d="M4 19h16" />
          <path d="M8 7h4" />
          <path d="M8 11h4" />
          <path d="M8 15h2" />
        </svg>
      );
    default:
      return null;
  }
}

export function TabBar({ tabs, activeIndex, onChange }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'linear-gradient(180deg, rgba(20,16,12,0.95) 0%, rgba(14,11,8,0.98) 100%)',
        borderTop: '2px solid rgba(184, 138, 59, 0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 顶部装饰线 */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(216, 180, 99, 0.3), transparent)',
        }}
      />

      <div className="max-w-md mx-auto flex">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={tab}
              onClick={() => onChange(i)}
              className="flex-1 flex flex-col items-center py-2.5 relative transition-all duration-150"
              style={{ minWidth: 0 }}
            >
              {/* 选中态背景铭牌 */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-x-2 -top-0.5 bottom-0 rounded-t-md"
                  style={{
                    background: 'linear-gradient(180deg, rgba(184, 138, 59, 0.08) 0%, transparent 100%)',
                    borderTop: '2px solid #B88A3B',
                    boxShadow: '0 -4px 12px rgba(184, 138, 59, 0.08)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 mt-0.5">
                <TabIcon index={i} isActive={isActive} />
              </div>

              <span
                className="relative z-10 mt-0.5"
                style={{
                  fontSize: 10,
                  color: isActive ? '#D8B463' : '#8D8170',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: 1,
                  transition: 'color 150ms ease',
                }}
              >
                {tab}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部安全区 */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
