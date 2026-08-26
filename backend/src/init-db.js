// SQLite 数据库初始化脚本
import db from '../src/config/db.js';

export const initDatabase = () => {
  try {
    console.log('🔧 正在初始化 SQLite 数据库...');

    // 创建 users 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('  ✅ users 表已就绪');

    // 创建 pet_stats 表（关联用户 + 互动计数）
    db.exec(`
      CREATE TABLE IF NOT EXISTS pet_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
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
        last_decay_at TEXT,
        today_feed_count INTEGER NOT NULL DEFAULT 0,
        today_pet_count INTEGER NOT NULL DEFAULT 0,
        today_walk_count INTEGER NOT NULL DEFAULT 0,
        today_clean_count INTEGER NOT NULL DEFAULT 0,
        diary_date TEXT,
        skin TEXT NOT NULL DEFAULT 'default',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('  ✅ pet_stats 表已就绪');

    // 创建 pet_stats_history 表（历史记录）
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
    console.log('  ✅ pet_stats_history 表已就绪');

    // 创建 pet_diary 表（狗狗日记）
    db.exec(`
      CREATE TABLE IF NOT EXISTS pet_diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        diary_date TEXT NOT NULL,
        content TEXT NOT NULL,
        mood INTEGER NOT NULL,
        feed_count INTEGER NOT NULL DEFAULT 0,
        pet_count INTEGER NOT NULL DEFAULT 0,
        walk_count INTEGER NOT NULL DEFAULT 0,
        clean_count INTEGER NOT NULL DEFAULT 0,
        weather_type TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, diary_date)
      )
    `);
    console.log('  ✅ pet_diary 表已就绪');

    // 迁移：为 pet_stats 表添加新的计数字段（如果不存在）
    const columnsToAdd = [
      ['today_feed_count', 'INTEGER NOT NULL DEFAULT 0'],
      ['today_pet_count', 'INTEGER NOT NULL DEFAULT 0'],
      ['today_walk_count', 'INTEGER NOT NULL DEFAULT 0'],
      ['today_clean_count', 'INTEGER NOT NULL DEFAULT 0'],
      ['diary_date', 'TEXT'],
      ['skin', "TEXT NOT NULL DEFAULT 'default'"]
    ];
    
    const existingColumns = db.prepare("PRAGMA table_info(pet_stats)").all();
    const existingColumnNames = existingColumns.map(c => c.name);
    
    for (const [colName, colDef] of columnsToAdd) {
      if (!existingColumnNames.includes(colName)) {
        db.exec(`ALTER TABLE pet_stats ADD COLUMN ${colName} ${colDef}`);
        console.log(`  ⬆️ 已添加字段: ${colName}`);
      }
    }
    
    console.log('🎉 SQLite 数据库初始化完成！');
  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
    throw err;
  }
};
