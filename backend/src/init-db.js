// 数据库初始化脚本：读取 .env 配置，连接 MySQL 并执行 init.sql
// 用法：先在 .env 填好 DB_PASSWORD，然后执行  node src/init-db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', '..', 'database', 'init.sql');

// 不指定 database，开启 multipleStatements 以便一次执行整段 SQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
});

const run = async () => {
  // 简单校验密码是否仍是占位符
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'your_password_here') {
    console.error('❌ 请先在 backend/.env 中填写真实的 DB_PASSWORD');
    process.exit(1);
  }

  try {
    const sql = readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('✅ 数据库初始化成功：已创建 pet_db 库与 pet_stats 表');

    // 查看初始化结果
    const [rows] = await pool.query('SELECT * FROM pet_db.pet_stats');
    console.table(rows);
  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
