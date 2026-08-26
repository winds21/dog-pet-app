// 历史记录模块（SQLite + 用户隔离版本）
import db from '../config/db.js';

// 获取最近 7 天的历史数据（按用户）
export const getWeeklyHistory = (userId) => {
  const today = new Date();
  const results = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const shortDate = `${date.getMonth() + 1}-${date.getDate()}`;
    
    const row = userId 
      ? db.prepare('SELECT * FROM pet_stats_history WHERE record_date = ? AND user_id = ?').get(dateStr, userId)
      : db.prepare('SELECT * FROM pet_stats_history WHERE record_date = ?').get(dateStr);
    
    if (row) {
      results.push({
        date: shortDate,
        satiety: row.satiety,
        happiness: row.happiness,
        intimacy: row.intimacy
      });
    } else {
      const lastKnown = results.length > 0 
        ? results[results.length - 1] 
        : { satiety: 50, happiness: 50, intimacy: 50 };
      results.push({
        date: shortDate,
        satiety: lastKnown.satiety,
        happiness: lastKnown.happiness,
        intimacy: lastKnown.intimacy
      });
    }
  }
  
  return results;
};

// 保存当日快照（按用户）
export const saveDailySnapshot = (userId) => {
  const pet = userId 
    ? db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId)
    : db.prepare('SELECT * FROM pet_stats ORDER BY id LIMIT 1').get();
  
  if (!pet) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  if (userId) {
    const existing = db.prepare('SELECT * FROM pet_stats_history WHERE record_date = ? AND user_id = ?').get(today, userId);
    if (existing) {
      db.prepare(`
        UPDATE pet_stats_history 
        SET satiety=?, happiness=?, intimacy=?, cleanliness=?, energy=?
        WHERE record_date=? AND user_id=?
      `).run(pet.satiety, pet.happiness, pet.intimacy, pet.cleanliness, pet.energy, today, userId);
    } else {
      db.prepare(`
        INSERT INTO pet_stats_history (record_date, user_id, satiety, happiness, intimacy, cleanliness, energy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(today, userId, pet.satiety, pet.happiness, pet.intimacy, pet.cleanliness, pet.energy);
    }
  } else {
    const existing = db.prepare('SELECT * FROM pet_stats_history WHERE record_date = ?').get(today);
    if (existing) {
      db.prepare(`
        UPDATE pet_stats_history 
        SET satiety=?, happiness=?, intimacy=?, cleanliness=?, energy=?
        WHERE record_date=?
      `).run(pet.satiety, pet.happiness, pet.intimacy, pet.cleanliness, pet.energy, today);
    } else {
      db.prepare(`
        INSERT INTO pet_stats_history (record_date, satiety, happiness, intimacy, cleanliness, energy)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(today, pet.satiety, pet.happiness, pet.intimacy, pet.cleanliness, pet.energy);
    }
  }
};
