<template>
  <div class="pet-home">
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

        <!-- 衰减提示 -->
        <p class="decay-tip">💡 状态每 30 秒自动变化，多互动让狗狗开心！</p>
      </main>
    </div>

    <footer class="page-footer">
      数据存储于 MySQL · pet_db.pet_stats
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import DogDisplay from '../components/DogDisplay.vue';
import StatusBar from '../components/StatusBar.vue';
import WeeklyChart from '../components/WeeklyChart.vue';
import { getStats, feedPet, petPet, walkPet, cleanPet, renamePet } from '../api/pet';

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

onMounted(() => {
  loadStats();
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
</style>
