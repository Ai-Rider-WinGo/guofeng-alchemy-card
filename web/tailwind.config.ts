import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 暗黑国潮主色
        'void': {
          DEFAULT: '#050505',
          100: '#0d0b09',
          200: '#110e0b',
          300: '#14100a',
        },
        'gold': {
          DEFAULT: '#d8b15a',
          500: '#d8b15a',
          600: '#b8913a',
          800: '#5c4a1d',
        },
        'cinnabar': {
          DEFAULT: '#8b1e18',
        },
        'bronze': {
          DEFAULT: '#c9a961',
          green: '#1f6b5a',
          dark: '#4a3820',
        },
        'jade': {
          DEFAULT: '#7fa99b',
          light: '#a3c4b8',
          dark: '#4a7c6b',
        },
        'flame': {
          DEFAULT: '#f66a2a',
        },
        // 文字色
        'text': {
          primary: '#f4e2b2',
          secondary: '#8e7a55',
          muted: '#5c4e38',
        },
        // 品质色
        'quality': {
          common:    { border: '#6b5b3a', bg: '#3d3113', text: '#8e7a55', glow: 'rgba(107,91,58,0.3)' },
          fine:      { border: '#1f6b5a', bg: '#0d2b24', text: '#5aab9a', glow: 'rgba(31,107,90,0.4)' },
          rare:      { border: '#1f4f8b', bg: '#0d1f38', text: '#5a9ad8', glow: 'rgba(31,79,139,0.4)' },
          epic:      { border: '#7b3fa3', bg: '#1a0d24', text: '#b37fd8', glow: 'rgba(123,63,163,0.5)' },
          divine:    { border: '#d84315', bg: '#2a0a04', text: '#f98b55', glow: 'rgba(216,67,21,0.6)' },
          treasure:  { border: '#d8b15a', bg: '#1a1005', text: '#ffe19a', glow: 'rgba(216,177,90,0.8)' },
        },
        // 朝代色
        'dynasty': {
          qinhan:  { DEFAULT: '#1f6b5a', light: '#3a9a85', dark: '#0d2b24', accent: '#5a7a5a' },
          sanguo:  { DEFAULT: '#8b1e18', light: '#c43a30', dark: '#3d0d09', accent: '#d84315' },
          tang:    { DEFAULT: '#c98d26', light: '#e8b84b', dark: '#5c3a0d', accent: '#f4c542' },
          song:    { DEFAULT: '#7fa99b', light: '#a3c4b8', dark: '#3d5c52', accent: '#8cb8a8' },
          ming:    { DEFAULT: '#1f4f8b', light: '#3a7bc8', dark: '#0d1f38', accent: '#5a8fd4' },
          chunqiu: { DEFAULT: '#6b8f3a', light: '#8fb84b', dark: '#2d3d0d', accent: '#9aad5a' },
        },
        // 兼容旧颜色名
        'background': '#050505',
        'foreground': '#f4e2b2',
        'paper': '#f4e2b2',
        'ink': '#050505',
        'ink-2': '#110e0b',
        'parchment': '#8e7a55',
        'old-gold': '#5c4a1d',
      },
      fontFamily: {
        // 隶书 - 主标题/logo 专用，秦汉石碑般的古拙庄重
        'clerical': ['LiSu', 'STLiti', '隶书', 'KaiTi', 'STKaiti', 'serif'],
        // 楷体 - 页面标题、区块标题，笔墨书写感
        'display': ['KaiTi', 'STKaiti', 'ZCOOL XiaoWei', 'Noto Serif SC', 'Songti SC', 'Georgia', 'serif'],
        // 宋体 - 正文、卡牌描述，古籍刻本风
        'body': ['Noto Serif SC', 'Songti SC', 'SimSun', 'STSongti', 'Georgia', 'serif'],
        // UI 小字 - 按钮/标签/Badge 保持清晰
        'ui': ['PingFang SC', 'HarmonyOS Sans SC', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe': 'max(0.5rem, env(safe-area-inset-left))',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(216,177,90,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(216,177,90,0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'seal-stamp': {
          '0%': { transform: 'scale(1.3)', opacity: '0' },
          '60%': { transform: 'scale(0.95)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'seal-stamp': 'seal-stamp 0.4s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      borderRadius: {
        'card': '0.5rem',
        'seal': '0.25rem',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(216,177,90,0.15) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}

export default config
