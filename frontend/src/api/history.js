// 狗狗状态历史 API（前端折线图数据源）
import axios from 'axios';
import BASE_URL from './config.js';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000
});

// 获取最近 7 天状态历史
export const getHistory = () => api.get('/history');

export default { getHistory };
