// 狗狗互动控制器（SQLite + 用户隔离 + 天气影响版本）
import db from '../config/db.js';
import { getWeatherMultiplier } from '../services/weatherService.js';

// 状态值上下限
const MIN = 0;
const MAX = 100;
const DECAY_INTERVAL_MS = 30 * 1000; // 30秒
const DECAY_AMOUNT = 1;

// 互动冷却时间（毫秒）
const COOLDOWN = {
  feed: 10 * 1000,
  pet: 5 * 1000,
  walk: 30 * 1000,
  clean: 60 * 1000
};

// 工具：限制数值范围
const clamp = (v) => Math.max(MIN, Math.min(MAX, Math.round(v)));

// 心情留言池
const MOOD_MESSAGES = {
  highSatiety: [
    '吃得好饱，开心！',
    '主人做的饭真好吃~',
    '肚子圆滚滚，想睡觉了'
  ],
  highHappiness: [
    '今天好开心呀！',
    '主人陪我玩真幸福~',
    '尾巴摇得停不下来！'
  ],
  highClean: [
    '干干净净真舒服~',
    '洗完澡好凉快！',
    '主人，我香喷喷的'
  ],
  highEnergy: [
    '精力充沛，想出去玩！',
    '我有劲！带我跑！',
    '汪汪！我想运动！'
  ],
  normal: [
    '主人，我想出去散步',
    '有点无聊，陪我玩会儿吧',
    '汪汪，主人在吗？'
  ],
  hungry: [
    '肚子饿了...主人在哪？',
    '呜呜，我想吃东西',
    '好饿呀，给我点吃的吧'
  ],
  dirty: [
    '身上有点脏，想洗澡',
    '主人，我该洗澡了',
    '蹭脏了，快帮我洗'
  ],
  tired: [
    '好累...想睡觉',
    '没力气了，让我休息',
    '主人，我需要休息'
  ],
  low: [
    '有点饿，也有点无聊',
    '呜呜，主人不要我了吗',
    '好饿...好想有人陪'
  ]
};

// 根据状态生成心情留言
const generateMoodMessage = (pet) => {
  const { satiety, happiness, cleanliness, energy } = pet;
  
  if (satiety < 20 && happiness < 20 && energy < 20) {
    return pick(MOOD_MESSAGES.low);
  }
  if (satiety < 30) {
    return pick(MOOD_MESSAGES.hungry);
  }
  if (energy < 20) {
    return pick(MOOD_MESSAGES.tired);
  }
  if (cleanliness < 30) {
    return pick(MOOD_MESSAGES.dirty);
  }
  if (satiety >= 80 && happiness >= 80) {
    return pick(MOOD_MESSAGES.highSatiety);
  }
  if (happiness >= 80) {
    return pick(MOOD_MESSAGES.highHappiness);
  }
  if (cleanliness >= 90) {
    return pick(MOOD_MESSAGES.highClean);
  }
  if (energy >= 80) {
    return pick(MOOD_MESSAGES.highEnergy);
  }
  return pick(MOOD_MESSAGES.normal);
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 执行状态衰减
const applyDecay = (pet) => {
  const now = Date.now();
  const lastDecay = pet.last_decay_at ? new Date(pet.last_decay_at).getTime() : now;
  const elapsed = now - lastDecay;
  const decayCount = Math.floor(elapsed / DECAY_INTERVAL_MS);
  
  if (decayCount > 0) {
    const amount = decayCount * DECAY_AMOUNT;
    pet.satiety = clamp(pet.satiety - amount);
    pet.happiness = clamp(pet.happiness - amount);
    pet.cleanliness = clamp(pet.cleanliness - amount * 0.5);
    pet.energy = clamp(pet.energy + amount);
    pet.last_decay_at = new Date(now).toISOString();
  }
  return pet;
};

// 检查冷却
const isCooledDown = (lastTime, cooldownMs) => {
  if (!lastTime) return true;
  return (Date.now() - new Date(lastTime).getTime()) >= cooldownMs;
};

const remainingCooldown = (lastTime, cooldownMs) => {
  if (!lastTime) return 0;
  const elapsed = Date.now() - new Date(lastTime).getTime();
  return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
};

// 初始化宠物数据（按用户）
const ensurePetInitialized = (userId) => {
  let pet = db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId);
  
  if (!pet) {
    const result = db.prepare(`
      INSERT INTO pet_stats (user_id, pet_name, satiety, happiness, intimacy, cleanliness, energy, last_decay_at)
      VALUES (?, null, 50, 50, 50, 80, 80, ?)
    `).run(userId, new Date().toISOString());
    pet = db.prepare('SELECT * FROM pet_stats WHERE id = ?').get(result.lastInsertRowid);
  }
  
  // 确保新字段有默认值
  if (pet.cleanliness === null || pet.cleanliness === undefined) {
    pet.cleanliness = 80;
    db.prepare('UPDATE pet_stats SET cleanliness = 80 WHERE id = ?').run(pet.id);
  }
  if (pet.energy === null || pet.energy === undefined) {
    pet.energy = 80;
    db.prepare('UPDATE pet_stats SET energy = 80 WHERE id = ?').run(pet.id);
  }
  
  // 确保计数字段有默认值
  if (pet.today_feed_count === null || pet.today_feed_count === undefined) {
    pet.today_feed_count = 0;
  }
  if (pet.today_pet_count === null || pet.today_pet_count === undefined) {
    pet.today_pet_count = 0;
  }
  if (pet.today_walk_count === null || pet.today_walk_count === undefined) {
    pet.today_walk_count = 0;
  }
  if (pet.today_clean_count === null || pet.today_clean_count === undefined) {
    pet.today_clean_count = 0;
  }
  
  // 确保皮肤字段有默认值
  if (!pet.skin) {
    pet.skin = 'default';
    db.prepare("UPDATE pet_stats SET skin = 'default' WHERE id = ?").run(pet.id);
  }
  
  // 如果日期变了，重置每日计数器
  const today = new Date().toISOString().split('T')[0];
  if (pet.diary_date !== today) {
    db.prepare(`
      UPDATE pet_stats 
      SET today_feed_count = 0, today_pet_count = 0, today_walk_count = 0, today_clean_count = 0,
          diary_date = ?
      WHERE id = ?
    `).run(today, pet.id);
    pet.today_feed_count = 0;
    pet.today_pet_count = 0;
    pet.today_walk_count = 0;
    pet.today_clean_count = 0;
    pet.diary_date = today;
  }
  
  return pet;
};

