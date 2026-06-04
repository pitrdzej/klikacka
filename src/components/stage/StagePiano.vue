<script setup lang="ts">
import { PIANO_BLACK_KEYS, PIANO_WHITE_KEYS } from '@/utils/notes'

defineProps<{
  lastPressedNote: string
}>()

defineEmits<{
  (e: 'play-note', note: string, clientX: number, clientY: number): void
}>()
</script>

<template>
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
          @click="$emit('play-note', keyItem.note, $event.clientX, $event.clientY)"
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
        @click="$emit('play-note', keyItem.note, $event.clientX, $event.clientY)"
      >
        <span class="note-name">{{ keyItem.note }}</span>
        <span class="key-label">{{ keyItem.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.piano {
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 392px;
  z-index: 10;
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

@media (max-width: 680px) {
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
}
</style>
