// 日记 API（v2 - 修复生产环境路径）
import axios from 'axios';

const isDev = import.meta.env.DEV;
const BACKEND = isDev ? '' : 'https://dog-pet-app-production-8743.up.railway.app';
const API_BASE = `${BACKEND}/api/diary`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 获取今天的日记
export const getTodayDiary = async () => {
  try {
    const response = await api.get('/today');
    return response.data.diary;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// 强制重新生成今天的日记
export const generateTodayDiary = async () => {
  const response = await api.post('/generate');
  return response.data.diary;
};

// 获取日记列表（分页）
export const getDiaryList = async (page = 1, pageSize = 5) => {
  const response = await api.get('/list', {
    params: { page, pageSize }
  });
  return response.data;
};
