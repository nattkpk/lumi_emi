<script setup>
import { computed } from "vue";
import BaseInput from "./BaseInput.vue";
import BaseSelect from "./BaseSelect.vue";
import BaseButton from "./BaseButton.vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  show: { type: Boolean, default: false },
  isEditing: { type: Boolean, default: false },
  activeTab: { type: String, default: "emissions" },
  formData: { type: Object, required: true },
  countries: { type: Array, default: () => [] },
  gasOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "submit", "update:formData"]);

const form = computed({
  get: () => props.formData,
  set: (val) => emit("update:formData", val),
});

const updateField = (key, value) => {
  emit("update:formData", { ...props.formData, [key]: value });
};

const title = computed(() => {
  const action = props.isEditing ? "Edit" : "Add New";
  const type = props.activeTab === "countries" ? "Country" : "Emission";
  return `${action} ${type}`;
});
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4"
  >
    <div
      class="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm"
      @click="emit('close')"
    ></div>
    <div
      class="relative w-full max-w-lg bg-white dark:bg-bg-main rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200"
    >
      <div
        class="px-8 py-6 border-b border-border-subtle flex items-center justify-between"
      >
        <h2 class="text-xl font-bold text-text-main">{{ title }}</h2>
        <button
          @click="emit('close')"
          class="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-bg-secondary transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
      <form @submit.prevent="emit('submit')" class="p-8 space-y-5">
        <div v-if="activeTab === 'countries'" class="space-y-4">
          <BaseInput
            :modelValue="form.iso_code"
            @update:modelValue="updateField('iso_code', $event)"
            label="ISO Code"
            placeholder="e.g. THA"
          />
          <BaseInput
            :modelValue="form.name"
            @update:modelValue="updateField('name', $event)"
            label="Country Name"
            placeholder="e.g. Thailand"
          />
        </div>
        <div v-else class="space-y-4">
          <BaseSelect
            :modelValue="form.iso_code"
            @update:modelValue="updateField('iso_code', $event)"
            label="Select Country"
            :options="countries.map((c) => ({ value: c.iso_code, label: c.name }))"
          />
          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              :modelValue="form.year"
              @update:modelValue="updateField('year', $event)"
              type="number"
              label="Year"
            />
            <BaseSelect
              :modelValue="form.gas_type"
              @update:modelValue="updateField('gas_type', $event)"
              label="Gas Type"
              :options="gasOptions"
            />
          </div>
          <BaseInput
            :modelValue="form.sector"
            @update:modelValue="updateField('sector', $event)"
            label="Sector"
            placeholder="e.g. energy, transport, total"
          />
          <BaseInput
            :modelValue="form.value"
            @update:modelValue="updateField('value', $event)"
            type="number"
            step="0.01"
            label="Value"
          />
        </div>
        <div class="flex justify-end pt-4 space-x-3">
          <BaseButton variant="ghost" @click="emit('close')">Cancel</BaseButton>
          <BaseButton type="submit">Save Changes</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
