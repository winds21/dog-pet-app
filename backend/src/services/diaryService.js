// 狗狗日记服务 - 根据状态生成有趣日记
import db from '../config/db.js';
import { getCurrentWeather } from './weatherService.js';

// 根据心情值获取情绪描述
const getMoodDescription = (happiness) => {
  if (happiness >= 80) return '超级开心';
  if (happiness >= 60) return '心情不错';
  if (happiness >= 40) return '还算平静';
  if (happiness >= 20) return '有点郁闷';
  return '非常难过';
};

// 获取天气描述
const getWeatherDescription = (weatherType) => {
  switch (weatherType) {
    case 'sunny': return '☀️ 今天阳光明媚';
    case 'rainy': return '🌧️ 今天下起了小雨';
    case 'cloudy': return '☁️ 今天是个阴天';
    default: return '今天天气不错';
  }
};

// 生成日记正文
export const generateDiaryContent = (stats, weatherType = 'cloudy') => {
  const { satiety, happiness, feed_count, pet_count, walk_count, clean_count } = stats;
  
  const paragraphs = [];
  const name = stats.pet_name || '我';
  const weatherDesc = getWeatherDescription(weatherType);
  
  paragraphs.push(`${weatherDesc}，${name}的一天开始啦！`);
  
  if (feed_count === 0) {
    paragraphs.push('可是主人好像忘记给我吃饭了，肚子饿得咕咕叫...🐾');
  } else if (feed_count <= 2) {
    paragraphs.push(`今天主人喂了我${feed_count}次饭，虽然不算多，但味道还是不错的！🍖`);
  } else if (feed_count <= 5) {
    paragraphs.push(`今天吃了${feed_count}顿饭，肚子圆滚滚的，有点撑了~🤰`);
  } else {
    paragraphs.push(`哇！今天竟然吃了${feed_count}顿饭！主人是不是把我当成小猪了？🐷`);
  }
  
  if (pet_count === 0) {
    paragraphs.push('主人今天好像很忙，都没有摸我的头...😿');
  } else if (pet_count <= 3) {
    paragraphs.push(`今天被摸了${pet_count}次头，虽然不多，但每次都让我好开心！💕`);
  } else {
    paragraphs.push(`今天主人摸了我${pet_count}次头！我感觉自己是世界上最幸福的狗狗！🐾✨`);
  }
  
  if (walk_count === 0) {
    paragraphs.push('没有出门散步，只能在家里打转...🏠💭');
  } else if (walk_count === 1) {
    paragraphs.push(`今天出去散了${walk_count}次步，看到了好多有趣的东西！🦮`);
  } else {
    paragraphs.push(`今天散了${walk_count}次步！我感觉自己都要变成运动健将了！🏃‍♂️💨`);
  }
  
  if (clean_count > 0) {
    paragraphs.push(`今天洗了${clean_count}次澡，毛都香香的~🫧`);
  }
  
  const moodDesc = getMoodDescription(happiness);
  if (happiness >= 70) {
    paragraphs.push(`总的来说，今天真的是${moodDesc}的一天！🎉`);
  } else if (happiness >= 40) {
    paragraphs.push(`今天${moodDesc}，希望明天能更开心一些~🌙`);
  } else {
    paragraphs.push(`今天过得${moodDesc}，好想被主人多陪陪...💔`);
  }
  
  return paragraphs.join('');
};

// 生成当天日记
export const generateTodayDiary = async (userId, forceRegenerate = false) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const pet = db.prepare('SELECT * FROM pet_stats WHERE user_id = ?').get(userId);
    if (!pet) {
      return { success: false, error: '宠物数据不存在' };
    }
    
    // 获取天气
    let weatherType = 'cloudy';
    try {
      const weather = await getCurrentWeather();
      weatherType = weather.weatherType || 'cloudy';
    } catch (e) {
      // 忽略天气获取失败
    }
    
    // 如果已经有今天的日记且不强制重新生成，返回已有内容
    const existing = db.prepare('SELECT * FROM pet_diary WHERE user_id = ? AND diary_date = ?').get(userId, today);
    if (existing && !forceRegenerate) {
      return { success: true, diary: existing };
    }
    
    // 如果强制重新生成或没有今天的日记，先删除旧的（如果有）
    if (existing) {
      db.prepare('DELETE FROM pet_diary WHERE user_id = ? AND diary_date = ?').run(userId, today);
    }
    
    // 映射字段名
    const diaryStats = {
      ...pet,
      feed_count: pet.today_feed_count || 0,
      pet_count: pet.today_pet_count || 0,
      walk_count: pet.today_walk_count || 0,
      clean_count: pet.today_clean_count || 0
    };
    const content = generateDiaryContent(diaryStats, weatherType);
    
    const result = db.prepare(`
      INSERT INTO pet_diary (user_id, diary_date, content, mood, feed_count, pet_count, walk_count, clean_count, weather_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      today,
      content,
      pet.happiness,
      pet.today_feed_count || 0,
      pet.today_pet_count || 0,
      pet.today_walk_count || 0,
      pet.today_clean_count || 0,
      weatherType
    );
    
    const diary = db.prepare('SELECT * FROM pet_diary WHERE id = ?').get(result.lastInsertRowid);
    return { success: true, diary };
    
  } catch (err) {
    console.error('生成日记失败:', err.message);
    return { success: false, error: err.message };
  }
};

// 获取日记列表（分页）
export const getDiaryList = (userId, page = 1, pageSize = 5) => {
  try {
    const offset = (page - 1) * pageSize;
    
    const total = db.prepare('SELECT COUNT(*) as cnt FROM pet_diary WHERE user_id = ?').get(userId).cnt;
    const totalPages = Math.ceil(total / pageSize);
    
    const list = db.prepare(`
      SELECT * FROM pet_diary 
      WHERE user_id = ? 
      ORDER BY diary_date DESC 
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);
    
    return {
      list,
      page,
      pageSize,
      total,
      totalPages
    };
    
  } catch (err) {
    console.error('获取日记列表失败:', err.message);
    return { list: [], page: 1, pageSize: 5, total: 0, totalPages: 0 };
  }
};

// 获取今天的日记（如果没有则生成）
export const getTodayDiary = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = db.prepare('SELECT * FROM pet_diary WHERE user_id = ? AND diary_date = ?').get(userId, today);
    if (existing) {
      return existing;
    }
    
    const result = await generateTodayDiary(userId);
    if (result.success) {
      return result.diary;
    }
    
    return null;
    
  } catch (err) {
    console.error('获取今日日记失败:', err.message);
    return null;
  }
};

// 获取某一天的日记
export const getDiaryByDate = (userId, date) => {
  try {
    return db.prepare('SELECT * FROM pet_diary WHERE user_id = ? AND diary_date = ?').get(userId, date);
  } catch (err) {
    return null;
  }
};
