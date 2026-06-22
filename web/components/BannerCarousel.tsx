'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export interface BannerItem {
  id: string
  type: string
  icon: string
  title: string
  subtitle: string
  link: string
}

interface BannerCarouselProps {
  banners: BannerItem[]
  /** 单张停留时长（毫秒），默认 3800 */
  interval?: number
}

/** 运营 Banner 轮播 — 自动切换 + 指示点 */
export function BannerCarousel({ banners, interval = 3800 }: BannerCarouselProps) {
  const [active, setActive] = useState(0)
  const total = banners.length

  useEffect(() => {
    if (total <= 1) return
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % total)
    }, interval)
    return () => window.clearInterval(timer)
  }, [total, interval])

  if (!banners || total === 0) return null

  return (
    <div className="banner-carousel">
      <div className="banner-carousel-track">
        {banners.map((b, idx) => (
          <Link
            key={b.id}
            href={b.link}
            className={`banner-card ${idx === active ? 'banner-card-active' : ''}`}
            aria-hidden={idx !== active}
            style={{ transform: `translateX(${(idx - active) * 100}%)` }}
          >
            <span className="banner-card-icon">{b.icon}</span>
            <span className="banner-card-body">
              <span className="banner-card-title">{b.title}</span>
              <span className="banner-card-subtitle">{b.subtitle}</span>
            </span>
            <span className="banner-card-cta">›</span>
          </Link>
        ))}
      </div>

      {total > 1 ? (
        <div className="banner-dots" aria-hidden>
          {banners.map((b, idx) => (
            <span
              key={b.id}
              className={`banner-dot ${idx === active ? 'banner-dot-active' : ''}`}
              onClick={() => setActive(idx)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
