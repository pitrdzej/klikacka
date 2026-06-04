<script setup lang="ts">
import { computed } from 'vue'
import {
  EXTENDED_HIGHER_BLACK_KEYS,
  EXTENDED_HIGHER_WHITE_KEYS,
  EXTENDED_LOWER_BLACK_KEYS,
  EXTENDED_LOWER_WHITE_KEYS,
  PIANO_BLACK_KEYS,
  PIANO_WHITE_KEYS
} from '@/utils/notes'

const props = defineProps<{
  showKeyboardHelp: boolean
  lastPressedNote: string
  extendedPianoEnabled: boolean
  extendedPianoUnlocked: boolean
}>()

const hasExtendedKeyboard = computed(() => props.extendedPianoUnlocked && props.extendedPianoEnabled)
</script>

<template>
  <transition name="keyboard-help-fade">
    <section v-if="showKeyboardHelp" class="keyboard-guide" aria-label="QWERTZ mapa kláves pro piano">
      <div class="keyboard-guide-header">
        <h3><i class="fa-solid fa-keyboard"></i> Piano nápověda (QWERTZ)</h3>
        <span class="guide-badge" :class="{ on: hasExtendedKeyboard }">
          {{ extendedPianoUnlocked ? (extendedPianoEnabled ? 'Rozšířené noty aktivní' : 'Rozšířené noty vypnuté') : 'Rozšířené noty zamčené' }}
        </span>
      </div>

      <p class="keyboard-guide-help">
        Hraj z klávesnice. Hlavní řada A S D F G H J K hraje bílé noty, černé noty jsou W E • T Z U. Rozšířené piano přidává spodní oktávu a vyšší tóny.
      </p>

      <div v-if="!hasExtendedKeyboard" class="extended-promo">
        <p v-if="extendedPianoUnlocked">Rozšířené piano je odemčeno, ale vypnuto. Přepneš ho v boxu pod přehledem.</p>
        <p v-else>Rozšířené piano je zatím zamčeno. Získáš ho po 20 investorech, 10 vylepšeních a 80 kapacitě v hledišti.</p>
      </div>

      <div class="keyboard-layout-grid">
        <div class="key-map-card">
          <p class="key-map-title">Hlavní oktáva</p>
          <div class="key-map-row black-row">
            <template v-for="(item, index) in PIANO_BLACK_KEYS" :key="`main-black-${index}`">
              <div v-if="item" class="key-map-item black-key" :class="{ active: lastPressedNote === item.note }">
                <span class="key-map-key">{{ item.label }}</span>
                <span class="key-map-note">{{ item.note }}</span>
              </div>
              <div v-else class="key-map-space"></div>
            </template>
          </div>
          <div class="key-map-row">
            <div
              v-for="item in PIANO_WHITE_KEYS"
              :key="item.label + item.note"
              class="key-map-item"
              :class="{ active: lastPressedNote === item.note }"
            >
              <span class="key-map-key">{{ item.label }}</span>
              <span class="key-map-note">{{ item.note }}</span>
            </div>
          </div>
        </div>

        <div class="key-map-card extended-card" :class="{ locked: !hasExtendedKeyboard }">
          <p class="key-map-title">Rozšířené noty</p>
          <div class="key-map-row black-row">
            <template v-for="(item, index) in EXTENDED_LOWER_BLACK_KEYS" :key="`lower-black-${index}`">
              <div v-if="item" class="key-map-item black-key extended" :class="{ active: lastPressedNote === item.note }">
                <span class="key-map-key">{{ item.label }}</span>
                <span class="key-map-note">{{ item.note }}</span>
              </div>
              <div v-else class="key-map-space"></div>
            </template>
          </div>
          <div class="key-map-row">
            <div
              v-for="item in EXTENDED_LOWER_WHITE_KEYS"
              :key="item.label + item.note"
              class="key-map-item extended"
              :class="{ active: lastPressedNote === item.note }"
            >
              <span class="key-map-key">{{ item.label }}</span>
              <span class="key-map-note">{{ item.note }}</span>
            </div>
          </div>
          <div class="key-map-row black-row top-gap">
            <template v-for="(item, index) in EXTENDED_HIGHER_BLACK_KEYS" :key="`upper-black-${index}`">
              <div v-if="item" class="key-map-item black-key extended" :class="{ active: lastPressedNote === item.note }">
                <span class="key-map-key">{{ item.label }}</span>
                <span class="key-map-note">{{ item.note }}</span>
              </div>
              <div v-else class="key-map-space"></div>
            </template>
          </div>
          <div class="key-map-row">
            <div
              v-for="item in EXTENDED_HIGHER_WHITE_KEYS"
              :key="item.label + item.note"
              class="key-map-item extended"
              :class="{ active: lastPressedNote === item.note }"
            >
              <span class="key-map-key">{{ item.label }}</span>
              <span class="key-map-note">{{ item.note }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<style scoped>
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
  gap: 12px;
  grid-template-columns: 1fr;
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

.key-map-row.black-row {
  align-items: flex-end;
}

.key-map-row.top-gap {
  margin-top: 12px;
}

.key-map-row + .key-map-row {
  margin-top: 6px;
}

.key-map-space {
  min-width: 58px;
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

.key-map-item.black-key {
  background: rgba(15, 23, 42, 0.88);
  border-color: rgba(148, 163, 184, 0.36);
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
</style>