// 增加互动次数
const incrementCount = (petId, field) => {
  db.prepare(`UPDATE pet_stats SET ${field} = ${field} + 1 WHERE id = ?`).run(petId);
};

// GET /api/pet/stats
export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pet = ensurePetInitialized(userId);
    pet = applyDecay(pet);
    
    // 保存衰减后的状态
    db.prepare(`
      UPDATE pet_stats 
      SET satiety=?, happiness=?, cleanliness=?, energy=?, last_decay_at=?
      WHERE id=?
    `).run(pet.satiety, pet.happiness, pet.cleanliness, pet.energy, pet.last_decay_at, pet.id);
    
    // 重新获取完整数据
    pet = db.prepare('SELECT * FROM pet_stats WHERE id = ?').get(pet.id);
    
    const name = pet.pet_name || '';
    const message = generateMoodMessage(pet);
    
    // 获取天气信息
    const { weather } = await getWeatherMultiplier();
    
    res.json({
      ...pet,
      pet_name: name,
      mood_message: message,
      weather,
      cooldowns: {
        feed: remainingCooldown(pet.last_feed_at, COOLDOWN.feed),
        pet: remainingCooldown(pet.last_pet_at, COOLDOWN.pet),
        walk: remainingCooldown(pet.last_walk_at, COOLDOWN.walk),
        clean: remainingCooldown(pet.last_clean_at, COOLDOWN.clean)
      }
    });
  } catch (err) {
    console.error('获取状态失败:', err.message);
    res.status(500).json({ error: '获取状态失败', detail: err.message });
  }
};

// POST /api/pet/feed
export const feedPet = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pet = ensurePetInitialized(userId);
    pet = applyDecay(pet);
    
    if (!isCooledDown(pet.last_feed_at, COOLDOWN.feed)) {
      const remaining = remainingCooldown(pet.last_feed_at, COOLDOWN.feed);
      return res.status(429).json({ error: `喂食冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const { happinessMultiplier, weather } = await getWeatherMultiplier();
    
    let message;
    let newSatiety;
    let newHappiness;
    
    if (pet.satiety >= 90) {
      newSatiety = clamp(pet.satiety + 5);
      newHappiness = clamp(pet.happiness - 5);
      message = '⚠️ 狗狗吃撑了，有点不舒服！愉悦度下降';
    } else {
      newSatiety = clamp(pet.satiety + 15);
      const baseHappinessGain = 2;
      const weatheredGain = Math.round(baseHappinessGain * happinessMultiplier);
      newHappiness = clamp(pet.happiness + weatheredGain);
      message = `喂食成功，狗狗吃饱啦！${weather.weatherType === 'sunny' ? '☀️ 好天气让它更开心！' : weather.weatherType === 'rainy' ? '🌧️ 下雨天它有点不开心...' : ''}`;
    }
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE pet_stats 
      SET satiety=?, happiness=?, last_feed_at=?, last_decay_at=?
      WHERE id=?
    `).run(newSatiety, newHappiness, now, pet.last_decay_at, pet.id);
    
    incrementCount(pet.id, 'today_feed_count');
    
    pet.satiety = newSatiety;
    pet.happiness = newHappiness;
    
    res.json({
      message,
      satiety: newSatiety,
      happiness: newHappiness,
      intimacy: pet.intimacy,
      cleanliness: pet.cleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet),
      weather
    });
  } catch (err) {
    console.error('喂食失败:', err.message);
    res.status(500).json({ error: '喂食失败', detail: err.message });
  }
};

