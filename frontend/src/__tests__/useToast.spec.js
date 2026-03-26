import { describe, it, expect } from 'vitest'
import { useToast } from '../composables/useToast'

describe('useToast', () => {
  it('should add a toast', () => {
    const { toasts, success } = useToast()
    success('Test message')
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('success')
  })

  it('should remove a toast', () => {
    const { toasts, showToast, removeToast } = useToast()
    const id = showToast('To be removed')
    expect(toasts.value.length).toBe(2) // previous test toast might still be there if singleton
    removeToast(id)
    expect(toasts.value.find(t => t.id === id)).toBeUndefined()
  })
})
