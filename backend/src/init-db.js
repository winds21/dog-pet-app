// SQLite 数据库初始化脚本
import db from '../src/config/db.js';

export const initDatabase = () => {
  try {
    console.log('🔧 正在初始化 SQLite 数据库...');

    // 创建 pet_stats 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS pet_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_name TEXT,
        satiety INTEGER NOT NULL DEFAULT 50,
        happiness INTEGER NOT NULL DEFAULT 50,
        intimacy INTEGER NOT NULL DEFAULT 50,
        cleanliness INTEGER NOT NULL DEFAULT 80,
        energy INTEGER NOT NULL DEFAULT 80,
        last_feed_at TEXT,
        last_pet_at TEXT,
        last_walk_at TEXT,
        last_clean_at TEXT,
        last_decay_at TEXT
      )
    `);
    console.log('  ✅ pet_stats 表已就绪');

    // 创建 pet_stats_history 表（历史记录）
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
    console.log('  ✅ pet_stats_history 表已就绪');

    // 插入初始数据（如果不存在）
    const count = db.prepare('SELECT COUNT(*) as cnt FROM pet_stats').get().cnt;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO pet_stats (pet_name, satiety, happiness, intimacy, cleanliness, energy, last_decay_at)
        VALUES (?, 50, 50, 50, 80, 80, datetime('now'))
      `);
      insert.run(null);
      console.log('  ✅ 初始数据已插入');
    }

    console.log('🎉 SQLite 数据库初始化完成！');
  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
    throw err;
  }
};
