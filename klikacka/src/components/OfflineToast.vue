<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatHalfStep } from '@/utils/number'

const props = defineProps<{
  earnings: number
  offlineSeconds: number
}>()

const visible = ref(false)

watch(
  () => props.earnings,
  (val) => {
    if (val >= 0.5) {
      visible.value = true
    }
  },
  { immediate: true }
)

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  return `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`
}

function dismiss() {
  visible.value = false
}
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="offline-toast" @click="dismiss">
      <div class="offline-toast__icon">
        <i class="fa-solid fa-moon"></i>
      </div>
      <div class="offline-toast__body">
        <p class="offline-toast__title">Byl jsi pryč {{ formatDuration(offlineSeconds) }}</p>
        <p class="offline-toast__sub">Dostals <strong>+{{ formatHalfStep(earnings) }} $</strong> z nečinnosti</p>
      </div>
      <button class="offline-toast__close" aria-label="Zavřít">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.offline-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #1e1e2e;
  border: 1px solid #ff4d6d55;
  border-radius: 14px;
  padding: 14px 20px;
  cursor: pointer;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 77, 109, 0.15);
  min-width: 280px;
  max-width: 420px;
  user-select: none;
}

.offline-toast__icon {
  font-size: 1.6rem;
  color: #a78bfa;
  flex-shrink: 0;
}

.offline-toast__body {
  flex: 1;
  line-height: 1.4;
}

.offline-toast__title {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 2px;
}

.offline-toast__sub {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.offline-toast__sub strong {
  color: #ff4d6d;
}

.offline-toast__close {
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.2s;
}

.offline-toast__close:hover {
  color: #fff;
}

.toast-enter-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
