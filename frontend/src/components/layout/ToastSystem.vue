<template>
  <div id="toast-container">
    <transition-group name="toast-slide" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="dismiss(toast.id)"
      >
        <div class="toast-icon">{{ icons[toast.type] }}</div>
        <div class="toast-body">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <div class="toast-bar">
          <div class="toast-bar-fill" :style="{ animationDuration: toast.duration + 'ms' }"></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const toasts = ref([]);
let nextId = 0;

const icons = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
  success: '🟢',
};

function addToast(type, title, message, duration = 6000) {
  const id = nextId++;
  toasts.value.push({ id, type, title, message, duration });
  setTimeout(() => dismiss(id), duration);
}

function dismiss(id) {
  const idx = toasts.value.findIndex(t => t.id === id);
  if (idx !== -1) toasts.value.splice(idx, 1);
}

// Expose for parent usage
defineExpose({ addToast });
</script>
