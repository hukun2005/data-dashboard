<script lang="ts">
export type MetricModuleId = 'projectCount' | 'transactionAmount' | 'exceptionCount'
export type ChartModuleId = 'trend' | 'regionRanking' | 'exceptionTypes' | 'snapshot'
export type ModuleId = MetricModuleId | ChartModuleId
export type TrendChartType = 'line' | 'area' | 'bar'

export type DashboardConfig = {
  visible: Record<ModuleId, boolean>
  metricOrder: MetricModuleId[]
  chartOrder: ChartModuleId[]
  trendChartType: TrendChartType
}

export const defaultDashboardConfig: DashboardConfig = {
  visible: {
    projectCount: true,
    transactionAmount: true,
    exceptionCount: true,
    trend: true,
    regionRanking: true,
    exceptionTypes: true,
    snapshot: true,
  },
  metricOrder: ['projectCount', 'transactionAmount', 'exceptionCount'],
  chartOrder: ['trend', 'regionRanking', 'exceptionTypes', 'snapshot'],
  trendChartType: 'line',
}
</script>

<script setup lang="ts">
import { Button, Drawer, Select, Switch } from 'ant-design-vue'

const props = defineProps<{
  open: boolean
  config: DashboardConfig
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'change', config: DashboardConfig): void
}>()

const metricModules: { id: MetricModuleId; label: string }[] = [
  { id: 'projectCount', label: '项目总数' },
  { id: 'transactionAmount', label: '交易金额' },
  { id: 'exceptionCount', label: '异常数量' },
]

const chartModules: { id: ChartModuleId; label: string }[] = [
  { id: 'trend', label: '交易趋势' },
  { id: 'regionRanking', label: '区域项目分布' },
  { id: 'exceptionTypes', label: '异常类型构成' },
  { id: 'snapshot', label: '统计口径' },
]

const trendTypeOptions: { value: TrendChartType; label: string }[] = [
  { value: 'line', label: '折线图' },
  { value: 'area', label: '面积图' },
  { value: 'bar', label: '柱状图' },
]

function moveItem<T extends string>(items: T[], item: T, offset: number): T[] {
  const index = items.indexOf(item)
  const nextIndex = index + offset
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items
  const nextItems = [...items]
  ;[nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]]
  return nextItems
}

function updateVisibility(id: ModuleId, checked: boolean | string | number) {
  emit('change', { ...props.config, visible: { ...props.config.visible, [id]: Boolean(checked) } })
}

function moveMetric(id: MetricModuleId, offset: number) {
  emit('change', { ...props.config, metricOrder: moveItem(props.config.metricOrder, id, offset) })
}

function moveChart(id: ChartModuleId, offset: number) {
  emit('change', { ...props.config, chartOrder: moveItem(props.config.chartOrder, id, offset) })
}

function onTrendTypeChange(value: TrendChartType) {
  emit('change', { ...props.config, trendChartType: value })
}
</script>

<template>
  <Drawer
    title="指标与图表配置"
    placement="right"
    :width="420"
    :open="open"
    root-class-name="config-drawer"
    @close="emit('close')"
  >
    <template #footer>
      <Button @click="emit('change', defaultDashboardConfig)">恢复默认配置</Button>
    </template>

    <p class="config-intro">设置大屏模块的显示状态、顺序与图表样式。</p>

    <section class="config-section">
      <div class="config-section-heading"><h3>核心指标</h3><span>可见性与顺序</span></div>
      <div class="config-list">
        <div v-for="(id, index) in config.metricOrder" :key="id" class="config-row">
          <span class="config-order">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="config-name">{{ metricModules.find((m) => m.id === id)?.label }}</span>
          <div class="config-row-actions">
            <Button size="small" :disabled="index === 0" @click="moveMetric(id, -1)">上移</Button>
            <Button size="small" :disabled="index === config.metricOrder.length - 1" @click="moveMetric(id, 1)">下移</Button>
            <Switch size="small" :checked="config.visible[id]" @change="(checked) => updateVisibility(id, checked)" />
          </div>
        </div>
      </div>
    </section>

    <section class="config-section">
      <div class="config-section-heading"><h3>分析图表</h3><span>可见性、顺序与类型</span></div>
      <div class="config-list">
        <div v-for="(id, index) in config.chartOrder" :key="id" class="config-row">
          <span class="config-order">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="config-name">{{ chartModules.find((m) => m.id === id)?.label }}</span>
          <div class="config-row-actions">
            <Button size="small" :disabled="index === 0" @click="moveChart(id, -1)">上移</Button>
            <Button size="small" :disabled="index === config.chartOrder.length - 1" @click="moveChart(id, 1)">下移</Button>
            <Switch size="small" :checked="config.visible[id]" @change="(checked) => updateVisibility(id, checked)" />
          </div>
        </div>
      </div>
      <div class="config-chart-types">
        <label class="config-select-row">
          <span>交易趋势</span>
          <Select :value="config.trendChartType" :options="trendTypeOptions" @change="onTrendTypeChange" />
        </label>
      </div>
    </section>
  </Drawer>
</template>