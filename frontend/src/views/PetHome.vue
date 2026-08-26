<template>
  <div class="pet-home">
    <!-- 用户信息栏 -->
    <nav class="user-nav">
      <div class="user-info">
        <span class="user-avatar">🐾</span>
        <span class="user-name">{{ auth.user.value?.username || '用户' }}</span>
      </div>
      <div class="weather-info" v-if="stats.weather">
        <span class="weather-icon">{{ stats.weather.icon }}</span>
        <span class="weather-text">
          {{ stats.weather.label }} 
          <span class="weather-temp">{{ stats.weather.temperature }}°C</span>
        </span>
      </div>
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </nav>

    <header class="page-header">
      <h1>🐶 狗狗养成乐园</h1>
      <p class="subtitle">陪伴你的专属小狗，让它快乐成长</p>
    </header>

    <!-- 取名区域 -->
    <div class="rename-box">
      <input
        v-model="renameInput"
        type="text"
        class="rename-input"
        placeholder="给狗狗起个名字吧..."
        maxlength="20"
        @keyup.enter="onRename"
      />
      <button class="rename-btn" :disabled="renaming" @click="onRename">
        {{ renaming ? '保存中...' : '取名' }}
      </button>
    </div>

    <div class="layout">
      <!-- 左侧：狗狗周报折线图 -->
      <aside class="chart-side">
        <WeeklyChart ref="chartRef" />
      </aside>

      <!-- 右侧：主互动卡片 -->
      <main class="card">
        <!-- 狗狗展示 -->
        <DogDisplay
          :satiety="stats.satiety"
          :happiness="stats.happiness"
          :effects="effects"
          :winking="winking"
          :bubble-visible="bubbleVisible"
          :bubble-text="bubbleText"
          :skin="currentSkin"
        />

        <!-- 心情留言对话框 -->
        <div class="mood-dialog">
          <div class="mood-bubble" :class="{ 'warning': needsAttention }">
            <span class="mood-text">"{{ moodMessage }}"</span>
          </div>
          <div class="mood-arrow" :class="{ 'warning': needsAttention }"></div>
        </div>

        <!-- 名字与提示 -->
        <div class="pet-info">
          <h2>{{ displayName }}</h2>
          <p class="message" :class="{ shake: message }">{{ message }}</p>
        </div>

        <!-- 状态指标 -->
        <div class="stats-box">
          <StatusBar label="饱食度" icon="🍖" :value="stats.satiety" color="#e67e22" />
          <StatusBar label="愉悦度" icon="😊" :value="stats.happiness" color="#ff5a8a" />
          <StatusBar label="清洁度" icon="🫧" :value="stats.cleanliness" color="#3498db" />
          <StatusBar label="精力值" icon="⚡" :value="stats.energy" color="#f39c12" />
          <StatusBar label="亲密度" icon="💞" :value="stats.intimacy" color="#9b59b6" />
        </div>

        <!-- 互动按钮 -->
        <div class="actions-row">
          <button
            class="action-btn feed"
            :disabled="loading || !!cooldowns.feed"
            :title="cooldowns.feed ? `喂食冷却中 ${cooldowns.feed}s` : '喂食'"
            @click="onFeed"
          >
            <span class="btn-icon">🍖</span>
            <span class="btn-label">{{ cooldowns.feed ? `${cooldowns.feed}s` : '喂食' }}</span>
          </button>
          <button
            class="action-btn pet"
            :disabled="loading || !!cooldowns.pet"
            :title="cooldowns.pet ? `抚摸冷却中 ${cooldowns.pet}s` : '抚摸'"
            @click="onPet"
          >
            <span class="btn-icon">🤚</span>
            <span class="btn-label">{{ cooldowns.pet ? `${cooldowns.pet}s` : '抚摸' }}</span>
          </button>
          <button
            class="action-btn walk"
            :disabled="loading || walking || !!cooldowns.walk"
            :title="cooldowns.walk ? `散步冷却中 ${cooldowns.walk}s` : '带狗散步'"
            @click="onWalk"
          >
            <span class="btn-icon">🦮</span>
            <span class="btn-label">{{ walking ? '散步中...' : (cooldowns.walk ? `${cooldowns.walk}s` : '散步') }}</span>
          </button>
          <button
            class="action-btn clean"
            :disabled="loading || !!cooldowns.clean"
            :title="cooldowns.clean ? `洗澡冷却中 ${cooldowns.clean}s` : '洗澡'"
            @click="onClean"
          >
            <span class="btn-icon">🛁</span>
            <span class="btn-label">{{ cooldowns.clean ? `${cooldowns.clean}s` : '洗澡' }}</span>
          </button>
        </div>

        <!-- 换装按钮 -->
        <div class="skin-row">
          <span class="skin-title">🎨 换装</span>
          <div class="skin-options">
            <button
              v-for="opt in skinOptions"
              :key="opt.value"
              class="skin-btn"
              :class="[`skin-${opt.value}`, { active: currentSkin === opt.value }]"
              :disabled="skinChanging"
              :title="opt.label"
              @click="onSkinChange(opt.value)"
            >
              <span class="skin-emoji">{{ opt.emoji }}</span>
              <span class="skin-name">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- 衰减提示 -->
        <p class="decay-tip">
          💡 状态每 30 秒自动变化，多互动让狗狗开心！
          <span v-if="stats.weather" class="weather-impact" :class="stats.weather.weatherType">
            · {{ weatherImpactText }}
          </span>
        </p>
      </main>
    </div>

    <!-- 狗狗日记 -->
    <div class="diary-section">
      <div class="diary-header" @click="diaryExpanded = !diaryExpanded">
        <span class="diary-title">📖 狗狗日记</span>
        <div class="diary-actions">
          <button 
            class="diary-btn history-btn" 
            @click.stop="toggleHistory"
          >
            {{ diaryViewHistory ? '关闭历史' : '查看历史' }}
          </button>
          <button 
            class="diary-btn" 
            :disabled="diaryLoading" 
            @click.stop="regenerateDiary"
          >
            {{ diaryLoading ? '生成中...' : '重新生成' }}
          </button>
          <span class="diary-toggle">{{ diaryExpanded ? '▲' : '▼' }}</span>
        </div>
      </div>
      
      <!-- 历史日记列表 -->
      <div v-if="diaryViewHistory" class="history-view">
        <div v-if="historyLoading" class="diary-loading">加载中...</div>
        <div v-else-if="historyList.length === 0" class="diary-empty">暂无历史日记</div>
        <div v-else class="history-list">
          <div v-for="item in historyList" :key="item.id" class="history-item">
            <div class="history-item-header">
              <span class="history-date">{{ formatDate(item.diary_date) }}</span>
              <span class="history-weather">{{ getWeatherIcon(item.weather_type) }}</span>
              <span class="history-mood">{{ getMoodDesc(item.mood) }}</span>
            </div>
            <p class="history-content">{{ item.content }}</p>
            <div class="history-stats">
              <span>🍖 喂食 {{ item.feed_count }}次</span>
              <span>🤚 抚摸 {{ item.pet_count }}次</span>
              <span>🦮 散步 {{ item.walk_count }}次</span>
              <span>🛁 洗澡 {{ item.clean_count }}次</span>
            </div>
          </div>
        </div>
        <!-- 分页 -->
        <div v-if="historyTotalPages > 1" class="pagination">
          <button 
            class="page-btn" 
            :disabled="historyPage <= 1 || historyLoading"
            @click="goHistoryPage(historyPage - 1)"
          >
            上一页
          </button>
          <span class="page-info">{{ historyPage }} / {{ historyTotalPages }}</span>
          <button 
            class="page-btn" 
            :disabled="historyPage >= historyTotalPages || historyLoading"
            @click="goHistoryPage(historyPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
      
      <!-- 今日日记 -->
      <div v-show="diaryExpanded" class="diary-content">
        <div v-if="diaryLoading && !todayDiary" class="diary-loading">正在生成日记...</div>
        <div v-else-if="todayDiary" class="diary-entry">
          <div class="diary-entry-header">
            <span class="diary-date">{{ formatDate(todayDiary.diary_date) }}</span>
            <span class="diary-weather">{{ getWeatherIcon(todayDiary.weather_type) }}</span>
            <span class="diary-mood">{{ getMoodDesc(todayDiary.mood) }}</span>
          </div>
          <p class="diary-text">{{ todayDiary.content }}</p>
          <div class="diary-stats">
            <span>🍖 喂食 {{ todayDiary.feed_count }}次</span>
            <span>🤚 抚摸 {{ todayDiary.pet_count }}次</span>
            <span>🦮 散步 {{ todayDiary.walk_count }}次</span>
            <span>🛁 洗澡 {{ todayDiary.clean_count }}次</span>
          </div>
        </div>
        <div v-else class="diary-empty">
          今天还没有日记，快和狗狗互动吧！
        </div>
      </div>
    </div>

    <footer class="page-footer">
      数据存储于 SQLite · dog-pet-app
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import DogDisplay from '../components/DogDisplay.vue';
import StatusBar from '../components/StatusBar.vue';
import WeeklyChart from '../components/WeeklyChart.vue';
import { getStats, feedPet, petPet, walkPet, cleanPet, renamePet, changeSkin } from '../api/pet';
import { getTodayDiary, generateTodayDiary, getDiaryList } from '../api/diary';
import { auth } from '../stores/auth';

