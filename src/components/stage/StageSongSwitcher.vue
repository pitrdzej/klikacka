<script setup lang="ts">
defineProps<{
  currentSongName: string
  unlockedSongNames: string[]
  selectedSongIndex: number
}>()

defineEmits<{
  (e: 'select-song', index: number): void
}>()
</script>

<template>
  <section class="song-switcher" aria-label="Výběr písničky">
    <p class="song-switcher-title">Aktuální písnička: {{ currentSongName }}</p>
    <div class="song-switcher-list">
      <button
        v-for="(songName, index) in unlockedSongNames"
        :key="songName"
        class="song-chip"
        :class="{ active: selectedSongIndex === index }"
        @click="$emit('select-song', index)"
      >
        {{ songName }}
      </button>
    </div>
  </section>
</template>

<style scoped>
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
</style>
