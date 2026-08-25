<template>
  <div class="dog-stage">
    <!-- 漂浮特效 -->
    <transition-group name="float" tag="div" class="effects">
      <span
        v-for="e in effects"
        :key="e.id"
        class="effect"
        :style="{ left: e.x + '%' }"
      >{{ e.type === 'feed' ? '🦴' : '💗' }}</span>
    </transition-group>

    <!-- 气泡对话框 -->
    <transition name="bubble">
      <div v-if="bubbleVisible" class="bubble">
        <span class="bubble-text">{{ bubbleText }}</span>
      </div>
    </transition>

    <!-- 狗狗主体 -->
    <div class="dog" :class="[moodClass, actionClass]">
      <div class="dog-svg-wrapper" :key="animationKey">
        <!-- SVG 卡通狗狗 -->
        <svg viewBox="0 0 200 220" width="180" height="200" class="dog-svg">
          <!-- 身体 -->
          <ellipse cx="100" cy="190" rx="55" ry="18" fill="#D2A679" opacity="0.3"/>
          
          <!-- 头 -->
          <ellipse cx="100" cy="105" rx="70" ry="65" fill="#C98953"/>
          <!-- 脸部浅色区域 -->
          <ellipse cx="100" cy="120" rx="50" ry="45" fill="#F5DEB3"/>
          
          <!-- 左耳 -->
          <path d="M 45 85 Q 35 60 50 45 Q 65 60 60 90 Z" fill="#A8713C"/>
          <!-- 右耳 -->
          <path d="M 155 85 Q 165 60 150 45 Q 135 60 140 90 Z" fill="#A8713C"/>
          <!-- 耳朵内部 -->
          <path d="M 50 75 Q 45 65 53 55 Q 60 65 58 78 Z" fill="#E8B885"/>
          <path d="M 150 75 Q 155 65 147 55 Q 140 65 142 78 Z" fill="#E8B885"/>
          
          <!-- 眼睛 -->
          <g class="eyes">
            <!-- 左眼 -->
            <g class="eye left-eye" :class="{ 'eye-closed': leftEyeClosed }">
              <circle cx="75" cy="95" r="8" :fill="eyeColor"/>
              <circle cx="77" cy="93" r="2.5" fill="#fff"/>
              <!-- 闭眼弧线 -->
              <path v-if="leftEyeClosed" d="M 68 95 Q 75 90 82 95" stroke="#4A3420" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </g>
            <!-- 右眼 -->
            <g class="eye right-eye" :class="{ 'eye-closed': rightEyeClosed }">
              <circle cx="125" cy="95" r="8" :fill="eyeColor"/>
              <circle cx="127" cy="93" r="2.5" fill="#fff"/>
              <!-- 闭眼弧线 -->
              <path v-if="rightEyeClosed" d="M 118 95 Q 125 90 132 95" stroke="#4A3420" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </g>
          </g>
          
          <!-- 鼻子 -->
          <ellipse cx="100" cy="115" rx="7" ry="5" fill="#4A3420"/>
          <!-- 鼻子高光 -->
          <ellipse cx="97" cy="113" rx="2" ry="1.5" fill="#fff" opacity="0.6"/>
          
          <!-- 嘴巴 -->
          <path :d="mouthPath" stroke="#4A3420" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          
          <!-- 腮红（开心时显示） -->
          <g v-if="showBlush" class="blush">
            <ellipse cx="65" cy="120" rx="8" ry="5" fill="#FFB6C1" opacity="0.6"/>
            <ellipse cx="135" cy="120" rx="8" ry="5" fill="#FFB6C1" opacity="0.6"/>
          </g>
          
          <!-- 眼泪（难过时显示） -->
          <g v-if="showTears" class="tears">
            <path d="M 72 108 Q 70 120 72 130 Q 75 125 75 115 Q 75 110 72 108" fill="#87CEEB" opacity="0.7"/>
            <path d="M 128 108 Q 130 120 128 130 Q 125 125 125 115 Q 125 110 128 108" fill="#87CEEB" opacity="0.7"/>
          </g>
        </svg>
      </div>
      <div class="shadow"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  satiety: { type: Number, default: 50 },
  happiness: { type: Number, default: 50 },
  effects: { type: Array, default: () => [] },
  winking: { type: Boolean, default: false },
  bubbleVisible: { type: Boolean, default: false },
  bubbleText: { type: String, default: '' }
});

// 根据状态综合判断心情
const moodClass = computed(() => {
  const avg = (props.satiety + props.happiness) / 2;
  if (avg >= 70) return 'happy';
  if (avg >= 40) return 'normal';
  return 'sad';
});

