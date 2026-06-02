<script setup lang="ts">
defineProps<{
  text: string
  tone: 'success' | 'error'
}>()
</script>

<template>
  <transition name="boss-toast-fade">
    <div v-if="text" class="boss-result-toast" :class="tone" role="status" aria-live="polite">
      <i :class="tone === 'success' ? 'fa-solid fa-trophy' : 'fa-solid fa-triangle-exclamation'"></i>
      <span>{{ text }}</span>
    </div>
  </transition>
</template>

<style scoped>
.boss-result-toast {
  position: fixed;
  top: 78px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 63, 33, 0.7);
  background: linear-gradient(135deg, rgba(10, 34, 20, 0.95), rgba(15, 84, 45, 0.92));
  color: #d1fae5;
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.25);
  font-weight: 700;
}

.boss-result-toast i {
  color: #86efac;
}

.boss-result-toast.error {
  border-color: rgba(127, 29, 29, 0.8);
  background: linear-gradient(135deg, rgba(69, 10, 10, 0.95), rgba(127, 29, 29, 0.92));
  color: #fee2e2;
  box-shadow: 0 10px 30px rgba(248, 113, 113, 0.25);
}

.boss-result-toast.error i {
  color: #fca5a5;
}

.boss-toast-fade-enter-active,
.boss-toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.boss-toast-fade-enter-from,
.boss-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
