// 狗狗历史与图表相关路由
import { Router } from 'express';
import pool from '../config/db.js';
import { getRecentHistory } from '../config/history.js';

const router = Router();

// GET /api/pet/history  —— 获取最近 7 天状态历史（用于折线图）
router.get('/history', async (req, res) => {
  try {
    const days = 7;
    const rows = await getRecentHistory(days);

    // 整理为前端友好格式
    const data = rows.map((r) => {
      // 统一日期格式为 YYYY-MM-DD
      const dateStr = r.record_date instanceof Date
        ? r.record_date.toISOString().slice(0, 10)
        : String(r.record_date).slice(0, 10);
      return {
        date: dateStr,
        satiety: r.satiety,
        happiness: r.happiness,
        intimacy: r.intimacy
      };
    });

    res.json({ days, data });
  } catch (err) {
    console.error('获取历史失败:', err.message);
    res.status(500).json({ error: '获取历史失败', detail: err.message });
  }
});

export default router;