// POST /api/pet/pet
export const petPet = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pet = ensurePetInitialized(userId);
    pet = applyDecay(pet);
    
    if (!isCooledDown(pet.last_pet_at, COOLDOWN.pet)) {
      const remaining = remainingCooldown(pet.last_pet_at, COOLDOWN.pet);
      return res.status(429).json({ error: `抚摸冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const { happinessMultiplier, weather } = await getWeatherMultiplier();
    
    const baseHappinessGain = 8;
    const weatheredGain = Math.round(baseHappinessGain * happinessMultiplier);
    const newHappiness = clamp(pet.happiness + weatheredGain);
    const newIntimacy = clamp(pet.intimacy + 5);
    const now = new Date().toISOString();
    
    let weatherMsg = '';
    if (weather.weatherType === 'sunny') {
      weatherMsg = '☀️ 阳光明媚，狗狗特别享受！';
    } else if (weather.weatherType === 'rainy') {
      weatherMsg = '🌧️ 下雨天狗狗心情一般...';
    }
    
    db.prepare(`
      UPDATE pet_stats 
      SET happiness=?, intimacy=?, last_pet_at=?, last_decay_at=?
      WHERE id=?
    `).run(newHappiness, newIntimacy, now, pet.last_decay_at, pet.id);
    
    incrementCount(pet.id, 'today_pet_count');
    
    pet.happiness = newHappiness;
    pet.intimacy = newIntimacy;
    
    res.json({
      message: `抚摸成功，狗狗很开心！${weatherMsg}`,
      satiety: pet.satiety,
      happiness: newHappiness,
      intimacy: newIntimacy,
      cleanliness: pet.cleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet),
      weather
    });
  } catch (err) {
    console.error('抚摸失败:', err.message);
    res.status(500).json({ error: '抚摸失败', detail: err.message });
  }
};

// POST /api/pet/walk
export const walkPet = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pet = ensurePetInitialized(userId);
    pet = applyDecay(pet);
    
    if (!isCooledDown(pet.last_walk_at, COOLDOWN.walk)) {
      const remaining = remainingCooldown(pet.last_walk_at, COOLDOWN.walk);
      return res.status(429).json({ error: `散步冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const { happinessMultiplier, weather } = await getWeatherMultiplier();
    
    const energyPenalty = pet.energy < 20;
    // 雨天散步清洁度下降更多
    const baseCleanlinessDrop = weather.weatherType === 'rainy' ? 18 : 12;
    const cleanlinessDrop = energyPenalty ? Math.round(baseCleanlinessDrop * 0.7) : baseCleanlinessDrop;
    const energyDrop = energyPenalty ? 15 : (weather.weatherType === 'rainy' ? 12 : 8);
    
    let newCleanliness = clamp(pet.cleanliness - cleanlinessDrop);
    let newEnergy = clamp(pet.energy - energyDrop);
    
    const r = Math.floor(Math.random() * 3);
    let event, message;
    let happiness = pet.happiness;
    let intimacy = pet.intimacy;
    
    if (energyPenalty) {
      event = 'tired';
      message = '狗狗太累了，散步没什么精神...';
      happiness = clamp(pet.happiness - 3);
    } else if (weather.weatherType === 'rainy') {
      // 雨天散步：愉悦度下降
      happiness = clamp(pet.happiness - 5);
      event = 'rainy';
      message = '🌧️ 下雨散步，狗狗全身湿透了，心情不好...';
      newCleanliness = clamp(newCleanliness - 5);
    } else if (r === 0) {
      const gain = Math.round(3 * happinessMultiplier);
      happiness = clamp(pet.happiness + gain);
      event = 'bone';
      message = weather.weatherType === 'sunny' 
        ? `🦴 好天气！散步时找到一块骨头！愉悦度 +${gain}`
        : `🦴 散步时找到一块骨头！愉悦度 +${gain}`;
    } else if (r === 1) {
      intimacy = clamp(pet.intimacy + 10);
      event = 'friend';
      message = weather.weatherType === 'sunny'
        ? '🤝 阳光明媚！交到一只新朋友！亲密度 +10'
        : '🤝 交到一只新朋友！亲密度 +10';
    } else {
      event = 'nothing';
      message = weather.weatherType === 'sunny' 
        ? '☀️ 今天天气很好，散步很愉快'
        : '今天很安静';
      // 好天气给基础愉悦加成
      if (weather.weatherType === 'sunny') {
        happiness = clamp(pet.happiness + Math.round(2 * happinessMultiplier));
      }
    }
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE pet_stats 
      SET happiness=?, intimacy=?, cleanliness=?, energy=?, last_walk_at=?, last_decay_at=?
      WHERE id=?
    `).run(happiness, intimacy, newCleanliness, newEnergy, now, pet.last_decay_at, pet.id);
    
    incrementCount(pet.id, 'today_walk_count');
    
    pet.happiness = happiness;
    pet.intimacy = intimacy;
    pet.cleanliness = newCleanliness;
    pet.energy = newEnergy;
    
    res.json({
      event,
      message,
      satiety: pet.satiety,
      happiness,
      intimacy,
      cleanliness: newCleanliness,
      energy: newEnergy,
      mood_message: generateMoodMessage(pet),
      weather
    });
  } catch (err) {
    console.error('遛狗失败:', err.message);
    res.status(500).json({ error: '遛狗失败', detail: err.message });
  }
};

// POST /api/pet/clean
export const cleanPet = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pet = ensurePetInitialized(userId);
    pet = applyDecay(pet);
    
    if (!isCooledDown(pet.last_clean_at, COOLDOWN.clean)) {
      const remaining = remainingCooldown(pet.last_clean_at, COOLDOWN.clean);
      return res.status(429).json({ error: `洗澡冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const { happinessMultiplier, weather } = await getWeatherMultiplier();
    
    const newCleanliness = clamp(pet.cleanliness + 30);
    const baseHappinessGain = 5;
    const weatheredGain = Math.round(baseHappinessGain * happinessMultiplier);
    const newHappiness = clamp(pet.happiness + weatheredGain);
    const now = new Date().toISOString();
    
    let weatherMsg = '';
    if (weather.weatherType === 'rainy') {
      weatherMsg = '🌧️ 下雨天洗澡，狗狗不太开心...';
    } else if (weather.weatherType === 'sunny') {
      weatherMsg = '☀️ 好天气！洗完澡狗狗特别舒服~';
    }
    
    db.prepare(`
      UPDATE pet_stats 
      SET cleanliness=?, happiness=?, last_clean_at=?, last_decay_at=?
      WHERE id=?
    `).run(newCleanliness, newHappiness, now, pet.last_decay_at, pet.id);
    
    incrementCount(pet.id, 'today_clean_count');
    
    pet.cleanliness = newCleanliness;
    pet.happiness = newHappiness;
    
    res.json({
      message: `🛁 洗澡成功！狗狗变干净啦~ ${weatherMsg}`,
      satiety: pet.satiety,
      happiness: newHappiness,
      intimacy: pet.intimacy,
      cleanliness: newCleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet),
      weather
    });
  } catch (err) {
    console.error('洗澡失败:', err.message);
    res.status(500).json({ error: '洗澡失败', detail: err.message });
  }
};

// POST /api/pet/rename
export const renamePet = (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: '名字不能为空' });
    }
    const trimmedName = name.trim().slice(0, 20);
    db.prepare('UPDATE pet_stats SET pet_name = ? WHERE user_id = ?').run(trimmedName, userId);
    res.json({ message: `取名成功！狗狗现在叫「${trimmedName}」`, pet_name: trimmedName });
  } catch (err) {
    console.error('取名失败:', err.message);
    res.status(500).json({ error: '取名失败', detail: err.message });
  }
};

// 允许的皮肤列表
const ALLOWED_SKINS = ['default', 'hat', 'cape'];

// POST /api/pet/skin
export const changeSkin = (req, res) => {
  try {
    const userId = req.user.userId;
    const { skin } = req.body;
    if (!skin || !ALLOWED_SKINS.includes(skin)) {
      return res.status(400).json({ error: '无效的皮肤类型' });
    }
    db.prepare('UPDATE pet_stats SET skin = ? WHERE user_id = ?').run(skin, userId);
    res.json({ message: `皮肤已切换为「${skin}」`, skin });
  } catch (err) {
    console.error('切换皮肤失败:', err.message);
    res.status(500).json({ error: '切换皮肤失败', detail: err.message });
  }
};
