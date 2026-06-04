<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  bossActive: boolean
  bossCurrentName: string
  bossIncomingName: string
  bossNextInSeconds: number
  bossBarVisibleSeconds: number
}>()

const showBossBar = computed(() => {
  if (props.bossActive) return false
  return props.bossNextInSeconds > 0 && props.bossNextInSeconds <= props.bossBarVisibleSeconds
})

const bossBarProgress = computed(() => {
  if (props.bossActive) return 0
  if (props.bossNextInSeconds <= 0 || props.bossNextInSeconds > props.bossBarVisibleSeconds) return 0

  const elapsedVisibleWindow = props.bossBarVisibleSeconds - props.bossNextInSeconds
  return Math.max(0, Math.min(100, Math.floor((elapsedVisibleWindow / props.bossBarVisibleSeconds) * 100)))
})

const bossBarHint = computed(() => {
  if (props.bossActive) return `Souboj s bossem: ${props.bossCurrentName}`
  if (props.bossIncomingName && props.bossNextInSeconds > 0) {
    return `Boss radar: ${props.bossIncomingName} dorazí za ${props.bossNextInSeconds}s`
  }
  return 'Boss radar'
})

const bossBarAlert = computed(() => {
  return !props.bossActive && props.bossNextInSeconds > 0 && props.bossNextInSeconds <= 10
})
</script>

<template>
  <section v-if="showBossBar" class="boss-progress-strip" aria-live="polite">
    <p class="boss-progress-label" :class="{ alert: bossBarAlert }">{{ bossBarHint }}</p>
    <div class="boss-progress-track" :class="{ active: bossActive }">
      <span :style="{ width: bossBarProgress + '%' }"></span>
    </div>
  </section>
</template>

<style scoped>
.boss-progress-strip {
  width: 100%;
  max-width: 900px;
  padding: 8px 0 10px;
}

.boss-progress-label {
  margin: 0 0 6px;
  font-size: 0.78rem;
  color: #cbd5e1;
  letter-spacing: 0.01em;
}

.boss-progress-label.alert {
  color: #fde68a;
  animation: bossLabelBlink 0.8s ease-in-out infinite;
}

.boss-progress-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.boss-progress-track span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #818cf8);
  transition: width 0.2s ease;
}

.boss-progress-track.active span {
  background: linear-gradient(90deg, #fb7185, #f43f5e);
}

@keyframes bossLabelBlink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}
</style>
