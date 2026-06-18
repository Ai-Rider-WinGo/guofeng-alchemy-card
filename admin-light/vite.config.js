import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',  // card_server.py 本地看板 API
        changeOrigin: true,
      },
      '/assets-output': {
        target: 'http://localhost:8888',  // 卡牌图片等静态资源
        changeOrigin: true,
      },
    },
  },
});
