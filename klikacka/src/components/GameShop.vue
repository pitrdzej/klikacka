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
  nextSongCost: number
  hallInvestorRequirement: number
  ticketIncomeIncreasePerUpgrade: number
  clickPowerIncreasePerUpgrade: number
  audienceJoinDelaySeconds: number
  audienceIncomeIntervalSeconds: number
  audienceStaySeconds: number
  currentSongName: string
  nextSongName: string
  hasNextSong: boolean
}>()

const emit = defineEmits<{
  (e: 'buy-investor'): void
  (e: 'buy-ad'): void
  (e: 'buy-equipment'): void
  (e: 'buy-hall'): void
  (e: 'buy-tickets'): void
  (e: 'buy-song'): void
}>()

const adPeoplePerCycle = computed(() => 3 + Math.floor(props.adLevel * 0.35))
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
      <p class="desc">{{ adPeoplePerCycle }} lidí po {{ formatHalfStep(audienceJoinDelaySeconds) }}s</p>
      <p class="desc">Výdělek každých {{ formatHalfStep(audienceIncomeIntervalSeconds) }}s · zůstanou {{ formatHalfStep(audienceStaySeconds) }}s</p>
      <p class="price" :class="{ disabled: money < adCost || audience >= capacity }">${{ formatHalfStep(adCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-equipment')">
      <h3><i class="fa-solid fa-music"></i> Vybavení</h3>
      <p class="desc">+{{ formatHalfStep(clickPowerIncreasePerUpgrade) }}$ / klik za upgrade (max 12000)</p>
      <p class="price" :class="{ disabled: money < equipmentCost }">${{ formatHalfStep(equipmentCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-hall')">
      <h3><i class="fa-solid fa-building"></i> Sál</h3>
      <p class="desc">+10 kapacity ({{ hallInvestorRequirement }} investorů)</p>
      <p class="price" :class="{ disabled: investors < hallInvestorRequirement }">Vyžaduje {{ hallInvestorRequirement }} investorů</p>
    </section>

    <section class="upgrade" @click="emit('buy-tickets')">
      <h3><i class="fa-solid fa-ticket"></i> Dražší lístky</h3>
      <p class="desc">+{{ formatHalfStep(ticketIncomeIncreasePerUpgrade) }}$ / lístek za upgrade (max 7000)</p>
      <p class="price" :class="{ disabled: money < ticketsCost }">${{ formatHalfStep(ticketsCost) }}</p>
    </section>

    <section class="upgrade" @click="emit('buy-song')">
      <h3><i class="fa-solid fa-compact-disc"></i> Obchod s písničkami</h3>
      <p class="desc">Teď hraje: {{ currentSongName }}</p>
      <p class="desc" v-if="hasNextSong">Odemkne: {{ nextSongName }}</p>
      <p class="desc" v-else>Všechny písničky odemčeny</p>
      <p class="price" :class="{ disabled: !hasNextSong || money < nextSongCost }">
        {{ hasNextSong ? '$' + formatHalfStep(nextSongCost) : 'MAX' }}
      </p>
    </section>
  </aside>
</template>