// 眨眼逻辑
const leftEyeClosed = computed(() => {
  if (props.winking) return true;
  if (moodClass.value === 'sad') return false;
  return false;
});

const rightEyeClosed = computed(() => {
  if (props.winking) return true;
  if (moodClass.value === 'happy') return true; // 开心时眯眼笑
  return false;
});

// 眼睛颜色
const eyeColor = computed(() => {
  if (moodClass.value === 'sad') return '#8B7355'; // 难过时眼睛暗淡
  return '#4A3420';
});

// 嘴巴路径（不同表情）
const mouthPath = computed(() => {
  if (props.winking) {
    // 喂食时：开心张嘴
    return 'M 88 130 Q 100 145 112 130';
  }
  switch (moodClass.value) {
    case 'happy':
      return 'M 85 128 Q 100 142 115 128'; // 开心大笑
    case 'sad':
      return 'M 88 138 Q 100 128 112 138'; // 难过撇嘴
    default:
      return 'M 92 132 Q 100 138 108 132'; // 普通微笑
  }
});

// 腮红（开心时显示）
const showBlush = computed(() => {
  return moodClass.value === 'happy' || props.winking;
});

// 眼泪（难过时显示）
const showTears = computed(() => {
  return moodClass.value === 'sad';
});

// 触发动作时的临时动画类
const actionClass = computed(() => {
  const last = props.effects[props.effects.length - 1];
  return last ? `act-${last.type}` : '';
});

// 动画 key（强制重新播放 CSS 动画）
const animationKey = computed(() => {
  return `${moodClass.value}-${props.winking ? 'wink' : 'normal'}`;
});
</script>

<style scoped>
.dog-stage {
  position: relative;
  width: 100%;
  height: 240px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.dog {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dog-svg-wrapper {
  animation: idle 2.5s ease-in-out infinite;
  transform-origin: center bottom;
}

.dog-svg {
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.12));
}

.shadow {
  width: 100px;
  height: 14px;
  margin-top: 2px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.15), transparent 70%);
  border-radius: 50%;
  animation: shadowPulse 2.5s ease-in-out infinite;
}

/* 待机：轻微上下浮动 */
@keyframes idle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-1deg); }
}

@keyframes shadowPulse {
  0%, 100% { transform: scaleX(1); opacity: 0.5; }
  50% { transform: scaleX(0.85); opacity: 0.3; }
}

/* 心情动画 */
.happy .dog-svg-wrapper { animation-duration: 1.2s; }
.sad .dog-svg-wrapper { animation-duration: 3s; filter: grayscale(0.2); }

/* 喂食触发：开心弹跳 */
.act-feed .dog-svg-wrapper { animation: happyBounce 0.6s ease; }

@keyframes happyBounce {
  0%   { transform: translateY(0) scale(1); }
  25%  { transform: translateY(-18px) scale(1.08); }
  50%  { transform: translateY(0) scale(0.95); }
  75%  { transform: translateY(-5px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

/* 抚摸触发：左右摇摆 */
.act-pet .dog-svg-wrapper { animation: wiggle 0.5s ease; }

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

/* 眼睛动画 */
.eye {
  transition: transform 0.15s ease;
}

.eye circle {
  transition: all 0.2s ease;
}

.eye-closed circle {
  opacity: 0;
  transform: scaleY(0.1);
}

/* 腮红动画 */
.blush ellipse {
  animation: blushPulse 1.5s ease-in-out infinite;
}

@keyframes blushPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 眼泪动画 */
.tears path {
  animation: tearFall 1.5s ease-in-out infinite;
}

@keyframes tearFall {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

/* 漂浮特效 */
.effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.effect {
  position: absolute;
  bottom: 40px;
  font-size: 28px;
  animation: floatUp 1.2s ease-out forwards;
}

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-160px) scale(1.4); }
}

.float-enter-active,
.float-leave-active {
  transition: all 0.3s;
}

/* ===== 气泡对话框 ===== */
.bubble {
  position: absolute;
  top: 20px;
  right: 5%;
  max-width: 180px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(120, 80, 40, 0.2);
  font-size: 14px;
  font-weight: 700;
  color: #5a3e2b;
  white-space: nowrap;
  z-index: 5;
}

.bubble::after {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 10px solid transparent;
  border-right-color: #fff;
}

.bubble-text {
  position: relative;
  z-index: 1;
}

.bubble-enter-active {
  animation: bubbleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-leave-active {
  animation: bubbleOut 0.3s ease forwards;
}

@keyframes bubbleIn {
  0%   { opacity: 0; transform: translateY(12px) scale(0.6); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes bubbleOut {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
}
</style>
