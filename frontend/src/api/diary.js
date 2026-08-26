// 日记 API
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

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
    const response = await api.get('/api/diary/today');
    return response.data.diary;
  } catch (error) {
    // 如果 404，可能还没有日记
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// 强制重新生成今天的日记
export const generateTodayDiary = async () => {
  const response = await api.post('/api/diary/generate');
  return response.data.diary;
};

// 获取日记列表（分页）
export const getDiaryList = async (page = 1, pageSize = 5) => {
  const response = await api.get('/api/diary/list', {
    params: { page, pageSize }
  });
  return response.data;
};
