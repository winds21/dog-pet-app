// 认证 API（v2 - 修复双重路径 bug）
import axios from 'axios';

// 直接硬编码，不依赖 config.js，避免 baseURL 拼接错误
// 开发环境留空走 vite proxy，生产环境直接指向 Railway 后端
const isDev = import.meta.env.DEV;
const BACKEND = isDev ? '' : 'https://dog-pet-app-production-8743.up.railway.app';
const BASE_URL = `${BACKEND}/api/auth`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000
});

// 注册
export const register = (username, password) => 
  api.post('/register', { username, password });

// 登录
export const login = (username, password) => 
  api.post('/login', { username, password });

// 获取当前用户
export const getCurrentUser = (token) => 
  api.get('/me', { headers: { Authorization: `Bearer ${token}` } });

export default { register, login, getCurrentUser };
