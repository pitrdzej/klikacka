<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  bossActive: boolean
  bossCurrentName: string
  bossCurrentImage: string
  bossTimeLeftSeconds: number
  bossFightDurationSeconds: number
  bossClicksRequired: number
  bossClicksDone: number
}>()

const bossProgress = computed(() => {
  if (props.bossClicksRequired <= 0) return 0
  return Math.min(100, Math.floor((props.bossClicksDone / props.bossClicksRequired) * 100))
})

const bossTimeProgress = computed(() => {
  if (!props.bossActive) return 0
  if (props.bossFightDurationSeconds <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((props.bossTimeLeftSeconds / props.bossFightDurationSeconds) * 100)))
})
</script>

<template>
  <div v-if="bossActive" class="boss-fight-alert" aria-live="assertive">
    <div class="boss-fight-card">
      <div class="boss-fight-head">
        <span class="boss-fight-tag">Boss fight</span>
        <strong>{{ bossCurrentName }}</strong>
      </div>

      <div class="boss-fight-rival">
        <img v-if="bossCurrentImage" :src="bossCurrentImage" :alt="bossCurrentName" class="boss-rival-photo">
        <div v-else class="boss-rival-photo fallback"><i class="fa-solid fa-user-astronaut"></i></div>
        <span>{{ bossCurrentName }}</span>
      </div>

      <p class="boss-fight-instruction">Klikni na zpěváka pod panelem a poraz bosse dřív, než vyprší čas.</p>

      <div class="boss-fight-stats">
        <span>{{ bossClicksDone }} / {{ bossClicksRequired }} hitů</span>
        <span>{{ bossTimeLeftSeconds }}s</span>
      </div>

      <div class="boss-fight-meter player">
        <span :style="{ width: bossProgress + '%' }"></span>
      </div>

      <div class="boss-fight-meter timer">
        <span :style="{ width: bossTimeProgress + '%' }"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boss-fight-alert {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, calc(100% - 28px));
  z-index: 20;
  pointer-events: none;
}

.boss-fight-card {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(244, 114, 182, 0.5);
  background: linear-gradient(145deg, rgba(35, 16, 49, 0.92), rgba(17, 24, 39, 0.94));
  box-shadow: 0 18px 45px rgba(244, 63, 94, 0.22);
  backdrop-filter: blur(10px);
}

.boss-fight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.boss-fight-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.16);
  color: #fecdd3;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.boss-fight-head strong {
  color: #fff;
  font-size: 1rem;
}

.boss-fight-rival {
  margin: 4px 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fbcfe8;
  font-weight: 700;
}

.boss-rival-photo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(244, 114, 182, 0.8);
  box-shadow: 0 0 16px rgba(244, 114, 182, 0.35);
}

.boss-rival-photo.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 114, 182, 0.18);
  color: #f9a8d4;
}

.boss-fight-instruction {
  margin: 0 0 10px;
  color: #e5e7eb;
  font-size: 0.86rem;
}

.boss-fight-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #fbcfe8;
  font-size: 0.82rem;
  font-weight: 700;
}

.boss-fight-meter {
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.boss-fight-meter + .boss-fight-meter {
  margin-top: 8px;
}

.boss-fight-meter span {
  display: block;
  height: 100%;
  transition: width 0.18s ease;
}

.boss-fight-meter.player span {
  background: linear-gradient(90deg, #22c55e, #84cc16);
}

.boss-fight-meter.timer span {
  background: linear-gradient(90deg, #fb7185, #f97316);
}
</style>
