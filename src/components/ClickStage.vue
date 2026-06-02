<script setup lang="ts">
import { computed } from 'vue'
import { formatHalfStep } from '@/utils/number'
import { PIANO_BLACK_KEYS, PIANO_WHITE_KEYS } from '@/utils/notes'

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
  boostTimeLeftSeconds: number
  boostSlots: Array<{
    type: 'click' | 'investor' | 'audience'
    label: string
    icon: string
    effect: string
    tooltip: string
    owned: boolean
    active: boolean
  }>
  showKeyboardHelp: boolean
}>()

const emit = defineEmits<{
  (e: 'sing', event: MouseEvent): void
  (e: 'select-song', index: number): void
  (e: 'activate-boost', type: 'click' | 'investor' | 'audience'): void
  (e: 'play-note', note: string, clientX: number, clientY: number): void
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
const hasExtendedKeyboard = computed(() => props.unlockedSongNames.length > 1)

const BASE_KEYBOARD_ROWS = [
  [
    { key: 'W', note: 'C#4' },
    { key: 'E', note: 'D#4' },
    { key: 'T', note: 'F#4' },
    { key: 'Z', note: 'G#4' },
    { key: 'U', note: 'A#4' }
  ],
  [
    { key: 'A', note: 'C4' },
    { key: 'S', note: 'D4' },
    { key: 'D', note: 'E4' },
    { key: 'F', note: 'F4' },
    { key: 'G', note: 'G4' },
    { key: 'H', note: 'A4' },
    { key: 'J', note: 'B4' },
    { key: 'K', note: 'C5' }
  ]
]

const EXTENDED_KEYBOARD_ROWS = [
  [
    { key: '1', note: 'C#3' },
    { key: '2', note: 'D#3' },
    { key: '3', note: 'F#3' },
    { key: '4', note: 'G#3' },
    { key: '5', note: 'A#3' }
  ],
  [
    { key: 'Q', note: 'C3' },
    { key: 'X', note: 'D3' },
    { key: 'C', note: 'E3' },
    { key: 'V', note: 'F3' },
    { key: 'B', note: 'G3' },
    { key: 'N', note: 'A3' },
    { key: 'M', note: 'B3' }
  ],
  [
    { key: '6', note: 'C#5' },
    { key: '7', note: 'D#5' },
    { key: '8', note: 'F#5' },
    { key: '9', note: 'G#5' },
    { key: '0', note: 'A#5' },
    { key: 'R', note: 'D5' },
    { key: 'Y', note: 'E5' },
    { key: 'I', note: 'F5' },
    { key: 'O', note: 'G5' },
    { key: 'P', note: 'A5' },
    { key: 'L', note: 'B5' }
  ]
]
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
        <div class="piano-black-row">
          <div
            v-for="(keyItem, index) in PIANO_BLACK_KEYS"
            :key="keyItem?.note ?? `empty-${index}`"
            class="piano-black-slot"
          >
            <div
              v-if="keyItem"
              class="piano-black-key"
              :class="{ active: lastPressedNote === keyItem.note }"
              @click="emit('play-note', keyItem.note, $event.clientX, $event.clientY)"
            >
              <span class="note-name">{{ keyItem.note }}</span>
              <span class="key-label">{{ keyItem.label }}</span>
            </div>
          </div>
        </div>

        <div class="piano-white-row">
          <div
            v-for="keyItem in PIANO_WHITE_KEYS"
            :key="keyItem.note"
            class="piano-white-key"
            :class="{ active: lastPressedNote === keyItem.note }"
            @click="emit('play-note', keyItem.note, $event.clientX, $event.clientY)"
          >
            <span class="note-name">{{ keyItem.note }}</span>
            <span class="key-label">{{ keyItem.label }}</span>
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

    <section class="boost-slots" aria-label="Aktivní vybavení">
      <button
        v-for="slot in boostSlots"
        :key="slot.type"
        class="boost-slot"
        :class="{
          unlocked: slot.owned,
          active: slot.active,
          locked: !slot.owned
        }"
        :title="slot.tooltip"
        @click="slot.owned && !slot.active ? emit('activate-boost', slot.type) : undefined"
      >
        <i :class="slot.icon"></i>
        <span class="boost-slot-label">{{ slot.label }}</span>
        <span class="boost-slot-effect">{{ slot.effect }}</span>
        <span class="boost-slot-state">
          {{ slot.active ? boostTimeLeftSeconds + 's' : slot.owned ? 'Připraveno' : 'Zamčeno' }}
        </span>
      </button>
    </section>

    <section v-if="showBossBar" class="boss-progress-strip" aria-live="polite">
      <p class="boss-progress-label" :class="{ alert: bossBarAlert }">{{ bossBarHint }}</p>
      <div class="boss-progress-track" :class="{ active: bossActive }">
        <span :style="{ width: bossBarProgress + '%' }"></span>
      </div>
    </section>

    <transition name="keyboard-help-fade">
      <section v-if="showKeyboardHelp" class="keyboard-guide" aria-label="QWERTZ mapa kláves pro piano">
        <div class="keyboard-guide-header">
          <h3><i class="fa-solid fa-keyboard"></i> Piano nápověda (QWERTZ)</h3>
          <span class="guide-badge" :class="{ on: hasExtendedKeyboard }">
            {{ hasExtendedKeyboard ? 'Rozšířené noty aktivní' : 'Rozšířené noty po první písničce' }}
          </span>
        </div>

        <p class="keyboard-guide-help">
          Hraj přímo z klávesnice. Zvýrazněná políčka ukazují právě hranou notu.
        </p>

        <div class="keyboard-layout-grid">
          <div class="key-map-card">
            <p class="key-map-title">Základ</p>
            <div class="key-map-row" v-for="(row, rowIndex) in BASE_KEYBOARD_ROWS" :key="`base-${rowIndex}`">
              <div
                v-for="item in row"
                :key="item.key + item.note"
                class="key-map-item"
                :class="{ active: lastPressedNote === item.note }"
              >
                <span class="key-map-key">{{ item.key }}</span>
                <span class="key-map-note">{{ item.note }}</span>
              </div>
            </div>
          </div>

          <div class="key-map-card extended-card" :class="{ locked: !hasExtendedKeyboard }">
            <p class="key-map-title">Rozšířené</p>
            <div class="key-map-row" v-for="(row, rowIndex) in EXTENDED_KEYBOARD_ROWS" :key="`ext-${rowIndex}`">
              <div
                v-for="item in row"
                :key="item.key + item.note"
                class="key-map-item extended"
                :class="{ active: lastPressedNote === item.note }"
              >
                <span class="key-map-key">{{ item.key }}</span>
                <span class="key-map-note">{{ item.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </transition>

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

.boost-slots {
  width: 100%;
  max-width: 900px;
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 6px 0 6px;
}

.boost-slot {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid rgba(148, 163, 184, 0.45);
  background: radial-gradient(circle at 30% 30%, rgba(71, 85, 105, 0.7), rgba(15, 23, 42, 0.9));
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: default;
  padding: 10px;
}

.boost-slot i {
  font-size: 1rem;
}

.boost-slot.unlocked {
  border-color: rgba(248, 113, 113, 0.75);
  color: #fee2e2;
  cursor: pointer;
}

.boost-slot.active {
  border-color: rgba(251, 113, 133, 1);
  box-shadow: 0 0 18px rgba(251, 113, 133, 0.6);
  background: radial-gradient(circle at 30% 30%, rgba(251, 113, 133, 0.72), rgba(127, 29, 29, 0.95));
}

.boost-slot.locked {
  opacity: 0.62;
}

.boost-slot-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.1;
}

.boost-slot-effect {
  font-size: 0.56rem;
  text-align: center;
  color: #fbcfe8;
  line-height: 1.1;
}

.boost-slot-state {
  font-size: 0.58rem;
  opacity: 0.9;
  text-align: center;
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
  align-items: center;
  width: 392px;
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

.piano-black-row {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  width: 330px;
  margin: 0 auto -18px;
}

.piano-black-slot {
  display: flex;
  justify-content: center;
}

.piano-white-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  width: 392px;
}

.piano-white-key {
  height: 68px;
  border-radius: 0 0 10px 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 6px;
  font-weight: 700;
  color: #374151;
  transition: 0.1s;
  user-select: none;
  box-shadow: 0 10px 16px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.piano-black-key {
  width: 30px;
  height: 44px;
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, #111827, #2b2132);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0 4px;
  font-weight: 700;
  color: #d1d5db;
  transition: 0.1s;
  user-select: none;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.28);
  cursor: pointer;
}

.note-name {
  font-size: 0.7rem;
  color: inherit;
}

.key-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: inherit;
}

