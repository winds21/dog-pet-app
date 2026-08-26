// 历史记录路由（SQLite 版本）
import { Router } from 'express';
import { getWeeklyHistory } from '../config/history.js';

const router = Router();

// GET /api/pet/history —— 获取最近 7 天的历史数据
router.get('/history', (req, res) => {
  try {
    const history = getWeeklyHistory();
    res.json({ history });
  } catch (err) {
    console.error('获取历史失败:', err.message);
    res.status(500).json({ error: '获取历史失败', detail: err.message });
  }
});

export default router;
