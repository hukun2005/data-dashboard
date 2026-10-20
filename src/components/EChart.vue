<template>
  <div ref="el" class="echart-box" :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

// 按需注册：只打包用到的图表与组件，避免引入整个 echarts
echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{ option: EChartsOption; height?: number }>(), {
  height: 300,
})

const el = ref<HTMLDivElement>()
const chart = shallowRef<ReturnType<typeof echarts.init>>()

function resize() {
  chart.value?.resize()
}

onMounted(() => {
  if (!el.value) return
  chart.value = echarts.init(el.value)
  chart.value.setOption(props.option, { notMerge: true })
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart.value?.dispose()
})

watch(
  () => props.option,
  (option) => {
    chart.value?.setOption(option, { notMerge: true })
  },
  { deep: true },
)
</script>

<style scoped>
.echart-box {
  width: 100%;
}
</style>