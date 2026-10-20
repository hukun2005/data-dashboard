<template>
  <main class="dashboard-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark"><span /><span /><span /></div>
        <span class="brand-name">监管数据中心</span>
        <span class="brand-divider" />
        <span class="brand-subtitle">项目交易监测平台</span>
      </div>
      <div class="live-status"><span class="live-dot" />数据实时更新</div>
    </header>

    <section class="dashboard-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">OVERSIGHT OVERVIEW <span> / </span> {{ year }} 年度</p>
          <h1>项目交易监管总览</h1>
          <p class="heading-caption">掌握项目规模、交易动态与风险态势</p>
        </div>
        <div class="heading-controls">
          <div class="filters" aria-label="数据筛选">
            <label class="filter-control">
              <span>统计年度</span>
              <Select v-model:value="year" :options="yearOptions" />
            </label>
            <label class="filter-control">
              <span>行政区域</span>
              <Select v-model:value="region" :options="regionOptions" />
            </label>
          </div>
          <Button class="config-trigger" @click="isConfigOpen = true">指标配置</Button>
        </div>
      </div>

      <div class="scope-line"><span class="scope-pin" />当前范围：{{ region }} <span class="scope-separator">/</span> {{ year }} 年</div>

      <section v-if="visibleMetrics.length" class="metric-grid" aria-label="核心指标">
        <template v-for="(id, index) in visibleMetrics" :key="id">
          <article v-if="id === 'projectCount'" class="metric-panel metric-projects">
            <div class="metric-topline"><span class="metric-label">项目总数</span><span class="metric-index">{{ String(index + 1).padStart(2, '0') }}</span></div>
            <div class="metric-value">{{ count.format(dashboard.projects) }}<span class="metric-unit">个</span></div>
            <div class="metric-foot"><span class="metric-spark">↗</span> 较上年增长 <strong>{{ growthPercent }}%</strong></div>
            <div class="metric-rule" />
          </article>
          <article v-else-if="id === 'transactionAmount'" class="metric-panel metric-amount">
            <div class="metric-topline"><span class="metric-label">交易金额</span><span class="metric-index">{{ String(index + 1).padStart(2, '0') }}</span></div>
            <div class="metric-value">{{ money.format(dashboard.amount) }}<span class="metric-unit">亿元</span></div>
            <div class="metric-foot">累计成交金额 <span class="foot-dot" /> 覆盖 {{ region === '全国' ? '6' : '1' }} 个统计区域</div>
            <div class="metric-rule" />
          </article>
          <article v-else-if="id === 'exceptionCount'" class="metric-panel metric-alerts">
            <div class="metric-topline"><span class="metric-label">异常数量</span><span class="metric-index">{{ String(index + 1).padStart(2, '0') }}</span></div>
            <div class="metric-value">{{ count.format(dashboard.exceptions) }}<span class="metric-unit">项</span></div>
            <div class="metric-foot"><span class="alert-indicator" />待跟进风险线索</div>
            <div class="metric-rule" />
          </article>
        </template>
      </section>

      <section v-if="visibleCharts.length" class="chart-grid">
        <template v-for="id in visibleCharts" :key="id">
          <article v-if="id === 'trend'" class="chart-panel trend-panel">
            <div class="panel-heading">
              <div><span class="panel-kicker">TREND ANALYSIS</span><h2>交易趋势</h2></div>
              <Tag :bordered="false">{{ year }} 年月度</Tag>
            </div>
            <EChart :option="trendOption" :height="286" />
          </article>
          <article v-else-if="id === 'regionRanking'" class="chart-panel ranking-panel">
            <div class="panel-heading">
              <div><span class="panel-kicker">REGIONAL DISTRIBUTION</span><h2>区域项目分布</h2></div>
              <span class="unit-note">{{ region === '全国' ? '点击高亮省份联动数据' : `当前：${region}` }}</span>
            </div>
            <ChinaMap :data="dashboard.dataMap" :selected="region" @select="handleRegionSelect" />
          </article>
          <article v-else-if="id === 'exceptionTypes'" class="chart-panel exception-panel">
            <div class="panel-heading">
              <div><span class="panel-kicker">RISK PROFILE</span><h2>异常类型构成</h2></div>
              <span class="unit-note">{{ dashboard.exceptions }} 项</span>
            </div>
            <div class="exception-chart-wrap">
              <EChart :option="exceptionOption" :height="220" />
              <div class="exception-center"><strong>{{ dashboard.exceptions }}</strong><span>异常线索</span></div>
            </div>
          </article>
          <article v-else-if="id === 'snapshot'" class="chart-panel note-panel">
            <div class="note-heading"><span class="note-symbol">i</span><div><span class="panel-kicker">DATA SNAPSHOT</span><h2>统计口径</h2></div></div>
            <div class="note-content">
              <p>当前展示 <strong>{{ year }}</strong> 年 <strong>{{ region }}</strong> 项目交易模拟数据。</p>
              <p>交易金额按项目累计成交额统计，异常线索按监测规则归集。</p>
            </div>
            <div class="note-meta"><span>数据更新时间</span><strong>今日 09:30</strong></div>
          </article>
        </template>
      </section>

      <footer class="dashboard-footer">
        <span>监管数据中心 <i /> 项目交易监测平台</span>
        <span>演示数据 · 仅供界面展示</span>
      </footer>
    </section>

    <Function :open="isConfigOpen" :config="dashboardConfig" @close="isConfigOpen = false" @change="onConfigChange" />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { Button, Select, Tag } from 'ant-design-vue'
