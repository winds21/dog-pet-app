// SQLite 数据库配置（完全免费，零配置）
// 在 Cyclic 上自动使用持久化存储（CYCLIC_STACK_DATA_PATH）
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 优先使用 Cyclic 持久化存储路径，否则使用本地 data/ 目录
const storagePath = process.env.CYCLIC_STACK_DATA_PATH 
  ? path.join(process.env.CYCLIC_STACK_DATA_PATH, 'pet.db')
  : path.join(__dirname, '../../data/pet.db');

// 确保数据目录存在
const dataDir = path.dirname(storagePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建/打开数据库
const db = new Database(storagePath);

// 启用 WAL 模式（提高并发性能）
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`🗄️  数据库路径: ${storagePath}`);
export default db;
