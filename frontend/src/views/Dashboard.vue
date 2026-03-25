<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import apiClient from '../api/client'

// Replace these with actual Chart components later
import TrendChart from '../components/charts/TrendChart.vue'
import SectorChart from '../components/charts/SectorChart.vue'
import EmissionsMap from '../components/charts/EmissionsMap.vue'
import HeroGlobe from '../components/ui/HeroGlobe.vue'

// State
const countries = ref([])
const selectedCountry = ref('THA')
const selectedYear = ref(2022)
const loading = ref(true)
const scrolled = ref(false)
const detailsSection = ref(null)

const handleMapClick = (country) => {
  let iso = country.iso
  if (!iso) {
    const found = countries.value.find(c => c.label === country.name)
    if (found) iso = found.value
  }
  
  if (iso) {
    selectedCountry.value = iso
  }
  
  if (detailsSection.value) {
    detailsSection.value.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleScroll = (e) => {
  scrolled.value = e.target.scrollTop > 180
}

// Fetch initialization data
const initData = async () => {
  try {
    loading.value = true
    const res = await apiClient.get('/countries')
    countries.value = res.map(c => ({ value: c.iso_code, label: c.name }))
  } catch (error) {
    console.error('Failed to load countries', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
  const scrollContainer = document.getElementById('main-scroll')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  const scrollContainer = document.getElementById('main-scroll')
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div class="flex flex-col w-full no-scrollbar overflow-y-auto">
    <div class="w-full h-[100vh] bg-brand-primary text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div class="max-w-7xl mx-auto h-full flex flex-col lg:flex-row items-center relative">
        <div class="w-full lg:w-1/2 z-10 pt-10 lg:pt-0">
          <h1 class="text-4xl md:text-6xl font-bold font-heading leading-tight mb-6 mt-4">Climate Clarity,<br/>Simplified.</h1>
          <p class="text-xl md:text-2xl text-white/80 font-sans leading-relaxed max-w-2xl">
            Illuminate historical trends, explore sectoral footprints, and see the world’s emissions in a whole new light.
          </p>
        </div>
        
        <div class="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[60%] h-[120%] opacity-90 hidden md:flex items-center justify-center drop-shadow-2xl z-20">
           <HeroGlobe @countryClick="handleMapClick" />
        </div>
      </div>
      
      <!-- Scroll Indicator -->

      <div v-if="!scrolled" class="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-80 pointer-events-none transition-opacity duration-300">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full" ref="detailsSection">
      <div class="mb-8">
      <div class="flex flex-col md:flex-row gap-8 items-end border-b border-border-subtle pb-8">
        <div class="w-full md:w-1/3">
          <BaseSelect
            v-model="selectedCountry"
            label="Select Region/Country"
            :options="countries"
          />
        </div>
        <div class="w-full md:w-1/2 flex flex-col justify-end">
          <label class="block text-sm font-semibold text-text-main mb-2">
            Time Slider: <span class="text-brand-primary text-lg">{{ selectedYear }}</span>
          </label>
          <input 
            type="range" 
            v-model="selectedYear" 
            min="1990" 
            max="2022" 
            class="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-[#15372c]"
            lazy
          />
          <div class="flex justify-between text-xs text-text-muted mt-1">
            <span>1990</span>
            <span>2022</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
      <BaseCard class="col-span-1 lg:col-span-2">
        <template #header>
          <span>Emissions Trend Over Time</span>
        </template>
        <div class="h-[400px]">
          <TrendChart :country="selectedCountry" />
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span>Emissions by Sector ({{ selectedYear }})</span>
        </template>
        <div class="h-[350px]">
          <SectorChart :country="selectedCountry" :year="selectedYear" />
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <span>Global Overview ({{ selectedYear }})</span>
        </template>
        <div class="h-[350px]">
          <EmissionsMap :year="selectedYear" />
        </div>
      </BaseCard>
    </div>

    <div v-else class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
    
    </div>
  </div>
</template>
