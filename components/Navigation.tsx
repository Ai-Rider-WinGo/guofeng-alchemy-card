'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/draw', label: '抽卡', icon: '🎴' },
  { href: '/merge', label: '合成', icon: '✨' },
  { href: '/collection', label: '图鉴', icon: '📖' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ink border-t border-bronze/20 safe-area-inset">
      <div className="flex items-center justify-around px-safe">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
