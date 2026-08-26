// 认证 API
import axios from 'axios';

const BACKEND = import.meta.env.VITE_API_BASE_URL || '';
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
