<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import apiClient from '../../api/client'

const props = defineProps({
  country: {
    type: String,
    required: true
  }
})

const chartRef = ref(null)
let chartInstance = null
const loading = ref(false)
const errorMsg = ref('')

const initChart = () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', handleResize)
  }
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

const fetchData = async () => {
  if (!props.country) return
  loading.value = true
  errorMsg.value = ''

  try {
    const data = await apiClient.get(`/emissions/trend?country=${props.country}`)
    
    if (!data || data.length === 0) {
      errorMsg.value = 'No data available for this country.'
      if (chartInstance) chartInstance.clear()
      return
    }

    const years = data.map(d => d.year)
    const co2 = data.map(d => d.co2 || 0)
    const ch4 = data.map(d => d.ch4 || 0)
    const n2o = data.map(d => d.n2o || 0)
    const total = data.map(d => d.total_ghg || 0)

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textStyle: { color: '#15372c' },
        axisPointer: { type: 'cross', label: { backgroundColor: '#6b7280' } }
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Image', name: 'trend_chart', pixelRatio: 2 }
        }
      },
      legend: {
        data: ['CO₂', 'CH₄', 'N₂O', 'Total GHG'],
        textStyle: { color: '#6b7280' },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: years,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'MtCO₂e',
          nameTextStyle: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          axisLabel: { color: '#6b7280' }
        }
      ],
      series: [
        {
          name: 'CO₂',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#15372c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(21, 55, 44, 0.2)' },
              { offset: 1, color: 'rgba(21, 55, 44, 0)' }
            ])
          },
          data: co2
        },
        {
          name: 'CH₄',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#10b981' },
          data: ch4
        },
        {
           name: 'N₂O',
           type: 'line',
           smooth: true,
           symbol: 'none',
           lineStyle: { width: 2, color: '#0ea5e9' },
           data: n2o
        },
        {
          name: 'Total GHG',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#94a3b8', type: 'dashed' },
          data: total
        }
      ]
    }
    
    if (chartInstance) {
      chartInstance.setOption(option, true)
    }
  } catch (err) {
    errorMsg.value = 'Failed to load chart data.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

watch(() => props.country, () => {
  fetchData()
})

onMounted(() => {
  initChart()
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<template>
  <div class="relative w-full h-full">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl backdrop-blur-sm">
      <div class="animate-pulse text-brand-primary font-medium">Loading API...</div>
    </div>
    <div v-if="errorMsg" class="absolute inset-0 flex items-center justify-center text-text-muted">
      {{ errorMsg }}
    </div>
    <div ref="chartRef" class="w-full h-full" :class="{ 'opacity-0': errorMsg }"></div>
  </div>
</template>
