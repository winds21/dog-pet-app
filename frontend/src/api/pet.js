// 封装后端狗狗互动 API
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

// 获取狗狗当前状态
export const getStats = () => api.get('/stats');

// 喂食
export const feedPet = () => api.post('/feed');

// 抚摸
export const petPet = () => api.post('/pet');

// 遛狗（随机彩蛋）
export const walkPet = () => api.post('/walk');

// 洗澡
export const cleanPet = () => api.post('/clean');

// 给狗狗起名字
export const renamePet = (name) => api.post('/rename', { name });

// 切换狗狗皮肤
export const changeSkin = (skin) => api.post('/skin', { skin });

export default { getStats, feedPet, petPet, walkPet, cleanPet, renamePet, changeSkin };
