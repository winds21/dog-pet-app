// 诊断脚本：查看 pet_db 现有表结构与数据
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
});

const run = async () => {
  try {
    // 1. pet_db 是否存在
    const [dbs] = await pool.query("SHOW DATABASES LIKE 'pet_db'");
    console.log('pet_db 是否存在:', dbs.length > 0);

    if (dbs.length === 0) {
      console.log('👉 库都不存在，说明报错另有原因');
      return;
    }

    // 2. pet_stats 表是否存在 + 列结构
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'pet_db' AND TABLE_NAME = 'pet_stats'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\npet_stats 现有列结构:');
    if (cols.length === 0) {
      console.log('  （表不存在）');
    } else {
      console.table(cols);
    }

    // 3. 现有数据
    try {
      const [rows] = await pool.query('SELECT * FROM pet_db.pet_stats LIMIT 5');
      console.log('\npet_stats 现有数据:', rows.length, '行');
      console.table(rows);
    } catch (e) {
      console.log('\n读取数据失败:', e.message);
    }
  } catch (err) {
    console.error('诊断失败:', err.code, err.message);
  } finally {
    await pool.end();
  }
};

run();
