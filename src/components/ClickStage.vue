<script setup lang="ts">
import { formatHalfStep } from '@/utils/number'
import type { BoostSlot, BoostType } from '@/game/types'
import StageAudience from '@/components/stage/StageAudience.vue'
import StageBoostSlots from '@/components/stage/StageBoostSlots.vue'
import StageBossFight from '@/components/stage/StageBossFight.vue'
import StageBossRadar from '@/components/stage/StageBossRadar.vue'
import StageKeyboardGuide from '@/components/stage/StageKeyboardGuide.vue'
import StagePiano from '@/components/stage/StagePiano.vue'
import StageSongSwitcher from '@/components/stage/StageSongSwitcher.vue'

defineProps<{
  money: number
  floatingTexts: Array<{ id: number; x: number; y: number; amount: number }>
  currentSongName: string
  unlockedSongNames: string[]
  selectedSongIndex: number
  capacity: number
  displayAudience: Array<{ active: boolean; hue: number }>
  audienceOverflow: number
  bossActive: boolean
  bossTimeLeftSeconds: number
  bossFightDurationSeconds: number
  bossClicksRequired: number
  bossClicksDone: number
  bossIncomingName: string
  bossCurrentName: string
  bossCurrentImage: string
  bossNextInSeconds: number
  bossBarVisibleSeconds: number
  lastPressedNote: string
  boostTimeLeftSeconds: number
  boostSlots: BoostSlot[]
  showKeyboardHelp: boolean
  prestigeLevel: number
  prestigeMultiplier: number
  extendedPianoEnabled: boolean
  extendedPianoUnlocked: boolean
}>()

const emit = defineEmits<{
  (e: 'sing', event: MouseEvent): void
  (e: 'select-song', index: number): void
  (e: 'activate-boost', type: BoostType): void
  (e: 'play-note', note: string, clientX: number, clientY: number): void
}>()
</script>

<template>
  <article class="stage-section">
    <section class="money-display">
      <i class="fa-solid fa-dollar-sign"></i>
      <span class="money-value">{{ formatHalfStep(money) }}</span>
    </section>

    <StageSongSwitcher
      :current-song-name="currentSongName"
      :unlocked-song-names="unlockedSongNames"
      :selected-song-index="selectedSongIndex"
      @select-song="emit('select-song', $event)"
    />

    <section class="stage" :class="{ 'boss-active': bossActive, 'prestige-active': prestigeLevel >= 1 }">
      <div class="spotlight"></div>
      <div v-if="prestigeLevel >= 1" class="stage-particles">
        <span
          class="particle"
          v-for="n in Math.min(12, Math.max(3, Math.floor(prestigeMultiplier * 3)))"
          :key="n"
        ></span>
      </div>

      <StageBossFight
        :boss-active="bossActive"
        :boss-current-name="bossCurrentName"
        :boss-current-image="bossCurrentImage"
        :boss-time-left-seconds="bossTimeLeftSeconds"
        :boss-fight-duration-seconds="bossFightDurationSeconds"
        :boss-clicks-required="bossClicksRequired"
        :boss-clicks-done="bossClicksDone"
      />

      <div class="click-area" :class="{ 'boss-target': bossActive }" data-action @click="emit('sing', $event)">
        <i class="fa-solid fa-user"></i>
        <div v-if="bossActive" class="boss-target-ring"></div>
      </div>

      <StagePiano
        :last-pressed-note="lastPressedNote"
        @play-note="(note, clientX, clientY) => emit('play-note', note, clientX, clientY)"
      />

      <div
        v-for="text in floatingTexts"
        :key="text.id"
        class="floating-text"
        :style="{ left: text.x + 'px', top: text.y + 'px' }"
      >
        +{{ formatHalfStep(text.amount) }}$
      </div>
    </section>

    <StageBoostSlots
      :boost-slots="boostSlots"
      :boost-time-left-seconds="boostTimeLeftSeconds"
      @activate-boost="emit('activate-boost', $event)"
    />

    <StageBossRadar
      :boss-active="bossActive"
      :boss-current-name="bossCurrentName"
      :boss-incoming-name="bossIncomingName"
      :boss-next-in-seconds="bossNextInSeconds"
      :boss-bar-visible-seconds="bossBarVisibleSeconds"
    />

    <StageKeyboardGuide
      :show-keyboard-help="showKeyboardHelp"
      :last-pressed-note="lastPressedNote"
      :extended-piano-enabled="extendedPianoEnabled"
      :extended-piano-unlocked="extendedPianoUnlocked"
    />

    <StageAudience
      :capacity="capacity"
      :display-audience="displayAudience"
      :audience-overflow="audienceOverflow"
    />
  </article>
</template>

<style scoped>
.stage.boss-active {
  min-height: 520px;
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

.stage.prestige-active {
  position: relative;
  box-shadow: inset 0 0 80px rgba(255, 160, 120, 0.06), 0 24px 60px rgba(255, 120, 140, 0.06);
}

.stage.prestige-active .spotlight {
  filter: drop-shadow(0 0 32px rgba(255, 180, 120, 0.18));
  transform: scale(1.02);
}

.stage.prestige-active::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 200, 140, 0.06), transparent 12%),
    radial-gradient(circle at 80% 78%, rgba(255, 120, 180, 0.04), transparent 10%);
  z-index: 6;
}

.stage.prestige-active .click-area {
  transform: translateY(-2px) scale(1.02);
  transition: transform 0.25s ease;
}

.click-area {
  transition: transform 0.12s ease, filter 0.12s ease;
}

.click-area i {
  display: inline-block;
  transition: transform 0.18s ease;
}

.stage.prestige-active .click-area i {
  animation: singerBob 1.2s ease-in-out infinite;
}

@keyframes singerBob {
  0% {
    transform: translateY(0) scale(1);
  }

  25% {
    transform: translateY(-4px) scale(1.01);
  }

  50% {
    transform: translateY(0) scale(1);
  }

  75% {
    transform: translateY(-2px) scale(1.005);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

.stage-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
  overflow: visible;
}

.stage-particles .particle {
  position: absolute;
  left: 50%;
  top: 30%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 120, 0.96), rgba(255, 120, 160, 0.8));
  opacity: 0;
  transform-origin: center;
  animation: particleFloat linear infinite;
}

.stage-particles .particle:nth-child(odd) {
  background: radial-gradient(circle, rgba(255, 200, 100, 0.98), rgba(255, 95, 140, 0.85));
}

.stage-particles .particle:nth-child(even) {
  background: radial-gradient(circle, rgba(255, 240, 170, 0.9), rgba(255, 140, 180, 0.85));
}

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.6);
  }

  10% {
    opacity: 1;
  }

  50% {
    opacity: 0.9;
    transform: translate3d(var(--dx, 0), var(--dy, -120px), 0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(var(--dx, 0), var(--dy, -200px), 0) scale(0.8);
  }
}
</style>
