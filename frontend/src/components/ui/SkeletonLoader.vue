<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  borderRadius: { type: String, default: '0.5rem' },
  circle: { type: Boolean, default: false }
})
</script>

<template>
  <div 
    class="skeleton-loader overflow-hidden bg-gray-200 dark:bg-gray-800 relative"
    :style="{
      width: width,
      height: height,
      borderRadius: circle ? '50%' : borderRadius
    }"
  >
    <div class="shimmer absolute inset-0"></div>
  </div>
</template>

<style scoped>
.skeleton-loader {
  background-size: 200% 100%;
}

.shimmer {
  background: linear-gradient(
    90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

.dark .shimmer {
  background: linear-gradient(
    90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
