import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // NestJS (3002) — 管理后台全部 API
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // card_server.py (8888) — 图片素材
      '/assets-output': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
