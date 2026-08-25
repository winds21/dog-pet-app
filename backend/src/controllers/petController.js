// 狗狗互动控制器：获取状态、喂食、抚摸、散步、洗澡
import pool from '../config/db.js';

// 状态值上下限
const MIN = 0;
const MAX = 100;
const DECAY_INTERVAL_SECONDS = 30; // 衰减间隔
const DECAY_AMOUNT = 1; // 每次衰减量

// 互动冷却时间（秒）
const COOLDOWN = {
  feed: 10,
  pet: 5,
  walk: 30,
  clean: 60
};

// 工具：限制数值范围
const clamp = (v) => Math.max(MIN, Math.min(MAX, v));

// 心情留言池（扩展到所有状态）
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

// 根据状态生成心情留言（优先级：低状态 > 特殊状态 > 常规状态）
const generateMoodMessage = (pet) => {
  const { satiety, happiness, cleanliness, energy } = pet;
  
  // 最低状态优先
  if (satiety < 20 && happiness < 20 && energy < 20) {
    return MOOD_MESSAGES.low[Math.floor(Math.random() * MOOD_MESSAGES.low.length)];
  }
  if (satiety < 30) {
    return MOOD_MESSAGES.hungry[Math.floor(Math.random() * MOOD_MESSAGES.hungry.length)];
  }
  if (energy < 20) {
    return MOOD_MESSAGES.tired[Math.floor(Math.random() * MOOD_MESSAGES.tired.length)];
  }
  if (cleanliness < 30) {
    return MOOD_MESSAGES.dirty[Math.floor(Math.random() * MOOD_MESSAGES.dirty.length)];
  }
  
  // 高状态
  if (satiety >= 80 && happiness >= 80) {
    return MOOD_MESSAGES.highSatiety[Math.floor(Math.random() * MOOD_MESSAGES.highSatiety.length)];
  }
  if (happiness >= 80) {
    return MOOD_MESSAGES.highHappiness[Math.floor(Math.random() * MOOD_MESSAGES.highHappiness.length)];
  }
  if (cleanliness >= 90) {
    return MOOD_MESSAGES.highClean[Math.floor(Math.random() * MOOD_MESSAGES.highClean.length)];
  }
  if (energy >= 80) {
    return MOOD_MESSAGES.highEnergy[Math.floor(Math.random() * MOOD_MESSAGES.highEnergy.length)];
  }
  
  return MOOD_MESSAGES.normal[Math.floor(Math.random() * MOOD_MESSAGES.normal.length)];
};

// 执行状态衰减（基于时间差计算）
const applyDecay = (pet) => {
  const now = new Date();
  const lastDecay = pet.last_decay_at ? new Date(pet.last_decay_at) : now;
  const elapsedSeconds = Math.floor((now - lastDecay) / 1000);
  const decayCount = Math.floor(elapsedSeconds / DECAY_INTERVAL_SECONDS);
  
  if (decayCount > 0) {
    // 每30秒衰减：饱食度-1, 愉悦度-1, 清洁度-0.5, 精力值+1
    const decayAmount = decayCount * DECAY_AMOUNT;
    pet.satiety = clamp(pet.satiety - decayAmount);
    pet.happiness = clamp(pet.happiness - decayAmount);
    pet.cleanliness = clamp(pet.cleanliness - decayAmount * 0.5);
    pet.energy = clamp(pet.energy + decayAmount); // 精力自动恢复
    pet.last_decay_at = now;
  }
  return pet;
};

// 检查冷却是否完成
const isCooledDown = (lastActionTime, cooldownSeconds) => {
  if (!lastActionTime) return true;
  const elapsed = (Date.now() - new Date(lastActionTime).getTime()) / 1000;
  return elapsed >= cooldownSeconds;
};

// 计算剩余冷却时间
const remainingCooldown = (lastActionTime, cooldownSeconds) => {
  if (!lastActionTime) return 0;
  const elapsed = (Date.now() - new Date(lastActionTime).getTime()) / 1000;
  return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
};