import ChinaMap from './components/ChinaMap.vue'
import EChart from './components/EChart.vue'
import Function, { defaultDashboardConfig } from './components/Function.vue'
import type { DashboardConfig } from './components/Function.vue'
import './App.css'

// 数据
const years = [2025, 2024, 2023, 2022]
const regions = ['全国', '北京市', '上海市', '广东省', '浙江省', '四川省', '湖北省']

const regionData = {
  北京市: { projects: 128, amount: 86.4, exceptions: 8 },
  上海市: { projects: 116, amount: 92.8, exceptions: 6 },
  广东省: { projects: 196, amount: 148.6, exceptions: 13 },
  浙江省: { projects: 143, amount: 104.2, exceptions: 9 },
  四川省: { projects: 108, amount: 71.3, exceptions: 11 },
  湖北省: { projects: 92, amount: 62.5, exceptions: 7 },
}
type RegionMetrics = (typeof regionData)[keyof typeof regionData]

const yearFactor: Record<number, number> = { 2022: 0.68, 2023: 0.82, 2024: 0.94, 2025: 1 }
const money = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 })
const count = new Intl.NumberFormat('zh-CN')

const year = ref(2025)
const region = ref('全国')
const isConfigOpen = ref(false)
const dashboardConfig = ref<DashboardConfig>(defaultDashboardConfig)

const yearOptions = years.map((value) => ({ value, label: `${value} 年` }))
const regionOptions = regions.map((value) => ({ value, label: value }))

const dashboard = computed(() => {
  const multiplier = yearFactor[year.value]
  const selectedRegions: [string, RegionMetrics][] = region.value === '全国'
    ? Object.entries(regionData)
    : [[region.value, regionData[region.value as keyof typeof regionData]]]
  const totals = selectedRegions.reduce(
    (result, [, data]) => ({
      projects: result.projects + Math.round(data.projects * multiplier),
      amount: result.amount + data.amount * multiplier,
      exceptions: result.exceptions + Math.max(1, Math.round(data.exceptions * multiplier)),
    }),
    { projects: 0, amount: 0, exceptions: 0 },
  )
  const months = Array.from({ length: 12 }, (_, index) => index)
  const monthScale = [0.72, 0.76, 0.88, 0.81, 0.94, 1.03, 0.97, 1.08, 1.13, 1.02, 1.19, 1.28]
  const monthlyAmount = months.map((month) => +(totals.amount * monthScale[month] / 12).toFixed(1))
  const monthlyProjects = months.map((month) => Math.round(totals.projects * monthScale[month] / 12))
  const dataMap = Object.fromEntries(
    Object.entries(regionData).map(([name, data]) => [name, Math.round(data.projects * multiplier)]),
  )
  return { ...totals, monthlyAmount, monthlyProjects, dataMap }
})

