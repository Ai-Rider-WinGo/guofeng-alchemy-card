import type { Metadata, Viewport } from 'next'
import './globals.css'
import { GameProvider } from '@/lib/gameContext'

export const metadata: Metadata = {
  title: '国风炼金卡牌',
  description: '收集历史人物，炼金融合，探索楚汉传奇',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0e27',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="bg-background" data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans bg-background text-foreground">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  )
}