.piano-white-key.active {
  background: #ffd5df;
  border-color: rgba(255, 77, 109, 0.5);
  color: #fff;
  box-shadow: 0 0 14px rgba(255, 77, 109, 0.55);
}

.piano-black-key.active {
  background: linear-gradient(180deg, #7f1d1d, #be123c);
  border-color: rgba(255, 77, 109, 0.6);
  color: #fff;
  box-shadow: 0 0 14px rgba(255, 77, 109, 0.55);
}

.keyboard-guide {
  width: 100%;
  max-width: 900px;
  margin: 4px 0 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(125, 211, 252, 0.28);
  background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 45%),
    linear-gradient(160deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.78));
  box-shadow: inset 0 0 18px rgba(15, 23, 42, 0.55), 0 12px 28px rgba(15, 23, 42, 0.35);
}

.keyboard-guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.keyboard-guide h3 {
  margin: 0;
  font-size: 0.94rem;
  color: #e2e8f0;
  letter-spacing: 0.01em;
}

.guide-badge {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.38);
  color: #fde68a;
}

.guide-badge.on {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.keyboard-guide-help {
  margin: 9px 0 13px;
  color: #cbd5e1;
  font-size: 0.79rem;
}

.keyboard-layout-grid {
  display: grid;
  gap: 9px;
  grid-template-columns: 1fr 1fr;
}

.key-map-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.54);
  padding: 10px;
}

