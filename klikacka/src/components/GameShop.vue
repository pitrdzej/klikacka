<script setup lang="ts">
import { computed } from 'vue'
import { formatHalfStep } from '@/utils/number'

const props = defineProps<{
  money: number
  investors: number
  equipment: number
  ticketPrice: number
  audience: number
  capacity: number
  adLevel: number
  investorCost: number
  adCost: number
  equipmentCost: number
  ticketsCost: number
  hallInvestorRequirement: number
  clickPower: number
}>()

const emit = defineEmits<{
  (e: 'buy-investor'): void
  (e: 'buy-ad'): void
  (e: 'buy-equipment'): void
  (e: 'buy-hall'): void
  (e: 'buy-tickets'): void
}>()

const adPeoplePerCycle = computed(() => 5 + Math.floor(props.adLevel / 2))
const adPersonDelaySeconds = computed(() => {
  const baseDelay = 20000
  const delayReduction = Math.min(props.adLevel * 2000, 18000)
  return Math.max(baseDelay - delayReduction, 2000) / 1000
})
</script>

<template>
  <aside class="sidebar">
    <h2>Vylepšení</h2>

    <section class="upgrade" @click="emit('buy-investor')">
      <h3><i class="fa-solid fa-handshake"></i> Investor</h3>
      <p class="desc">+{{ formatHalfStep(1 + investors * 2.5) }}$ / 2s (max 2000)</p>
      <p class="price" :class="{ disabled: money < investorCost }">${{ formatHalfStep(investorCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-ad')">
      <h3><i class="fa-solid fa-bullhorn"></i> Reklama</h3>
      <p class="desc">{{ adPeoplePerCycle }} lidí za {{ adPersonDelaySeconds }}s (max 100)</p>
      <p class="price" :class="{ disabled: money < adCost || audience >= capacity }">${{ formatHalfStep(adCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-equipment')">
      <h3><i class="fa-solid fa-music"></i> Vybavení</h3>
      <p class="desc">+{{ formatHalfStep(clickPower) }}$ / klik (max 4000)</p>
      <p class="price" :class="{ disabled: money < equipmentCost }">${{ formatHalfStep(equipmentCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-hall')">
      <h3><i class="fa-solid fa-building"></i> Sál</h3>
      <p class="desc">+10 kapacity ({{ hallInvestorRequirement }} investorů)</p>
      <p class="price" :class="{ disabled: investors < hallInvestorRequirement }">Vyžaduje {{ hallInvestorRequirement }} investorů</p>
    </section>

    <section class="upgrade" @click="emit('buy-tickets')">
      <h3><i class="fa-solid fa-ticket"></i> Dražší lístky</h3>
      <p class="desc">+{{ formatHalfStep(1 + (ticketPrice - 1) * 6) }}$ / lístek (max 7000)</p>
      <p class="price" :class="{ disabled: money < ticketsCost }">${{ formatHalfStep(ticketsCost) }}</p>
    </section>
  </aside>
</template>
