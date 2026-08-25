// MySQL 数据库连接池配置
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 支持 Render 的 MYSQL_URL 环境变量（优先级最高）
let poolConfig;

if (process.env.MYSQL_URL) {
  // Render 提供的 MySQL 连接字符串
  poolConfig = process.env.MYSQL_URL;
  console.log('🔌 使用 Render 云数据库连接');
} else {
  // 本地开发配置
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  };
}

// 创建连接池
const pool = process.env.MYSQL_URL
  ? mysql.createPool(poolConfig)
  : mysql.createPool(poolConfig);

// 测试连接（仅在非 Render 环境或需要时）
pool.getConnection()
  .then(conn => {
    console.log('✅ 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
  });

export default pool;
