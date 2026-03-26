import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    toasts.value.push({
      id,
      message,
      type,
      duration
    })
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration + 500) // extra time for animation
    }
    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (msg, dur) => showToast(msg, 'success', dur)
  const error = (msg, dur) => showToast(msg, 'error', dur)
  const warn = (msg, dur) => showToast(msg, 'warning', dur)
  const info = (msg, dur) => showToast(msg, 'info', dur)

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warn,
    info
  }
}
