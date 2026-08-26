// API 基础配置
// 开发环境：VITE_API_BASE_URL 留空，请求走 vite proxy（/api/* → localhost:3000）
// 生产环境：VITE_API_BASE_URL 设为 Railway 后端地址

const BACKEND = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = `${BACKEND}/api/pet`;

export default BASE_URL;