const router = useRouter();

// 登出
const handleLogout = () => {
  auth.clearAuth();
  router.push('/login');
};

const chartRef = ref(null);

// 狗狗状态
const stats = reactive({
  pet_name: '',
  satiety: 50,
  happiness: 50,
  intimacy: 50,
  cleanliness: 80,
  energy: 80,
  mood_message: ''
});

// 冷却时间（秒）
const cooldowns = reactive({
  feed: 0,
  pet: 0,
  walk: 0,
  clean: 0
});

// 需要关注的状态（显示警告样式）
const needsAttention = computed(() => {
  return stats.satiety < 30 || stats.happiness < 30 || stats.cleanliness < 30 || stats.energy < 20;
});

const displayName = computed(() => stats.pet_name || '小狗狗');
const moodMessage = computed(() => stats.mood_message || '汪汪，主人好！');
const weatherImpactText = computed(() => {
  if (!stats.weather) return '';
  switch (stats.weather.weatherType) {
    case 'sunny': return '☀️ 晴天：心情愉悦度增长 +50%';
    case 'rainy': return '🌧️ 雨天：心情愉悦度增长 -50%';
    case 'cloudy': return '☁️ 阴天：心情愉悦度正常';
    default: return '';
  }
});

const renameInput = ref('');
const renaming = ref(false);
const loading = ref(false);
const message = ref('');
const effects = ref([]);
let effectId = 0;

