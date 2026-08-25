// 状态历史快照管理：打快照、查询、自动初始化 7 天数据
import pool from './db.js';

const TODAY_SQL = `CURDATE()`;

// 1. 为今天打一条快照（若今天已有则更新为当前最新状态）
export const snapshotToday = async () => {
  const [rows] = await pool.query('SELECT * FROM pet_stats ORDER BY id LIMIT 1');
  if (rows.length === 0) return null;
  const pet = rows[0];

  // 今日已存在则更新，否则插入（ON DUPLICATE KEY UPDATE）
  await pool.query(
    `INSERT INTO pet_stats_history (record_date, satiety, happiness, intimacy)
     VALUES (${TODAY_SQL}, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       satiety = VALUES(satiety),
       happiness = VALUES(happiness),
       intimacy = VALUES(intimacy)`,
    [pet.satiety, pet.happiness, pet.intimacy]
  );
  return pet;
};

// 2. 查询最近 N 天历史（不足会自动补齐模拟数据）
export const getRecentHistory = async (days = 7) => {
  // 先确保今天有快照
  await snapshotToday();

  // 拉最近 N 天
  const [rows] = await pool.query(
    `SELECT record_date, satiety, happiness, intimacy
       FROM pet_stats_history
      WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY record_date ASC`,
    [days - 1]
  );

  // 若不足 days 条，补齐缺失日期（用最接近的历史值填充，确保折线连续）
  if (rows.length < days) {
    return fillMissingDates(rows, days);
  }
  return rows;
};

// 3. 补齐缺失日期，生成完整 7 天序列
const fillMissingDates = (rows, days) => {
  const result = [];
  const today = new Date();
  let lastValues = { satiety: 50, happiness: 50, intimacy: 50 };

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const found = rows.find((r) => {
      const rDate = r.record_date instanceof Date
        ? r.record_date.toISOString().slice(0, 10)
        : String(r.record_date).slice(0, 10);
      return rDate === dateStr;
    });

    if (found) {
      lastValues = {
        satiety: found.satiety,
        happiness: found.happiness,
        intimacy: found.intimacy
      };
      result.push(found);
    } else {
      // 用上一已知值填充，保证折线连续不中断
      result.push({
        record_date: dateStr,
        satiety: lastValues.satiety,
        happiness: lastValues.happiness,
        intimacy: lastValues.intimacy
      });
    }
  }
  return result;
};
