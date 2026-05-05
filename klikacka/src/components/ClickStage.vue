<script setup lang="ts">
import { computed } from 'vue'
import { formatHalfStep } from '@/utils/number'
import { ALL_NOTES, NOTE_KEY_LABELS } from '@/utils/notes'

const props = defineProps<{
  money: number
  floatingTexts: Array<{ id: number; x: number; y: number; amount: number }>
  currentSongName: string
  unlockedSongNames: string[]
  selectedSongIndex: number
  audience: number
  capacity: number
  displayAudience: Array<{ active: boolean; hue: number }>
  audienceOverflow: number
  bossActive: boolean
  bossTimeLeftSeconds: number
  bossFightDurationSeconds: number
  bossClicksRequired: number
  bossClicksDone: number
  bossIncomingName: string
  bossIncomingImage: string
  bossCurrentName: string
  bossCurrentImage: string
  bossNextInSeconds: number
  bossSpawnProgress: number
  bossBarVisibleSeconds: number
  bossWarningText: string
  lastPressedNote: string
}>()

const emit = defineEmits<{
  (e: 'sing', event: MouseEvent): void
  (e: 'select-song', index: number): void
}>()

const bossProgress = computed(() => {
  if (props.bossClicksRequired <= 0) return 0
  return Math.min(100, Math.floor((props.bossClicksDone / props.bossClicksRequired) * 100))
})

const bossBarProgress = computed(() => {
  if (props.bossActive) return bossProgress.value
  if (props.bossNextInSeconds <= 0 || props.bossNextInSeconds > props.bossBarVisibleSeconds) return 0

  const elapsedVisibleWindow = props.bossBarVisibleSeconds - props.bossNextInSeconds
  return Math.max(0, Math.min(100, Math.floor((elapsedVisibleWindow / props.bossBarVisibleSeconds) * 100)))
})

const bossTimeProgress = computed(() => {
  if (!props.bossActive) return 0
  if (props.bossFightDurationSeconds <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((props.bossTimeLeftSeconds / props.bossFightDurationSeconds) * 100)))
})

const showBossBar = computed(() => {
  if (props.bossActive) return false
  return props.bossNextInSeconds > 0 && props.bossNextInSeconds <= props.bossBarVisibleSeconds
})

const bossBarHint = computed(() => {
  if (props.bossActive) return `Souboj s bossem: ${props.bossCurrentName}`
  if (props.bossIncomingName && props.bossNextInSeconds > 0) {
    return `Boss radar: ${props.bossIncomingName} dorazí za ${props.bossNextInSeconds}s`
  }
  return 'Boss radar'
})

const bossBarAlert = computed(() => !props.bossActive && props.bossNextInSeconds > 0 && props.bossNextInSeconds <= 10)

const visibleAudienceCount = computed(() => props.displayAudience.filter((member) => member.active).length)
</script>

