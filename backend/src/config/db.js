// SQLite 数据库配置（完全免费，零配置）
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/pet.db');

// 确保 data 目录存在
import fs from 'fs';
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建/打开数据库
const db = new Database(dbPath);

// 启用 WAL 模式（提高并发性能）
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
