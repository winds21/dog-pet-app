// 历史记录启动引导（SQLite 版本）
import db from './config/db.js';
import { saveDailySnapshot } from './config/history.js';

// 确保历史表存在
export const initHistorySchema = async () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pet_stats_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date TEXT NOT NULL UNIQUE,
      satiety INTEGER NOT NULL,
      happiness INTEGER NOT NULL,
      intimacy INTEGER NOT NULL,
      cleanliness INTEGER NOT NULL,
      energy INTEGER NOT NULL
    )
  `);
};

// 立即保存今日快照
export const snapshotToday = async () => {
  try {
    saveDailySnapshot();
    console.log('✅ 今日快照已保存');
  } catch (err) {
    console.log('⚠️  快照保存失败:', err.message);
  }
};

// 每日定时快照（每小时检查一次，00:01 附近会触发）
export const scheduleDailySnapshot = () => {
  setInterval(() => {
    const now = new Date();
    // 每小时的第 1 分钟执行一次（确保每天 00:01 左右会触发）
    if (now.getMinutes() === 1) {
      saveDailySnapshot();
      console.log(`📅 定时快照已保存 (${now.toISOString()})`);
    }
  }, 60 * 1000); // 每分钟检查
};