const winking = ref(false);
const bubbleVisible = ref(false);
const bubbleText = ref('');
let winkTimer = null;
let bubbleTimer = null;

const walking = ref(false);
let walkTimer = null;
let refreshTimer = null;

// 皮肤相关状态
const currentSkin = ref('default');
const skinChanging = ref(false);
const skinOptions = [
  { value: 'default', label: '默认款', emoji: '🐶' },
  { value: 'hat', label: '戴帽子', emoji: '🎩' },
  { value: 'cape', label: '穿披风', emoji: '🦸' }
];

// 日记相关状态
const todayDiary = ref(null);
const diaryLoading = ref(false);
const diaryExpanded = ref(true);
const diaryViewHistory = ref(false);
const historyList = ref([]);
const historyPage = ref(1);
const historyTotal = ref(0);
const historyTotalPages = ref(1);
const historyLoading = ref(false);

// 触发眨眼动画
const triggerWink = () => {
  winking.value = true;
  clearTimeout(winkTimer);
  winkTimer = setTimeout(() => {
    winking.value = false;
  }, 600);
};

// 弹出气泡对话框
const showBubble = (text) => {
  bubbleText.value = text;
  bubbleVisible.value = true;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    bubbleVisible.value = false;
  }, 3000);
};

// 拉取后端最新状态
const loadStats = async () => {
  try {
    const { data } = await getStats();
    Object.assign(stats, data);
    // 同步皮肤
    if (data.skin) {
      currentSkin.value = data.skin;
    }
    // 更新冷却时间
    if (data.cooldowns) {
      cooldowns.feed = data.cooldowns.feed || 0;
      cooldowns.pet = data.cooldowns.pet || 0;
      cooldowns.walk = data.cooldowns.walk || 0;
      cooldowns.clean = data.cooldowns.clean || 0;
    }
  } catch (err) {
    console.error(err);
  }
};

