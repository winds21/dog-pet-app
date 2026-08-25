<template>
  <!-- 单条状态指标 -->
  <div class="stat-row">
    <div class="stat-label">
      <span class="icon">{{ icon }}</span>
      <span class="name">{{ label }}</span>
      <span class="value">{{ value }}/100</span>
    </div>
    <div class="bar-bg">
      <div class="bar-fill" :style="barStyle"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true }, // 状态名称
  icon: { type: String, default: '📊' },    // 图标
  value: { type: Number, default: 0 },     // 当前值 0-100
  color: { type: String, default: '#4caf50' } // 进度条颜色
});

// 计算进度条样式（宽度 + 颜色 + 过渡动画）
const barStyle = computed(() => ({
  width: Math.max(0, Math.min(100, props.value)) + '%',
  background: props.color,
  transition: 'width 0.5s ease'
}));
</script>

<style scoped>
.stat-row {
  margin-bottom: 14px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
}

.stat-label .value {
  margin-left: auto;
  font-weight: 500;
  color: #8a7158;
}

.bar-bg {
  width: 100%;
  height: 14px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4) inset;
}
</style>
