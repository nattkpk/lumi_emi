<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
// Tree-shaking ECharts
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import {
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  MapChart,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])
import apiClient from '../../api/client'

const emit = defineEmits(['countryClick'])

const chartRef = ref(null)
let chartInstance = null
let mapRegistered = false
const loading = ref(true)

const initChart = async () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)

    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json')
      const geoJson = await res.json()
      echarts.registerMap('world', geoJson)
      mapRegistered = true

      chartInstance.on('click', (params) => {
        emit('countryClick', { name: params.name, iso: params.data?.iso })
      })

      fetchData()
    } catch {
      loading.value = false
    }
  }
}

const fetchData = async () => {
  if (!mapRegistered) return

  try {
    const data = await apiClient.get('/emissions/map?year=2022')

    const mapData = data.map(d => ({
      name: d.name,
      value: d.total_ghg,
      iso: d.iso_code
    }))

    const maxVal = Math.max(...mapData.map(d => d.value)) || 1000

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(21, 55, 44, 0.95)',
        borderColor: '#34d399',
        borderWidth: 1,
        textStyle: { color: '#ffffff' },
        formatter: (params) => {
          if (!params.value && params.value !== 0) return `<strong>${params.name}</strong><br/><span style="color:#a7f3d0;font-size:12px">Click to select</span>`
          return `<strong>${params.name}</strong><br/>Total GHG: ${params.value.toFixed(2)} MtCO₂e<br/><span style="color:#a7f3d0;font-size:12px">Click to select and view details</span>`
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxVal,
        inRange: { color: ['#a7f3d0', '#34d399', '#10b981', '#047857'] }
      },
      series: [{
        type: 'map',
        map: 'world',
        roam: false,
        itemStyle: {
          borderColor: 'rgba(255,255,255,0.4)',
          borderWidth: 0.8,
          areaColor: 'rgba(255, 255, 255, 0.08)'
        },
        emphasis: {
          itemStyle: { areaColor: '#f59e0b', borderColor: '#ffffff', borderWidth: 2 },
          label: { show: false }
        },
        data: mapData,
        left: 'center',
        top: 'center',
        layoutCenter: ['50%', '50%'],
        layoutSize: '110%'
      }]
    }

    chartInstance.setOption(option)
  } catch {
    /* silent */
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<template>
  <div class="relative w-full h-full cursor-pointer">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
    </div>
    <div ref="chartRef" class="w-full h-full pb-8"></div>
  </div>
</template>