// 切换皮肤
const onSkinChange = async (skin) => {
  if (skin === currentSkin.value || skinChanging.value) return;
  skinChanging.value = true;
  const prevSkin = currentSkin.value;
  // 乐观更新：先切换外观，让用户立刻看到效果
  currentSkin.value = skin;
  try {
    const { data } = await changeSkin(skin);
    showMessage(data.message);
    showBubble(`换了新造型，汪~`);
  } catch (err) {
    // 失败回滚
    currentSkin.value = prevSkin;
    showMessage('⚠️ 切换皮肤失败，请重试');
  } finally {
    skinChanging.value = false;
  }
};

// 每秒刷新冷却倒计时
const tickCooldowns = () => {
  for (const key of Object.keys(cooldowns)) {
    if (cooldowns[key] > 0) {
      cooldowns[key] = Math.max(0, cooldowns[key] - 1);
    }
  }
};

// 每 30 秒从服务器拉取最新状态（衰减）
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadStats();
  }, 30000);
};

const addEffect = (type) => {
  const id = ++effectId;
  const x = 30 + Math.random() * 40;
  effects.value.push({ id, type, x });
  setTimeout(() => {
    effects.value = effects.value.filter((e) => e.id !== id);
  }, 1200);
};

const showMessage = (msg) => {
  message.value = '';
  requestAnimationFrame(() => (message.value = msg));
};

const refreshChart = () => {
  chartRef.value?.refresh();
};

// 取名
const onRename = async () => {
  const name = renameInput.value.trim();
  if (!name) {
    showMessage('⚠️ 请输入名字');
    return;
  }
  renaming.value = true;
  try {
    const { data } = await renamePet(name);
    stats.pet_name = data.pet_name;
    renameInput.value = '';
    showMessage(data.message);
    showBubble(`我叫「${data.pet_name}」啦！`);
  } catch (err) {
    showMessage('⚠️ 取名失败，请重试');
  } finally {
    renaming.value = false;
  }
};

// 通用错误处理（冷却提示）
const handleActionError = (err, action) => {
  if (err.response?.status === 429) {
    const cd = err.response.data.cooldown;
    showMessage(`${action}冷却中，请等 ${cd} 秒`);
    if (cd) cooldowns[getCooldownKey(action)] = cd;
  } else {
    showMessage(`${action}失败，请重试`);
  }
};

const getCooldownKey = (action) => {
  const map = { '喂食': 'feed', '抚摸': 'pet', '散步': 'walk', '洗澡': 'clean' };
  return map[action] || 'feed';
};

// 喂食
const onFeed = async () => {
  loading.value = true;
  try {
    const { data } = await feedPet();
    Object.assign(stats, data);
    addEffect('feed');
    showMessage(data.message);
    triggerWink();
    showBubble('汪汪！谢谢主人！');
    cooldowns.feed = 10;
    loadStats();
    refreshChart();
  } catch (err) {
    handleActionError(err, '喂食');
  } finally {
    loading.value = false;
  }
};

