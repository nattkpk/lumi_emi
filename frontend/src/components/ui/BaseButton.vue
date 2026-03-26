<script setup>
defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (val) => ["primary", "secondary", "ghost"].includes(val),
  },
  type: {
    type: String,
    default: "button",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="btn-base"
    :class="[
      variant === 'primary' ? 'btn-primary' : '',
      variant === 'secondary'
        ? 'bg-white text-brand-primary border border-brand-primary hover:bg-bg-secondary'
        : '',
      variant === 'ghost'
        ? 'hover:bg-bg-secondary text-text-muted hover:text-text-main'
        : '',
      disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : '',
    ]"
  >
    <slot />
  </button>
</template>
