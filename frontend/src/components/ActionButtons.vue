<template>
  <!-- 互动按钮：喂食 / 抚摸 / 带狗狗散步 -->
  <div class="actions">
    <button class="btn feed-btn" :disabled="loading" @click="$emit('feed')">
      <span class="btn-icon">🍖</span>
      <span class="btn-text">喂 食</span>
    </button>
    <button class="btn pet-btn" :disabled="loading" @click="$emit('pet')">
      <span class="btn-icon">🤚</span>
      <span class="btn-text">抚 摸</span>
    </button>
    <button class="btn walk-btn" :disabled="loading || walking" @click="$emit('walk')">
      <span class="btn-icon">🦮</span>
      <span class="btn-text">{{ walking ? '散步中…' : '带狗狗散步' }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  walking: { type: Boolean, default: false } // 散步进行中
});

defineEmits(['feed', 'pet', 'walk']);
</script>

<style scoped>
.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 28px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.btn .btn-icon {
  font-size: 26px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-3px);
}

.btn:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feed-btn {
  background: linear-gradient(135deg, #f6a623, #e67e22);
  box-shadow: 0 6px 14px rgba(230, 126, 34, 0.4);
}

.pet-btn {
  background: linear-gradient(135deg, #ff7eb3, #ff5a8a);
  box-shadow: 0 6px 14px rgba(255, 90, 138, 0.4);
}

.walk-btn {
  background: linear-gradient(135deg, #4dd0a8, #2bab7a);
  box-shadow: 0 6px 14px rgba(43, 171, 122, 0.4);
}

/* 散步中按钮呼吸效果，提示进行中 */
.walk-btn:disabled {
  opacity: 0.75;
  animation: walkingPulse 1.2s ease-in-out infinite;
}

@keyframes walkingPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}
</style>