// 抚摸
const onPet = async () => {
  loading.value = true;
  try {
    const { data } = await petPet();
    Object.assign(stats, data);
    addEffect('pet');
    showMessage(data.message);
    cooldowns.pet = 5;
    loadStats();
    refreshChart();
  } catch (err) {
    handleActionError(err, '抚摸');
  } finally {
    loading.value = false;
  }
};

// 遛狗
const onWalk = () => {
  if (walking.value) return;
  walking.value = true;
  loading.value = true;
  showBubble('散步中……🦮');

  clearTimeout(walkTimer);
  walkTimer = setTimeout(async () => {
    try {
      const { data } = await walkPet();
      Object.assign(stats, data);
      showBubble(data.message);
      showMessage(data.message);
      cooldowns.walk = 30;
      loadStats();
      refreshChart();
    } catch (err) {
      handleActionError(err, '散步');
    } finally {
      walking.value = false;
      loading.value = false;
    }
  }, 3000);
};

// 洗澡
const onClean = async () => {
  loading.value = true;
  try {
    const { data } = await cleanPet();
    Object.assign(stats, data);
    showMessage(data.message);
    showBubble('🛁 好干净呀~');
    cooldowns.clean = 60;
    loadStats();
    refreshChart();
  } catch (err) {
    handleActionError(err, '洗澡');
  } finally {
    loading.value = false;
  }
};

// 加载今天的日记
const loadTodayDiary = async () => {
  diaryLoading.value = true;
  try {
    const diary = await getTodayDiary();
    todayDiary.value = diary;
  } catch (err) {
    console.error('加载日记失败:', err);
  } finally {
    diaryLoading.value = false;
  }
};

// 强制重新生成今天的日记
const regenerateDiary = async () => {
  diaryLoading.value = true;
  try {
    const diary = await generateTodayDiary();
    todayDiary.value = diary;
  } catch (err) {
    console.error('生成日记失败:', err);
    showMessage('日记生成失败');
  } finally {
    diaryLoading.value = false;
  }
};

// 加载历史日记列表
const loadHistory = async (page = 1) => {
  historyLoading.value = true;
  try {
    const result = await getDiaryList(page, 5);
    historyList.value = result.list || [];
    historyPage.value = result.page;
    historyTotal.value = result.total;
    historyTotalPages.value = result.totalPages;
  } catch (err) {
    console.error('加载历史日记失败:', err);
  } finally {
    historyLoading.value = false;
  }
};

// 切换历史页
const goHistoryPage = (page) => {
  if (page < 1 || page > historyTotalPages.value) return;
  loadHistory(page);
};

// 切换历史视图
const toggleHistory = () => {
  diaryViewHistory.value = !diaryViewHistory.value;
  if (diaryViewHistory.value && historyList.value.length === 0) {
    loadHistory(1);
  }
};

// 获取心情描述
const getMoodDesc = (mood) => {
  if (mood >= 70) return '开心';
  if (mood >= 40) return '平静';
  return '难过';
};

// 获取天气图标
const getWeatherIcon = (type) => {
  switch (type) {
    case 'sunny': return '☀️';
    case 'cloudy': return '☁️';
    case 'rainy': return '🌧️';
    default: return '🌤️';
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

onMounted(() => {
  loadStats();
  loadTodayDiary();
  setInterval(tickCooldowns, 1000);
  startAutoRefresh();
});

onUnmounted(() => {
  clearInterval(refreshTimer);
  clearTimeout(walkTimer);
  clearTimeout(winkTimer);
  clearTimeout(bubbleTimer);
});
</script>

<style scoped>
.pet-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 40px;
}

/* 用户导航栏 */
.user-nav {
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  font-size: 24px;
}

.user-name {
  font-weight: 600;
  color: #5a3e2b;
  font-size: 14px;
}

.logout-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* 天气信息 */
.weather-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #e0f7fa, #e8f5e9);
  border-radius: 10px;
  border: 1px solid #b2dfdb;
}

.weather-icon {
  font-size: 22px;
}

.weather-text {
  font-size: 13px;
  color: #00695c;
  font-weight: 500;
}