<template>
  <article class="stage-section">
    <section class="money-display">
      <i class="fa-solid fa-dollar-sign"></i>
      <span class="money-value">{{ formatHalfStep(money) }}</span>
    </section>

    <section class="song-switcher" aria-label="Výběr písničky">
      <p class="song-switcher-title">Aktuální písnička: {{ currentSongName }}</p>
      <div class="song-switcher-list">
        <button
          v-for="(songName, index) in unlockedSongNames"
          :key="songName"
          class="song-chip"
          :class="{ active: selectedSongIndex === index }"
          @click="emit('select-song', index)"
        >
          {{ songName }}
        </button>
      </div>
    </section>

    <section class="stage" :class="{ 'boss-active': bossActive }">
      <div class="spotlight"></div>

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

      <div class="click-area" :class="{ 'boss-target': bossActive }" data-action @click="emit('sing', $event)">
        <i class="fa-solid fa-user"></i>
        <div v-if="bossActive" class="boss-target-ring"></div>
      </div>

      <div class="piano">
        <div class="piano-row">
          <div
            v-for="note in ALL_NOTES.slice(0, 7)"
            :key="note"
            class="piano-key"
            :class="{ active: lastPressedNote === note }"
          >
            <span class="note-name">{{ note }}</span>
            <span class="key-label">{{ NOTE_KEY_LABELS[note] }}</span>
          </div>
        </div>
        <div class="piano-row">
          <div
            v-for="note in ALL_NOTES.slice(7)"
            :key="note"
            class="piano-key"
            :class="{ active: lastPressedNote === note }"
          >
            <span class="note-name">{{ note }}</span>
            <span class="key-label">{{ NOTE_KEY_LABELS[note] }}</span>
          </div>
        </div>
      </div>
      <div
        v-for="text in floatingTexts"
        :key="text.id"
        class="floating-text"
        :style="{ left: text.x + 'px', top: text.y + 'px' }"
      >
        +{{ formatHalfStep(text.amount) }}$
      </div>
    </section>

    <section v-if="showBossBar" class="boss-progress-strip" aria-live="polite">
      <p class="boss-progress-label" :class="{ alert: bossBarAlert }">{{ bossBarHint }}</p>
      <div class="boss-progress-track" :class="{ active: bossActive }">
        <span :style="{ width: bossBarProgress + '%' }"></span>
      </div>
    </section>

    <section class="publikum">
      <h3><i class="fa-solid fa-users"></i> Publikum</h3>

      <div class="audience-container">
        <div
          v-for="(member, index) in displayAudience"
          :key="index"
          class="audience-member"
          :class="{ active: member.active }"
          :style="member.active ? { '--audience-hue': `${member.hue}`, '--audience-color': `hsl(${member.hue} 85% 62%)` } : undefined"
        ></div>
      </div>

      <p class="audience-stats">
        {{ visibleAudienceCount }}{{ audienceOverflow > 0 ? ' + ' + audienceOverflow : '' }} / {{ capacity }}
      </p>
    </section>
  </article>
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

.song-switcher {
  width: 100%;
  max-width: 900px;
  margin: -6px 0 12px;
}

.song-switcher-title {
  margin: 0 0 8px;
  font-size: 0.82rem;
  color: #cbd5e1;
  text-align: center;
}

.song-switcher-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.song-chip {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.76rem;
  cursor: pointer;
}

.song-chip.active {
  border-color: #ff4d6d;
  background: rgba(255, 77, 109, 0.3);
}

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

.stage.boss-active {
  min-height: 520px;
}

.piano {
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  z-index: 10;
}

.click-area.boss-target {
  transform: scale(1.08);
  filter: drop-shadow(0 0 18px rgba(251, 113, 133, 0.75));
  margin-top: 140px;
}

.boss-target-ring {
  position: absolute;
  inset: -24px;
  border-radius: 50%;
  border: 3px solid rgba(251, 113, 133, 0.65);
  box-shadow: 0 0 24px rgba(251, 113, 133, 0.4);
  animation: bossPulse 1s ease-in-out infinite;
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

@keyframes bossPulse {
  0%,
  100% {
    transform: scale(0.96);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.piano-row {
  display: flex;
  gap: 4px;
}

.piano-key {
  width: 40px;
  height: 44px;
  border-radius: 6px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0 4px;
  font-weight: 700;
  color: #999;
  transition: 0.1s;
  user-select: none;
}

.note-name {
  font-size: 0.7rem;
  color: #bbb;
}

.key-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #666;
}

.piano-key.active {
  background: rgba(255, 77, 109, 0.3);
  border-color: #ff4d6d;
  color: #fff;
  box-shadow: 0 0 12px rgba(255, 77, 109, 0.6);
}

.piano-key.active .note-name,
.piano-key.active .key-label {
  color: #fff;
}

.audience-member.active {
  background: radial-gradient(circle at 30% 30%, hsl(var(--audience-hue, 0) 90% 72%), hsl(var(--audience-hue, 0) 85% 58%));
  box-shadow: 0 0 10px var(--audience-color);
}

.audience-member.active::before {
  background: hsl(var(--audience-hue, 0) 85% 78%);
}

.audience-member.active::after {
  background: hsl(var(--audience-hue, 0) 75% 45%);
}
</style>
