'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  mark: string
}

const navItems: NavItem[] = [
  { href: '/', label: '首页', mark: '首' },
  { href: '/draw', label: '抽卡', mark: '卡' },
  { href: '/merge', label: '合成', mark: '合' },
  { href: '/collection', label: '卡册', mark: '册' },
  { href: '/profile', label: '我的', mark: '我' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-bronze/25 bg-ink/95 safe-area-inset backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-safe">
        {navItems.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-bronze/30 text-sm font-black">
              {item.mark}
            </span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
