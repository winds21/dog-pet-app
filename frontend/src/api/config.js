// API 基础配置（v2 - 修复生产环境路径）
// 开发环境：留空，走 vite proxy（/api/* → localhost:3000）
// 生产环境：直接指向 Railway 后端

const isDev = import.meta.env.DEV;
const BACKEND = isDev ? '' : 'https://dog-pet-app-production-8743.up.railway.app';
const BASE_URL = `${BACKEND}/api/pet`;

export default BASE_URL;
