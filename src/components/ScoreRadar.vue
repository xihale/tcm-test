<script setup lang="ts">
/**
 * 九维体质雷达图：以得分占满分的百分比呈现，便于跨维度比较。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ConstitutionResult } from '../utils/scoring'

echarts.use([RadarChart, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  results: ConstitutionResult[]
}>()

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function buildOption() {
  // 平和质排首位，其后按原表顺序
  const ordered = [...props.results]
  return {
    tooltip: {
      trigger: 'item',
      formatter: () => {
        return ordered
          .map(
            (r) =>
              `${r.constitution.name}：${r.score} / ${r.maxScore} 分（${r.verdict}）`,
          )
          .join('<br/>')
      },
    },
    radar: {
      indicator: ordered.map((r) => ({ name: r.constitution.name, max: 100 })),
      radius: '72%',
      center: ['50%', '52%'],
      splitNumber: 4,
      axisName: {
        color: '#57534e',
        fontSize: 13,
        fontFamily: 'inherit',
      },
      splitLine: { lineStyle: { color: '#e7e5e4' } },
      splitArea: {
        areaStyle: { color: ['rgba(255,255,255,0.6)', 'rgba(245,245,244,0.35)'] },
      },
      axisLine: { lineStyle: { color: '#d6d3d1' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: ordered.map((r) => Math.round((r.score / r.maxScore) * 100)),
            name: '体质得分占比',
            areaStyle: { color: 'rgba(30, 95, 76, 0.22)' },
            lineStyle: { color: '#1e5f4c', width: 2.5 },
            itemStyle: { color: '#1e5f4c' },
            symbolSize: 5,
          },
        ],
        animationDuration: 700,
        animationEasing: 'cubicOut',
      },
    ],
  }
}

function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption(buildOption())
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  if (el.value) resizeObserver.observe(el.value)
})

watch(() => props.results, render, { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="el" class="radar" role="img" aria-label="九种体质得分雷达图" />
</template>

<style scoped>
.radar {
  width: 100%;
  height: 380px;
}
</style>
