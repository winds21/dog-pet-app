// 天气服务 - 使用 Open-Meteo 免费 API（无需密钥）
// 文档：https://open-meteo.com/en/docs

// 默认坐标：上海
const DEFAULT_LAT = 31.2304;
const DEFAULT_LON = 121.4737;

// WMO 天气代码映射
const WEATHER_CODES = {
  0: { label: '晴天', icon: '☀️', type: 'sunny' },
  1: { label: '大部分晴朗', icon: '🌤️', type: 'sunny' },
  2: { label: '多云', icon: '⛅', type: 'cloudy' },
  3: { label: '阴天', icon: '☁️', type: 'cloudy' },
  45: { label: '雾', icon: '🌫️', type: 'cloudy' },
  48: { label: '冻雾', icon: '🌫️', type: 'cloudy' },
  51: { label: '小毛毛雨', icon: '🌦️', type: 'rainy' },
  53: { label: '中毛毛雨', icon: '🌦️', type: 'rainy' },
  55: { label: '大毛毛雨', icon: '🌧️', type: 'rainy' },
  56: { label: '冻毛毛雨', icon: '🌧️', type: 'rainy' },
  57: { label: '强冻毛毛雨', icon: '🌧️', type: 'rainy' },
  61: { label: '小雨', icon: '🌦️', type: 'rainy' },
  63: { label: '中雨', icon: '🌧️', type: 'rainy' },
  65: { label: '大雨', icon: '🌧️', type: 'rainy' },
  66: { label: '冻雨', icon: '🌧️', type: 'rainy' },
  67: { label: '强冻雨', icon: '🌧️', type: 'rainy' },
  71: { label: '小雪', icon: '🌨️', type: 'rainy' },
  73: { label: '中雪', icon: '🌨️', type: 'rainy' },
  75: { label: '大雪', icon: '❄️', type: 'rainy' },
  77: { label: '雪粒', icon: '🌨️', type: 'rainy' },
  80: { label: '小阵雨', icon: '🌦️', type: 'rainy' },
  81: { label: '中阵雨', icon: '🌧️', type: 'rainy' },
  82: { label: '强阵雨', icon: '⛈️', type: 'rainy' },
  85: { label: '小阵雪', icon: '🌨️', type: 'rainy' },
  86: { label: '强阵雪', icon: '❄️', type: 'rainy' },
  95: { label: '雷暴', icon: '⛈️', type: 'rainy' },
  96: { label: '雷暴伴小冰雹', icon: '⛈️', type: 'rainy' },
  99: { label: '雷暴伴大冰雹', icon: '⛈️', type: 'rainy' }
};

// 天气缓存
let weatherCache = {
  data: null,
  timestamp: 0
};

const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

// 获取当前天气
export const getCurrentWeather = async (lat = DEFAULT_LAT, lon = DEFAULT_LON) => {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (weatherCache.data && (now - weatherCache.timestamp) < CACHE_TTL) {
    return weatherCache.data;
  }
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&language=zh`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`天气 API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    const current = data.current_weather;
    const weatherCode = current.weathercode;
    
    const weatherInfo = WEATHER_CODES[weatherCode] || { label: '未知', icon: '❓', type: 'cloudy' };
    
    const result = {
      temperature: current.temperature,
      windspeed: current.windspeed,
      weatherCode,
      weatherType: weatherInfo.type, // sunny / cloudy / rainy
      icon: weatherInfo.icon,
      label: weatherInfo.label,
      updatedAt: new Date().toISOString()
    };
    
    // 更新缓存
    weatherCache.data = result;
    weatherCache.timestamp = now;
    
    console.log(`🌤️ 天气数据已更新: ${result.label} ${result.temperature}°C`);
    return result;
    
  } catch (err) {
    console.error('获取天气失败:', err.message);
    
    // 如果有旧缓存，返回旧缓存
    if (weatherCache.data) {
      return {
        ...weatherCache.data,
        cached: true
      };
    }
    
    // 返回默认天气
    return {
      temperature: 20,
      windspeed: 0,
      weatherCode: 0,
      weatherType: 'cloudy',
      icon: '☁️',
      label: '默认天气',
      updatedAt: new Date().toISOString(),
      error: '天气服务暂时不可用'
    };
  }
};

// 获取天气影响系数（用于影响狗狗心情变化速度）
export const getWeatherMultiplier = async () => {
  const weather = await getCurrentWeather();
  
  switch (weather.weatherType) {
    case 'sunny':
      return { happinessMultiplier: 1.5, weather };  // 晴天：愉悦度涨得快
    case 'rainy':
      return { happinessMultiplier: 0.5, weather };  // 雨天：愉悦度涨得慢
    case 'cloudy':
    default:
      return { happinessMultiplier: 1.0, weather };  // 阴天：正常速度
  }
};

// 清除缓存（用于测试）
export const clearWeatherCache = () => {
  weatherCache.data = null;
  weatherCache.timestamp = 0;
  console.log('🗑️ 天气缓存已清除');
};
