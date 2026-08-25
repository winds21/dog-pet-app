// Express 应用入口
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import petRoutes from './routes/petRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { initHistorySchema, snapshotToday, scheduleDailySnapshot } from './historyBootstrap.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// 中间件
app.use(cors());
app.use(express.json());

// 路由注册
app.use('/api/pet', petRoutes);
app.use('/api/pet', historyRoutes);
app.use('/api', historyRoutes); // /api/pet/history 已注册，这里保持兼容

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '狗狗养成后端服务运行中' });
});

// 托管前端静态文件（生产环境）
const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
import { existsSync } from 'fs';
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // 前端路由 fallback（SPA 应用）
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendDist, 'index.html'));
    }
  });
  console.log('📦 前端静态文件已托管');
}

// 启动服务
app.listen(PORT, async () => {
  console.log(`🐶 狗狗养成后端服务已启动: http://localhost:${PORT}`);

  // 启动时确保历史表存在 + 立即打今日快照 + 注册每日定时任务
  await initHistorySchema();
  await snapshotToday();
  scheduleDailySnapshot();
  console.log('📅 历史快照已就绪，每日 00:01 自动记录');
});
