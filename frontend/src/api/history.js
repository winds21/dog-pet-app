// 狗狗状态历史 API（前端折线图数据源）
import axios from 'axios';
import BASE_URL from './config.js';
import { auth } from '../stores/auth';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000
});

// 请求拦截器：添加 Authorization 头
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 未授权
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.clearAuth();
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

// 获取最近 7 天状态历史
export const getHistory = () => api.get('/history');

export default { getHistory };
