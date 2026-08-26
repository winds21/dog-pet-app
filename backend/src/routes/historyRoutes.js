// 历史记录路由（SQLite + 用户隔离版本）
import { Router } from 'express';
import { getWeeklyHistory } from '../config/history.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/pet/history —— 获取最近 7 天的历史数据（需要认证）
router.get('/history', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    const history = getWeeklyHistory(userId);
    res.json({ history });
  } catch (err) {
    console.error('获取历史失败:', err.message);
    res.status(500).json({ error: '获取历史失败', detail: err.message });
  }
});

export default router;