// 初始化宠物数据（确保新字段存在）
const ensurePetInitialized = async () => {
  const [rows] = await pool.query('SELECT * FROM pet_stats ORDER BY id LIMIT 1');
  if (rows.length === 0) {
    await pool.query(`
      INSERT INTO pet_stats (pet_name, satiety, happiness, intimacy, cleanliness, energy)
      VALUES (NULL, 50, 50, 50, 80, 80)
    `);
    const [r] = await pool.query('SELECT * FROM pet_stats ORDER BY id LIMIT 1');
    return r[0];
  }
  
  // 确保新字段有默认值
  const pet = rows[0];
  const updates = [];
  if (pet.cleanliness === undefined || pet.cleanliness === null) {
    updates.push('cleanliness = 80');
  }
  if (pet.energy === undefined || pet.energy === null) {
    updates.push('energy = 80');
  }
  if (updates.length > 0) {
    await pool.query(`UPDATE pet_stats SET ${updates.join(', ')} WHERE id = ?`, [pet.id]);
    const [r] = await pool.query('SELECT * FROM pet_stats ORDER BY id LIMIT 1');
    return r[0];
  }
  
  return pet;
};

// GET /api/pet/stats —— 获取当前狗狗状态
export const getStats = async (req, res) => {
  try {
    let pet = await ensurePetInitialized();
    pet = applyDecay(pet);
    
    // 保存衰减后的状态
    await pool.query(`
      UPDATE pet_stats 
      SET satiety=?, happiness=?, cleanliness=?, energy=?, last_decay_at=?
      WHERE id=?
    `, [pet.satiety, pet.happiness, pet.cleanliness, pet.energy, pet.last_decay_at, pet.id]);
    
    const name = pet.pet_name || '';
    const message = generateMoodMessage(pet);
    
    res.json({
      ...pet,
      pet_name: name,
      mood_message: message,
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

// POST /api/pet/feed —— 喂食
export const feedPet = async (req, res) => {
  try {
    let pet = await ensurePetInitialized();
    pet = applyDecay(pet);
    
    // 冷却检查
    if (!isCooledDown(pet.last_feed_at, COOLDOWN.feed)) {
      const remaining = remainingCooldown(pet.last_feed_at, COOLDOWN.feed);
      return res.status(429).json({ error: `喂食冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    let message;
    let newSatiety;
    let newHappiness;
    
    // 过饱惩罚：饱食度 > 90 时再喂
    if (pet.satiety >= 90) {
      newSatiety = clamp(pet.satiety + 5);
      newHappiness = clamp(pet.happiness - 5);
      message = '⚠️ 狗狗吃撑了，有点不舒服！愉悦度下降';
    } else {
      newSatiety = clamp(pet.satiety + 15);
      newHappiness = clamp(pet.happiness + 2);
      message = '喂食成功，狗狗吃饱啦！';
    }
    
    await pool.query(`
      UPDATE pet_stats 
      SET satiety=?, happiness=?, last_feed_at=NOW(), last_decay_at=?
      WHERE id=?
    `, [newSatiety, newHappiness, pet.last_decay_at, pet.id]);
    
    pet.satiety = newSatiety;
    pet.happiness = newHappiness;
    
    res.json({
      message,
      satiety: newSatiety,
      happiness: newHappiness,
      intimacy: pet.intimacy,
      cleanliness: pet.cleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet)
    });
  } catch (err) {
    console.error('喂食失败:', err.message);
    res.status(500).json({ error: '喂食失败', detail: err.message });
  }
};

// POST /api/pet/pet —— 抚摸
export const petPet = async (req, res) => {
  try {
    let pet = await ensurePetInitialized();
    pet = applyDecay(pet);
    
    // 冷却检查
    if (!isCooledDown(pet.last_pet_at, COOLDOWN.pet)) {
      const remaining = remainingCooldown(pet.last_pet_at, COOLDOWN.pet);
      return res.status(429).json({ error: `抚摸冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const newHappiness = clamp(pet.happiness + 8);
    const newIntimacy = clamp(pet.intimacy + 5);
    
    await pool.query(`
      UPDATE pet_stats 
      SET happiness=?, intimacy=?, last_pet_at=NOW(), last_decay_at=?
      WHERE id=?
    `, [newHappiness, newIntimacy, pet.last_decay_at, pet.id]);
    
    pet.happiness = newHappiness;
    pet.intimacy = newIntimacy;
    
    res.json({
      message: '抚摸成功，狗狗很开心！',
      satiety: pet.satiety,
      happiness: newHappiness,
      intimacy: newIntimacy,
      cleanliness: pet.cleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet)
    });
  } catch (err) {
    console.error('抚摸失败:', err.message);
    res.status(500).json({ error: '抚摸失败', detail: err.message });
  }
};

// POST /api/pet/walk —— 遛狗
export const walkPet = async (req, res) => {
  try {
    let pet = await ensurePetInitialized();
    pet = applyDecay(pet);
    
    // 冷却检查
    if (!isCooledDown(pet.last_walk_at, COOLDOWN.walk)) {
      const remaining = remainingCooldown(pet.last_walk_at, COOLDOWN.walk);
      return res.status(429).json({ error: `散步冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    // 精力不足时散步效率低
    const energyPenalty = pet.energy < 20;
    const cleanlinessDrop = energyPenalty ? 8 : 12;
    const energyDrop = energyPenalty ? 15 : 8;
    
    // 散步消耗：清洁度下降、精力下降
    let newCleanliness = clamp(pet.cleanliness - cleanlinessDrop);
    let newEnergy = clamp(pet.energy - energyDrop);
    
    // 随机彩蛋
    const r = Math.floor(Math.random() * 3);
    let event, message;
    let happiness = pet.happiness;
    let intimacy = pet.intimacy;
    
    if (energyPenalty) {
      // 精力不足时散步没彩蛋
      event = 'tired';
      message = '狗狗太累了，散步没什么精神...';
      happiness = clamp(pet.happiness - 3);
    } else if (r === 0) {
      happiness = clamp(pet.happiness + 3);
      event = 'bone';
      message = '🦴 散步时找到一块骨头！愉悦度 +3';
    } else if (r === 1) {
      intimacy = clamp(pet.intimacy + 10);
      event = 'friend';
      message = '🤝 交到一只新朋友！亲密度 +10';
    } else {
      event = 'nothing';
      message = '今天很安静';
    }
    
    await pool.query(`
      UPDATE pet_stats 
      SET happiness=?, intimacy=?, cleanliness=?, energy=?, last_walk_at=NOW(), last_decay_at=?
      WHERE id=?
    `, [happiness, intimacy, newCleanliness, newEnergy, pet.last_decay_at, pet.id]);
    
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
      mood_message: generateMoodMessage(pet)
    });
  } catch (err) {
    console.error('遛狗失败:', err.message);
    res.status(500).json({ error: '遛狗失败', detail: err.message });
  }
};

// POST /api/pet/clean —— 洗澡
export const cleanPet = async (req, res) => {
  try {
    let pet = await ensurePetInitialized();
    pet = applyDecay(pet);
    
    // 冷却检查
    if (!isCooledDown(pet.last_clean_at, COOLDOWN.clean)) {
      const remaining = remainingCooldown(pet.last_clean_at, COOLDOWN.clean);
      return res.status(429).json({ error: `洗澡冷却中，请等 ${remaining} 秒`, cooldown: remaining });
    }
    
    const newCleanliness = clamp(pet.cleanliness + 30);
    const newHappiness = clamp(pet.happiness + 5);
    
    await pool.query(`
      UPDATE pet_stats 
      SET cleanliness=?, happiness=?, last_clean_at=NOW(), last_decay_at=?
      WHERE id=?
    `, [newCleanliness, newHappiness, pet.last_decay_at, pet.id]);
    
    pet.cleanliness = newCleanliness;
    pet.happiness = newHappiness;
    
    res.json({
      message: '🛁 洗澡成功！狗狗变干净啦~',
      satiety: pet.satiety,
      happiness: newHappiness,
      intimacy: pet.intimacy,
      cleanliness: newCleanliness,
      energy: pet.energy,
      mood_message: generateMoodMessage(pet)
    });
  } catch (err) {
    console.error('洗澡失败:', err.message);
    res.status(500).json({ error: '洗澡失败', detail: err.message });
  }
};

// POST /api/pet/rename —— 起名
export const renamePet = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: '名字不能为空' });
    }
    const trimmedName = name.trim().slice(0, 20);
    await pool.query('UPDATE pet_stats SET pet_name = ? ORDER BY id LIMIT 1', [trimmedName]);
    res.json({ message: `取名成功！狗狗现在叫「${trimmedName}」`, pet_name: trimmedName });
  } catch (err) {
    console.error('取名失败:', err.message);
    res.status(500).json({ error: '取名失败', detail: err.message });
  }
};