.weather-temp {
  font-weight: 600;
  color: #004d40;
  margin-left: 4px;
}

.weather-impact {
  font-weight: 600;
  margin-left: 6px;
}

.weather-impact.sunny {
  color: #e67e22;
}

.weather-impact.rainy {
  color: #2980b9;
}

.weather-impact.cloudy {
  color: #7f8c8d;
}

.page-header {
  text-align: center;
  margin-bottom: 12px;
}

.page-header h1 {
  font-size: 28px;
  color: #5a3e2b;
}

.subtitle {
  margin-top: 6px;
  color: #9c7a5b;
  font-size: 14px;
}

/* 取名区域 */
.rename-box {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  width: 100%;
  max-width: 440px;
}

.rename-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e8d8c0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}

.rename-input:focus {
  border-color: #e67e22;
}

.rename-input::placeholder {
  color: #c9b896;
}

.rename-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.rename-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.35);
}

.rename-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 布局容器 */
.layout {
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: center;
}

.chart-side {
  position: absolute;
  right: 100%;
  margin-right: 24px;
  width: 340px;
}

.card {
  width: 480px;
  flex: none;
  background: #fff;
  border-radius: 24px;
  padding: 24px 28px 20px;
  box-shadow: 0 12px 30px rgba(120, 80, 40, 0.15);
}

/* 心情留言对话框 */
.mood-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: -8px auto 10px;
  width: 90%;
  max-width: 320px;
}

