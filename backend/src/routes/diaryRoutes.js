// 日记 API 路由
import { Router } from 'express';
import { generateTodayDiary, getDiaryList, getTodayDiary } from '../services/diaryService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/diary/today - 获取今天的日记（没有则自动生成）
router.get('/today', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const diary = await getTodayDiary(userId);
    res.json({ diary });
  } catch (err) {
    console.error('获取今日日记失败:', err.message);
    res.status(500).json({ error: '获取日记失败' });
  }
});

// POST /api/diary/generate - 强制重新生成今天的日记
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await generateTodayDiary(userId, true);
    if (result.success) {
      res.json({ diary: result.diary });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error('生成日记失败:', err.message);
    res.status(500).json({ error: '生成日记失败' });
  }
});

// GET /api/diary/list - 获取日记列表（分页）
router.get('/list', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    
    const result = getDiaryList(userId, page, pageSize);
    res.json(result);
  } catch (err) {
    console.error('获取日记列表失败:', err.message);
    res.status(500).json({ error: '获取日记列表失败' });
  }
});

export default router;
