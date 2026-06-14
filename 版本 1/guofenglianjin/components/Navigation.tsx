'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/', label: '首页', icon: '/ui/nav-home.png' },
  { href: '/draw', label: '抽卡', icon: '/ui/nav-lineup.png' },
  { href: '/merge', label: '合成', icon: '/ui/nav-task.png' },
  { href: '/collection', label: '图鉴', icon: '/ui/nav-achievement.png' },
  { href: '/profile', label: '我的', icon: '/ui/nav-shop.png' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-mark">
              <img src={item.icon} alt="" aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
