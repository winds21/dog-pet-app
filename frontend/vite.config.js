import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite 配置：开发服务器 + 后端代理（解决跨域）
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true,
    // 把 /api 请求代理到后端 Express 服务
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
