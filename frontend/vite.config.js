import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite 配置：开发服务器 + 后端代理（解决跨域）
// 生产环境通过 VITE_API_BASE_URL 指向独立后端（Cyclic）
export default defineConfig({
  plugins: [vue()],
  // 静态资源基础路径（Vercel 部署需要相对路径）
  base: './',
  server: {
    port: 5173,
    open: true,
    // 开发环境：把 /api 请求代理到本地后端 Express 服务
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173
  }
});
