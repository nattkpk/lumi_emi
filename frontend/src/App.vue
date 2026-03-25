<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChartBarSquareIcon, DocumentTextIcon, SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'Dashboard', path: '/', icon: ChartBarSquareIcon },
  { name: 'Manage Data', path: '/manage', icon: DocumentTextIcon },
]

const currentTab = computed(() => route.path)

// Dark Mode Logic
const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.theme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.theme = 'light'
  }
}

onMounted(() => {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div id="main-scroll" class="h-screen overflow-y-auto bg-bg-main flex flex-col font-sans text-text-main no-scrollbar">
    <header class="bg-brand-primary text-white sticky top-0 z-50">
      <div class="max-w-7xl mx-auto h-20 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span class="text-brand-primary font-bold text-lg font-heading">L</span>
          </div>
          <h1 class="text-2xl font-bold font-heading tracking-tight">LumiEMI 
            <!-- <span class="text-white/60 text-sm font-normal ml-2 font-sans hidden sm:inline-block">Climate Clarity</span> -->
          </h1>
        </div>
        
        <div class="flex items-center space-x-2">
          <nav class="flex space-x-1">
            <router-link
              v-for="tab in tabs"
              :key="tab.name"
              :to="tab.path"
              class="flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              :class="[
                currentTab === tab.path
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5 flex-shrink-0" />
              <span class="hidden sm:inline-block">{{ tab.name }}</span>
            </router-link>
          </nav>

          <div class="w-px h-6 bg-white/30 mx-2 hidden sm:block"></div>

          <button @click="toggleDark" class="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors" title="Toggle Theme">
            <SunIcon v-if="isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
    <main class="flex-1 w-full flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
