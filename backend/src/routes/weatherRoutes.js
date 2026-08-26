// 天气 API 路由
import { Router } from 'express';
import { getCurrentWeather, getWeatherMultiplier, clearWeatherCache } from '../services/weatherService.js';

const router = Router();

// GET /api/weather/current - 获取当前天气
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const weather = await getCurrentWeather(lat, lon);
    res.json({ weather });
  } catch (err) {
    console.error('获取天气失败:', err.message);
    res.status(500).json({ error: '获取天气失败', detail: err.message });
  }
});

// GET /api/weather/multiplier - 获取天气影响系数
router.get('/multiplier', async (req, res) => {
  try {
    const result = await getWeatherMultiplier();
    res.json(result);
  } catch (err) {
    console.error('获取天气系数失败:', err.message);
    res.status(500).json({ error: '获取天气系数失败' });
  }
});

// POST /api/weather/refresh - 强制刷新天气缓存
router.post('/refresh', (req, res) => {
  clearWeatherCache();
  res.json({ message: '天气缓存已清除，下次请求将重新获取' });
});

export default router;
