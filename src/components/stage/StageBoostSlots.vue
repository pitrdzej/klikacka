<script setup lang="ts">
import type { BoostSlot, BoostType } from '@/game/types'

defineProps<{
  boostSlots: BoostSlot[]
  boostTimeLeftSeconds: number
}>()

defineEmits<{
  (e: 'activate-boost', type: BoostType): void
}>()
</script>

<template>
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
      @click="slot.owned && !slot.active ? $emit('activate-boost', slot.type) : undefined"
    >
      <i :class="slot.icon"></i>
      <span class="boost-slot-label">{{ slot.label }}</span>
      <span class="boost-slot-effect">{{ slot.effect }}</span>
      <span class="boost-slot-state">
        {{ slot.active ? boostTimeLeftSeconds + 's' : slot.owned ? 'Připraveno' : 'Zamčeno' }}
      </span>
    </button>
  </section>
</template>

<style scoped>
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

@media (max-width: 680px) {
  .boost-slots {
    gap: 8px;
  }

  .boost-slot {
    width: 82px;
    height: 82px;
    padding: 8px;
  }
}
</style>
