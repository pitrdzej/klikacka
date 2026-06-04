<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  investors: number
  totalUpgradeCount: number
  capacity: number
  extendedPianoEnabled: boolean
  extendedPianoUnlocked: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-extended-piano'): void
  (e: 'show-keyboard-help'): void
}>()

const investorProgress = computed(() => Math.min(100, Math.floor((props.investors / 20) * 100)))
const upgradeProgress = computed(() => Math.min(100, Math.floor((props.totalUpgradeCount / 10) * 100)))
const capacityProgress = computed(() => Math.min(100, Math.floor((props.capacity / 80) * 100)))
const milestoneProgress = computed(() => Math.min(investorProgress.value, upgradeProgress.value, capacityProgress.value))

const statusLabel = computed(() => {
  if (!props.extendedPianoUnlocked) {
    return 'zamčeno'
  }
  return props.extendedPianoEnabled ? 'aktivní' : 'neaktivní'
})

const statusClass = computed(() => ({
  unlocked: props.extendedPianoUnlocked,
  active: props.extendedPianoEnabled,
  clickable: props.extendedPianoUnlocked
}))

function handleToggle(): void {
  if (!props.extendedPianoUnlocked) return
  emit('toggle-extended-piano')
}

function openKeyboardHelp(): void {
  emit('show-keyboard-help')
}
</script>

<template>
  <section class="milestone-box" aria-label="Rozšířené piano">
    <div class="milestone-header">
      <div>
        <h3>Rozšířené piano</h3>
      </div>
      <span class="status-chip" :class="statusClass" @click="handleToggle">
        {{ statusLabel }}
      </span>
    </div>

    <div class="milestone-progress">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: milestoneProgress + '%' }"></div>
        <div class="progress-slider" :style="{ left: milestoneProgress + '%' }"></div>
      </div>
      <span class="progress-label">Celkový postup: {{ milestoneProgress }}%</span>
    </div>

    <ul class="condition-list">
      <li :class="{ ok: investors >= 20 }">
        <span>Investoři</span>
        <strong>{{ investors }}/20</strong>
      </li>
      <li :class="{ ok: totalUpgradeCount >= 10 }">
        <span>Vybavení</span>
        <strong>{{ totalUpgradeCount }}/10</strong>
      </li>
      <li :class="{ ok: capacity >= 80 }">
        <span>Kapacita</span>
        <strong>{{ capacity }}/80</strong>
      </li>
    </ul>

    <button class="help-action" type="button" @click="openKeyboardHelp">
      Nápověda kláves
    </button>
  </section>
</template>

<style scoped>
.milestone-box {
  margin-top: 1.5rem;
  padding: 1.3rem 1.4rem;
  border-radius: 1.1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.03), 0 16px 30px rgba(0, 0, 0, 0.14);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-note {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.84rem;
  line-height: 1.4;
  max-width: 18rem;
}

.milestone-header h3 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.03em;
  color: #fff;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.status-chip.clickable {
  cursor: pointer;
}

.status-chip.unlocked {
  background: linear-gradient(135deg, rgba(94, 231, 190, 0.16), rgba(84, 222, 242, 0.16));
}

.status-chip.active {
  background: linear-gradient(135deg, rgba(170, 129, 255, 0.22), rgba(255, 118, 167, 0.24));
}

.status-chip.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(255, 255, 255, 0.12);
}

.milestone-progress {
  margin-bottom: 1rem;
}

.progress-track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff6b9d, #ffca63);
  transition: width 0.4s ease;
}

.progress-slider {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(255, 255, 255, 0.9);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 16px rgba(255, 116, 149, 0.22);
  transition: left 0.4s ease;
}

.progress-label {
  display: block;
  margin-top: 0.55rem;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.92rem;
}

.condition-list {
  display: grid;
  gap: 0.7rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.condition-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
}

.condition-list li.ok {
  background: rgba(148, 255, 194, 0.12);
  border-color: rgba(148, 255, 194, 0.18);
}

.condition-list span {
  color: rgba(255, 255, 255, 0.8);
}

.condition-list strong {
  font-weight: 700;
  color: #fff;
}

.help-action {
  width: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.help-action:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}
</style>
