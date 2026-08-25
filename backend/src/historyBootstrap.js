// 历史快照引导：启动时建表、每日定时打快照
import pool from './config/db.js';
import { snapshotToday } from './config/history.js';

// 1. 启动时确保历史表存在（单条建表 SQL，不依赖 multipleStatements）
export const initHistorySchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pet_db.pet_stats_history (
        id            INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        record_date   DATE NOT NULL COMMENT '记录日期',
        satiety       INT NOT NULL DEFAULT 50 COMMENT '当日饱食度',
        happiness     INT NOT NULL DEFAULT 50 COMMENT '当日愉悦度',
        intimacy      INT NOT NULL DEFAULT 50 COMMENT '当日亲密度',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        UNIQUE KEY uk_record_date (record_date) COMMENT '按日期唯一'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='狗狗状态历史快照'
    `);
    console.log('✅ pet_stats_history 表已就绪');
  } catch (err) {
    console.error('⚠️ 历史表初始化失败:', err.message);
  }
};

// 2. 每天定时打快照：使用 setInterval 简易实现（每日 00:01 左右）
//    开发环境足够，生产环境建议改用 node-cron
export const scheduleDailySnapshot = () => {
  // 计算到明天 00:01 的毫秒数
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 1, 0, 0); // 明天 00:01
  const msUntilNext = next - now;

  // 先设一个定时器到明天 00:01
  setTimeout(() => {
    snapshotToday();
    // 之后每 24 小时一次
    setInterval(snapshotToday, 24 * 60 * 60 * 1000);
    console.log('⏰ 已启动每日快照定时任务');
  }, msUntilNext);
};

export { snapshotToday };