.extended-card {
  border-color: rgba(167, 139, 250, 0.32);
  background: rgba(40, 20, 70, 0.22);
}

.key-map-card.locked {
  opacity: 0.62;
}

.key-map-title {
  margin: 0 0 8px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.key-map-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.key-map-row + .key-map-row {
  margin-top: 6px;
}

.key-map-item {
  min-width: 58px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.7);
  padding: 5px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.key-map-item.extended {
  border-color: rgba(167, 139, 250, 0.46);
}

.key-map-key {
  font-size: 0.69rem;
  font-weight: 800;
  color: #f8fafc;
}

.key-map-note {
  font-size: 0.68rem;
  color: #a5f3fc;
  font-weight: 700;
}

.key-map-item.active {
  border-color: #fb7185;
  background: rgba(244, 63, 94, 0.24);
  box-shadow: 0 0 14px rgba(251, 113, 133, 0.45);
}

.keyboard-help-fade-enter-active,
.keyboard-help-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.keyboard-help-fade-enter-from,
.keyboard-help-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 680px) {
  .boost-slots {
    gap: 8px;
  }

  .boost-slot {
    width: 82px;
    height: 82px;
    padding: 8px;
  }

  .piano {
    width: 312px;
  }

  .piano-white-row {
    width: 312px;
  }

  .piano-black-row {
    width: 264px;
    margin-bottom: -16px;
  }

  .piano-white-key {
    height: 58px;
  }

  .piano-black-key {
    width: 24px;
    height: 38px;
  }

  .keyboard-layout-grid {
    grid-template-columns: 1fr;
  }

  .keyboard-guide {
    padding: 10px;
  }

  .key-map-item {
    min-width: 56px;
  }

  .key-map-key {
    font-size: 0.64rem;
  }

  .key-map-note {
    font-size: 0.62rem;
  }
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