.mood-bubble {
  background: linear-gradient(135deg, #fff9f0, #fff3e0);
  border: 2px solid #ffe4c4;
  border-radius: 20px;
  padding: 10px 18px;
  position: relative;
  box-shadow: 0 4px 10px rgba(230, 126, 34, 0.12);
  animation: bubbleFloat 3s ease-in-out infinite;
  transition: all 0.3s;
}

.mood-bubble.warning {
  border-color: #e74c3c;
  background: linear-gradient(135deg, #ffeaea, #ffd6d6);
  animation: bubbleFloat 1.5s ease-in-out infinite;
}

.mood-text {
  font-size: 14px;
  font-weight: 600;
  color: #8a6a4a;
  font-style: italic;
  text-align: center;
}

.mood-bubble.warning .mood-text {
  color: #c0392b;
}

.mood-arrow {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #ffe4c4;
  margin-top: -1px;
}

.mood-arrow.warning {
  border-top-color: #e74c3c;
}

@keyframes bubbleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* 状态面板 */
.pet-info {
  text-align: center;
  margin: 6px 0 12px;
}

.pet-info h2 {
  font-size: 22px;
  color: #5a3e2b;
}

.message {
  min-height: 22px;
  margin-top: 4px;
  font-size: 14px;
  color: #e67e22;
  font-weight: 600;
}

.message.shake {
  animation: pop 0.4s ease;
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}

.stats-box {
  background: #fff8ef;
  border-radius: 16px;
  padding: 14px 18px 4px;
  margin-bottom: 16px;
}

/* 互动按钮行 */
.actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  font-weight: 600;
  min-height: 60px;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.action-btn:not(:disabled):active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn .btn-icon {
  font-size: 22px;
}

.action-btn .btn-label {
  font-size: 12px;
}

.action-btn.feed {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.action-btn.pet {
  background: linear-gradient(135deg, #ff5a8a, #e91e63);
}

.action-btn.walk {
  background: linear-gradient(135deg, #1abc9c, #16a085);
}

.action-btn.clean {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

/* 换装按钮 */
.skin-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px 8px;
}

.skin-title {
  font-size: 13px;
  font-weight: 700;
  color: #8a5a2b;
  flex-shrink: 0;
}

.skin-options {
  display: flex;
  gap: 8px;
  flex: 1;
}

.skin-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border: 2px solid #ffd4a3;
  border-radius: 12px;
  background: #fff8ef;
  color: #8a5a2b;
  cursor: pointer;
  transition: all 0.2s;
}

.skin-btn:hover:not(:disabled) {
  border-color: #ffa94d;
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 169, 77, 0.25);
}

.skin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skin-btn.active {
  border-color: #ff7f50;
  background: linear-gradient(135deg, #ffe4c4, #ffd4a3);
  box-shadow: 0 4px 14px rgba(255, 127, 80, 0.3);
}

.skin-emoji {
  font-size: 20px;
  line-height: 1;
}

.skin-name {
  font-size: 11px;
  font-weight: 600;
}

.decay-tip {
  text-align: center;
  font-size: 11px;
  color: #b08d6e;
  margin: 0;
}

/* 小屏响应式 */
@media (max-width: 800px) {
  .layout {
    max-width: 480px;
    flex-direction: column;
    align-items: center;
  }
  .chart-side {
    position: static;
    right: auto;
    margin-right: 0;
    width: 100%;
    max-width: 480px;
    margin-bottom: 16px;
  }
}

@media (max-width: 500px) {
  .card {
    width: 100%;
    padding: 20px 18px 16px;
  }
  .actions-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.page-footer {
  margin-top: 24px;
  font-size: 13px;
  color: #b08d6e;
}

/* 日记区域 */
.diary-section {
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
  background: #fff8ef;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(139, 90, 43, 0.1);
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffe4c4, #ffd4a3);
  cursor: pointer;
  transition: background 0.2s;
}

.diary-header:hover {
  background: linear-gradient(135deg, #ffd4a3, #ffc87a);
}

.diary-title {
  font-size: 18px;
  font-weight: 700;
  color: #8a5a2b;
}

.diary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.diary-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #d4a574;
  border-radius: 8px;
  font-size: 12px;
  color: #8a5a2b;
  cursor: pointer;
  transition: all 0.2s;
}

.diary-btn:hover:not(:disabled) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.2);
}

.diary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.diary-toggle {
  font-size: 12px;
  color: #8a5a2b;
}

.diary-content {
  padding: 20px;
}

.diary-loading, .diary-empty {
  text-align: center;
  padding: 20px;
  color: #b08d6e;
  font-size: 14px;
}

.diary-entry {
  background: #fff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(139, 90, 43, 0.08);
}

.diary-entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.diary-date {
  font-weight: 600;
  color: #8a5a2b;
  font-size: 14px;
}

.diary-weather {
  font-size: 18px;
}

.diary-mood {
  padding: 3px 10px;
  background: #ffe4c4;
  border-radius: 12px;
  font-size: 12px;
  color: #8a5a2b;
  font-weight: 500;
}

.diary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #5a3e2b;
  white-space: pre-wrap;
  margin: 0 0 12px;
  font-style: italic;
}

.diary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #ffe4c4;
}

.diary-stats span {
  font-size: 12px;
  color: #b08d6e;
  background: #fff8ef;
  padding: 4px 10px;
  border-radius: 8px;
}

/* 历史日记视图 */
.history-view {
  padding: 16px 20px;
  border-top: 1px solid #ffe4c4;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.history-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 6px rgba(139, 90, 43, 0.06);
}

.history-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.history-date {
  font-weight: 600;
  color: #8a5a2b;
  font-size: 13px;
}

.history-weather {
  font-size: 16px;
}

.history-mood {
  padding: 2px 8px;
  background: #ffe4c4;
  border-radius: 10px;
  font-size: 11px;
  color: #8a5a2b;
}

.history-content {
  font-size: 14px;
  line-height: 1.6;
  color: #5a3e2b;
  margin: 0 0 8px;
  white-space: pre-wrap;
}

.history-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-stats span {
  font-size: 11px;
  color: #b08d6e;
  background: #fff8ef;
  padding: 3px 8px;
  border-radius: 6px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #ffe4c4;
}

.page-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #ffc87a, #ffa94d);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(255, 169, 77, 0.4);
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #8a5a2b;
  font-weight: 600;
}

@media (max-width: 500px) {
  .diary-stats, .history-stats {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
