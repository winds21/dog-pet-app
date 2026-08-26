// 历史记录启动引导（SQLite + 用户隔离版本）
import db from './config/db.js';
import { saveDailySnapshot } from './config/history.js';
import { authenticate } from './middleware/auth.js';

// 确保历史表存在
export const initHistorySchema = async () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pet_stats_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      record_date TEXT NOT NULL,
      satiety INTEGER NOT NULL,
      happiness INTEGER NOT NULL,
      intimacy INTEGER NOT NULL,
      cleanliness INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
};

// 立即保存今日快照（所有用户）
export const snapshotToday = async () => {
  try {
    // 保存所有用户的快照
    const users = db.prepare('SELECT id FROM users').all();
    for (const user of users) {
      saveDailySnapshot(user.id);
    }
    console.log(`✅ 今日快照已保存（${users.length} 位用户）`);
  } catch (err) {
    console.log('⚠️  快照保存失败:', err.message);
  }
};

// 每日定时快照（每分钟检查，整点附近触发）
export const scheduleDailySnapshot = () => {
  setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 1) {
      try {
        const users = db.prepare('SELECT id FROM users').all();
        for (const user of users) {
          saveDailySnapshot(user.id);
        }
        console.log(`📅 定时快照已保存 (${now.toISOString()})`);
      } catch (err) {
        console.log('⚠️  定时快照失败:', err.message);
      }
    }
  }, 60 * 1000);
};
