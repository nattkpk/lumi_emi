<script setup>
import BaseInput from "./BaseInput.vue";
import BaseButton from "./BaseButton.vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

defineProps({
  show: { type: Boolean, default: false },
  loginForm: { type: Object, required: true },
  loginError: { type: String, default: "" },
  isLoggingIn: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "submit", "update:loginForm"]);

const updateField = (key, value) => {
  emit("update:loginForm", { ...arguments[0], [key]: value });
};
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
      class="relative w-full max-w-md bg-white dark:bg-bg-main rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200 p-8"
    >
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-brand-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            ></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-text-main">Admin Login</h2>
        <p class="text-text-muted mt-2">
          Authentication required to manage database records.
        </p>
      </div>
      <form @submit.prevent="emit('submit')" class="space-y-4">
        <BaseInput
          :modelValue="loginForm.username"
          @update:modelValue="emit('update:loginForm', { ...loginForm, username: $event })"
          label="Username"
          placeholder="Enter admin username"
          required
        />
        <BaseInput
          :modelValue="loginForm.password"
          @update:modelValue="emit('update:loginForm', { ...loginForm, password: $event })"
          type="password"
          label="Password"
          placeholder="Enter password"
          required
        />
        <div
          v-if="loginError"
          class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100"
        >
          {{ loginError }}
        </div>
        <BaseButton
          type="submit"
          class="w-full mt-4"
          :disabled="isLoggingIn"
        >{{ isLoggingIn ? "Authenticating..." : "Login" }}</BaseButton>
      </form>
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded-full hover:bg-bg-secondary transition-colors"
      >
        <XMarkIcon class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>