const growthPercent = computed(() =>
  Math.round((yearFactor[year.value] / yearFactor[Math.max(2022, year.value - 1)] - 1) * 100),
)

// 交易趋势
const trendOption = computed<EChartsOption>(() => ({
  animationDuration: 600,
  color: ['#51d7b1', '#f4b95f'],
  tooltip: { trigger: 'axis', backgroundColor: '#18211f', borderColor: '#34423a', textStyle: { color: '#f4f7f4' } },
  legend: { top: 0, right: 0, textStyle: { color: '#9aa9a2' }, itemWidth: 8, itemHeight: 8 },
  grid: { left: 8, right: 12, top: 42, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: dashboardConfig.value.trendChartType === 'bar',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    axisLine: { lineStyle: { color: '#34423a' } },
    axisTick: { show: false },
    axisLabel: { color: '#819089', margin: 14 },
  },
  yAxis: [
    { type: 'value', name: '金额（亿元）', nameTextStyle: { color: '#819089', fontSize: 10 }, splitLine: { lineStyle: { color: '#28342f', type: 'dashed' } }, axisLabel: { color: '#819089' } },
    { type: 'value', name: '项目（个）', nameTextStyle: { color: '#819089', fontSize: 10 }, splitLine: { show: false }, axisLabel: { color: '#819089' } },
  ],
  series: [
    { name: '交易金额', type: dashboardConfig.value.trendChartType === 'bar' ? 'bar' : 'line', smooth: true, symbol: 'circle', symbolSize: 6, yAxisIndex: 0, data: dashboard.value.monthlyAmount, lineStyle: { width: 3 }, areaStyle: dashboardConfig.value.trendChartType === 'area' ? { opacity: 0.1 } : undefined },
    { name: '项目数量', type: dashboardConfig.value.trendChartType === 'bar' ? 'bar' : 'line', smooth: true, symbol: 'none', yAxisIndex: 1, data: dashboard.value.monthlyProjects, lineStyle: { width: 2, type: 'dashed' }, areaStyle: dashboardConfig.value.trendChartType === 'area' ? { opacity: 0.08 } : undefined },
  ],
}))

// 异常数据构成
const exceptionOption = computed<EChartsOption>(() => ({
  color: ['#f07867', '#f4b95f', '#72b7d2'],
  tooltip: { trigger: 'item', backgroundColor: '#18211f', borderColor: '#34423a', textStyle: { color: '#f4f7f4' } },
  legend: { bottom: 0, left: 'center', textStyle: { color: '#9aa9a2', fontSize: 11 }, itemWidth: 8, itemHeight: 8 },
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['50%', '44%'],
    avoidLabelOverlap: true,
    label: { show: false },
    itemStyle: { borderColor: '#18211f', borderWidth: 3 },
    data: [
      { value: Math.round(dashboard.value.exceptions * 0.46), name: '金额偏离' },
      { value: Math.round(dashboard.value.exceptions * 0.31), name: '进度滞后' },
      { value: Math.max(1, Math.round(dashboard.value.exceptions * 0.23)), name: '资料缺失' },
    ],
  }],
}))

const visibleMetrics = computed(() => dashboardConfig.value.metricOrder.filter((id) => dashboardConfig.value.visible[id]))
const visibleCharts = computed(() => dashboardConfig.value.chartOrder.filter((id) => dashboardConfig.value.visible[id]))

// 点击地图省份：切换行政区域，其他数据随全局状态联动；再次点击已选省份返回全国
function handleRegionSelect(name: string) {
  region.value = region.value === name ? '全国' : name
}

function onConfigChange(config: DashboardConfig) {
  dashboardConfig.value = config
}
</script>