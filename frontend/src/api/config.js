// API 基础配置
// 开发环境：VITE_API_BASE_URL 留空，请求走 vite proxy（/api/* → localhost:3000）
// 生产环境：未设置 VITE_API_BASE_URL 时，回退到默认 Railway 后端地址
// 在 Vercel 部署时可通过 VITE_API_BASE_URL 环境变量覆盖

const DEFAULT_PROD_BACKEND = 'https://dog-pet-app-production-8743.up.railway.app';

// 如果 VITE_API_BASE_URL 有值，直接使用；
// 如果为空且在开发模式，返回空字符串让 vite proxy 处理；
// 如果为空且在生产模式（构建后），回退到默认 Railway 地址
const isDev = import.meta.env.DEV;
const BACKEND = import.meta.env.VITE_API_BASE_URL || (isDev ? '' : DEFAULT_PROD_BACKEND);

const BASE_URL = `${BACKEND}/api/pet`;

export default BASE_URL;
