<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import apiClient from '../../api/client'

const props = defineProps({
  year: {
    type: [Number, String],
    required: true
  }
})

const chartRef = ref(null)
let chartInstance = null
const loading = ref(false)
const errorMsg = ref('')
let mapRegistered = false

const initChart = async () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', handleResize)
  }
  
  if (!mapRegistered) {
    try {
      loading.value = true
      // Fetch world map geojson from CDN (ECharts 4 hosted json)
      const res = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json')
      const geoJson = await res.json()
      echarts.registerMap('world', geoJson)
      mapRegistered = true
    } catch (err) {
      console.error('Failed to load map data', err)
      errorMsg.value = 'Failed to load geographical map data.'
    } finally {
      loading.value = false
    }
  }
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

const fetchData = async () => {
  if (!props.year || !mapRegistered) return
  loading.value = true
  errorMsg.value = ''

  try {
    const data = await apiClient.get(`/emissions/map?year=${props.year}`)
    
    if (!data || data.length === 0) {
      errorMsg.value = 'No map data available for this year.'
      if (chartInstance) chartInstance.clear()
      return
    }

    // Map API data to ECharts map data format
    // ECharts uses English country names from the GeoJSON. OWID names usually match well.
    const mapData = data.map(d => ({
      name: d.name,
      value: d.total_ghg,
      iso: d.iso_code
    }))

    // Find max value for visualMap
    const maxVal = Math.max(...mapData.map(d => d.value)) || 1000

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textStyle: { color: '#15372c' },
        formatter: (params) => {
          if (!params.value && params.value !== 0) return `<strong>${params.name}</strong><br/>No Data`
          return `<strong>${params.name}</strong><br/>Total GHG: ${params.value.toFixed(2)} MtCO₂e`
        }
      },
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save as Map Image', name: 'emissions_map', pixelRatio: 2 }
        }
      },
      visualMap: {
        min: 0,
        max: maxVal,
        text: ['High', 'Low'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#ecfdf5', '#34d399', '#10b981', '#15372c'] // Light green to brand dark green
        },
        textStyle: { color: '#6b7280' },
        left: 'right',
        bottom: 'bottom'
      },
      series: [
        {
          name: 'Greenhouse Gas Emissions',
          type: 'map',
          map: 'world',
          roam: true, // Allow zoom and pan
          itemStyle: {
            borderColor: '#ffffff',
            areaColor: '#f3f4f6' // Default color for no data
          },
          emphasis: {
            itemStyle: { areaColor: '#f59e0b' },
            label: { show: false }
          },
          data: mapData
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

watch(() => props.year, () => {
  if (mapRegistered) fetchData()
})

onMounted(async () => {
  await initChart()
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
