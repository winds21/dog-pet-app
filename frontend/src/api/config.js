// API 基础配置
// 开发环境：使用 vite proxy（/api/pet → localhost:3000）
// 生产环境：通过 VITE_API_BASE_URL 指向 Cyclic 后端

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/pet';

export default BASE_URL;
