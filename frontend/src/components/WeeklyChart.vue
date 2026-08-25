<template>
  <!-- 狗狗周报：7 天状态趋势折线图 -->
  <div class="chart-panel">
    <div class="panel-header">
      <span class="title">📊 狗狗周报</span>
      <span class="subtitle">最近 7 天状态变化趋势</span>
    </div>
    <div ref="chartEl" class="chart"></div>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts';
import { getHistory } from '../api/history';

const chartEl = ref(null);
const errorMsg = ref('');
let chart = null;
const historyData = ref([]);

// 初始化 ECharts 实例
const initChart = () => {
  if (chartEl.value && !chart) {
    chart = echarts.init(chartEl.value);
    window.addEventListener('resize', handleResize);
  }
};

// 窗口变化时重绘
const handleResize = () => chart && chart.resize();

// 渲染折线图
const renderChart = () => {
  if (!chart) return;
  const dates = historyData.value.map((d) => formatDate(d.date));
  const option = {
    grid: { left: 40, right: 16, top: 40, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8d8c0',
      textStyle: { color: '#5a3e2b' }
    },
    legend: {
      data: ['饱食度', '愉悦度', '亲密度'],
      top: 8,
      textStyle: { color: '#8a7158', fontSize: 11 }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#d8c5a8' } },
      axisLabel: { color: '#8a7158', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisLabel: { color: '#8a7158', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0e6d5', type: 'dashed' } }
    },
    series: [
      {
        name: '饱食度',
        type: 'line',
        smooth: true,
        data: historyData.value.map((d) => d.satiety),
        itemStyle: { color: '#e67e22' },
        lineStyle: { width: 2.5 }
      },
      {
        name: '愉悦度',
        type: 'line',
        smooth: true,
        data: historyData.value.map((d) => d.happiness),
        itemStyle: { color: '#ff5a8a' },
        lineStyle: { width: 2.5 }
      },
      {
        name: '亲密度',
        type: 'line',
        smooth: true,
        data: historyData.value.map((d) => d.intimacy),
        itemStyle: { color: '#9b59b6' },
        lineStyle: { width: 2.5 }
      }
    ]
  };
  chart.setOption(option);
};

// 日期格式化：2026-08-25 → 08-25
const formatDate = (dateStr) => {
  const s = String(dateStr).slice(0, 10);
  return s.slice(5); // MM-DD
};

// 拉取历史数据
const loadData = async () => {
  try {
    const { data } = await getHistory();
    historyData.value = data.data || [];
    errorMsg.value = '';
    renderChart();
  } catch (err) {
    errorMsg.value = '⚠️ 无法加载周报数据';
    console.error(err);
  }
};

// 暴露给父组件刷新（互动后状态变化可更新今日数据点）
defineExpose({ refresh: loadData });

onMounted(async () => {
  initChart();
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart && chart.dispose();
});

watch(historyData, renderChart, { deep: true });
</script>

<style scoped>
.chart-panel {
  width: 100%;
  background: #fff;
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 8px 22px rgba(120, 80, 40, 0.12);
}

.panel-header {
  margin-bottom: 8px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #5a3e2b;
}

.subtitle {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #b08d6e;
}

.chart {
  width: 100%;
  height: 220px;
}

.error {
  margin-top: 8px;
  font-size: 12px;
  color: #e74c3c;
  text-align: center;
}
</style>
