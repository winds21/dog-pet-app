// 封装后端狗狗互动 API
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/pet',
  timeout: 8000
});

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

export default { getStats, feedPet, petPet, walkPet, cleanPet, renamePet };
