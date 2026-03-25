<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array, // Array of { value, label }
    default: () => []
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col space-y-1.5">
    <label v-if="label" class="text-sm font-medium text-text-main">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="bg-white border border-border-subtle text-text-main text-sm rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5 outline-none transition-all hover:border-gray-300 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2315372c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_0.7rem] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value" class="bg-white text-text-main">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
