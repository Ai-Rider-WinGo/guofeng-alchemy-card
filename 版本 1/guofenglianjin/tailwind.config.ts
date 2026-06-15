import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#11100d',
        foreground: '#f5ead6',
        'paper': '#f5ead6',
        'ink': '#11100d',
        'ink-2': '#1d1712',
        'parchment': '#c9ad78',
        'bronze': '#c9a961',
        'old-gold': '#8a5b25',
        'jade': '#2d8f7f',
        'rarity': {
          'common': '#a8a8a8',
          'uncommon': '#8b5a3c',
          'rare': '#c9a961',
          'epic': '#9966cc',
          'legendary': '#ff6b35',
        }
      },
      fontFamily: {
        'sans': ['Georgia', 'serif', 'system-ui', '-apple-system'],
        'kai': ['KaiTi', 'STKaiti', 'Songti SC', 'Georgia', 'serif'],
      },
      spacing: {
        'safe': 'max(0.5rem, env(safe-area-inset-left))',
      },
      keyframes: {
        'flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
      borderRadius: {
        'card': '0.5rem',
      }
    },
  },
  plugins: [],
}

export default config
