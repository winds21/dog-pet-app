// 数据库升级脚本：添加新字段
import pool from '../src/config/db.js';

const upgrade = async () => {
  try {
    console.log('🔧 正在升级数据库...');
    
    // 检查字段是否存在
    const [columns] = await pool.query('SHOW COLUMNS FROM pet_stats');
    const existingColumns = columns.map(c => c.Field);
    
    // 需要添加的字段
    const newColumns = [
      { name: 'cleanliness', sql: 'ALTER TABLE pet_stats ADD COLUMN cleanliness INT NOT NULL DEFAULT 80 COMMENT "清洁度" AFTER intimacy' },
      { name: 'energy', sql: 'ALTER TABLE pet_stats ADD COLUMN energy INT NOT NULL DEFAULT 80 COMMENT "精力值" AFTER cleanliness' },
      { name: 'last_feed_at', sql: 'ALTER TABLE pet_stats ADD COLUMN last_feed_at DATETIME NULL COMMENT "最后喂食时间" AFTER energy' },
      { name: 'last_pet_at', sql: 'ALTER TABLE pet_stats ADD COLUMN last_pet_at DATETIME NULL COMMENT "最后抚摸时间" AFTER last_feed_at' },
      { name: 'last_walk_at', sql: 'ALTER TABLE pet_stats ADD COLUMN last_walk_at DATETIME NULL COMMENT "最后散步时间" AFTER last_pet_at' },
      { name: 'last_clean_at', sql: 'ALTER TABLE pet_stats ADD COLUMN last_clean_at DATETIME NULL COMMENT "最后洗澡时间" AFTER last_walk_at' },
      { name: 'last_decay_at', sql: 'ALTER TABLE pet_stats ADD COLUMN last_decay_at DATETIME NULL COMMENT "最后衰减时间" AFTER last_clean_at' }
    ];
    
    // 添加不存在的字段
    for (const col of newColumns) {
      if (!existingColumns.includes(col.name)) {
        await pool.query(col.sql);
        console.log(`  ✅ 添加字段: ${col.name}`);
      } else {
        console.log(`  ⏭️  字段 ${col.name} 已存在`);
      }
    }
    
    // 更新现有数据
    await pool.query('UPDATE pet_stats SET cleanliness = 80, energy = 80 WHERE cleanliness IS NULL OR energy IS NULL');
    console.log('✅ 现有数据已更新');
    
    console.log('\n🎉 数据库升级完成！');
  } catch (err) {
    console.error('❌ 升级失败:', err.message);
  } finally {
    await pool.end();
  }
};

upgrade();
