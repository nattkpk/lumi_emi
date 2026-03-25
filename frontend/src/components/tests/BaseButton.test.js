import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../ui/BaseButton.vue'

describe('BaseButton.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click Me'
      }
    })
    expect(wrapper.text()).toContain('Click Me')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('applies secondary class when variant is secondary', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'secondary'
      }
    })
    expect(wrapper.classes()).toContain('bg-white')
  })
})
