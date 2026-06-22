import type { NextConfig } from 'next'

const API_TARGET = process.env.API_TARGET || 'http://localhost:3002'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // 开发环境：把 /api/* 代理到后端 NestJS（与 admin-light 一致）
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_TARGET}/api/:path*` },
    ]
  },
}

export default nextConfig
