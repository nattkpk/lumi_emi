<script setup>
import { ref, onMounted } from 'vue'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps({
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // 'success', 'error', 'info', 'warning'
  duration: { type: Number, default: 3000 }
})

const emit = defineEmits(['close'])
const visible = ref(true)

const close = () => {
  visible.value = false
  setTimeout(() => emit('close'), 300)
}

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})

const bgColor = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
}

const textColor = {
  success: 'text-green-800 dark:text-green-200',
  error: 'text-red-800 dark:text-red-200',
  info: 'text-blue-800 dark:text-blue-200',
  warning: 'text-yellow-800 dark:text-yellow-200'
}

const iconColor = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500'
}
</script>

<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" :class="['max-w-md w-full shadow-lg rounded-2xl pointer-events-auto border flex overflow-hidden backdrop-blur-md', bgColor[type]]">
      <div class="p-4 w-full">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircleIcon v-if="type === 'success'" :class="['h-6 w-6', iconColor[type]]" />
            <ExclamationCircleIcon v-else-if="type === 'error' || type === 'warning'" :class="['h-6 w-6', iconColor[type]]" />
            <InformationCircleIcon v-else :class="['h-6 w-6', iconColor[type]]" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p :class="['text-sm font-medium', textColor[type]]">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="close"
              class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
            >
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
