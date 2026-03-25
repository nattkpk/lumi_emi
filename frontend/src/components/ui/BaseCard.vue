<script setup>
// BaseCard acts as a unified container for dashboard items
</script>

<template>
  <div class="minimal-card flex flex-col h-full">
    <div v-if="$slots.header" class="border-b border-border-subtle p-6 font-heading font-semibold text-xl flex items-center justify-between text-text-main">
      <slot name="header" />
    </div>
    <div class="p-5">
      <slot />
    </div>
    <div v-if="$slots.footer" class="border-t border-border-subtle p-5 text-sm text-text-muted">
      <slot name="footer" />
    </div>
  </div>
</template>
