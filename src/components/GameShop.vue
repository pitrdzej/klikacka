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
  hallCapacityIncrease: number
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
  <aside class="sidebar shop-sidebar">
    <h2>Vylepšení</h2>

    <section class="upgrade shop-upgrade" :class="{ ready: money >= investorCost }" @click="emit('buy-investor')">
      <h3><i class="fa-solid fa-handshake"></i> Investor</h3>
      <p class="desc">+{{ formatHalfStep(1 + investors * 2.5) }}$ / 2s</p>
      <p class="price" :class="{ disabled: money < investorCost }">${{ formatHalfStep(investorCost) }}</p>
    </section>

    <section class="upgrade shop-upgrade" :class="{ ready: money >= adCost && audience < capacity }" @click="emit('buy-ad')">
      <h3><i class="fa-solid fa-bullhorn"></i> Reklama</h3>
      <p class="desc">{{ adPeoplePerCycle }} lidí po {{ formatHalfStep(audienceJoinDelaySeconds) }}s</p>
      <p class="desc">Výdělek každých {{ formatHalfStep(audienceIncomeIntervalSeconds) }}s · zůstanou {{ formatHalfStep(audienceStaySeconds) }}s</p>
      <p class="price" :class="{ disabled: money < adCost || audience >= capacity }">${{ formatHalfStep(adCost) }}</p>
    </section>

    <section class="upgrade shop-upgrade" :class="{ ready: money >= equipmentCost }" @click="emit('buy-equipment')">
      <h3><i class="fa-solid fa-music"></i> Vybavení</h3>
      <p class="desc">+{{ formatHalfStep(clickPowerIncreasePerUpgrade) }}$ / klik za upgrade</p>
      <p class="price" :class="{ disabled: money < equipmentCost }">${{ formatHalfStep(equipmentCost) }}</p>
    </section>

    <section class="upgrade shop-upgrade" :class="{ ready: investors >= hallInvestorRequirement }" @click="emit('buy-hall')">
      <h3><i class="fa-solid fa-building"></i> Sál</h3>
      <p class="desc">+{{ hallCapacityIncrease }} kapacity ({{ hallInvestorRequirement }} investorů)</p>
      <p class="price" :class="{ disabled: investors < hallInvestorRequirement }">Vyžaduje {{ hallInvestorRequirement }} investorů</p>
    </section>

    <section class="upgrade shop-upgrade" :class="{ ready: money >= ticketsCost }" @click="emit('buy-tickets')">
      <h3><i class="fa-solid fa-ticket"></i> Dražší lístky</h3>
      <p class="desc">+{{ formatHalfStep(ticketIncomeIncreasePerUpgrade) }}$ / lístek za upgrade</p>
      <p class="price" :class="{ disabled: money < ticketsCost }">${{ formatHalfStep(ticketsCost) }}</p>
    </section>

    <section class="upgrade shop-upgrade" :class="{ ready: hasNextSong && money >= nextSongCost }" @click="emit('buy-song')">
      <h3><i class="fa-solid fa-compact-disc"></i> Obchod s písničkami</h3>
      <p class="desc">Teď hraje: {{ currentSongName }}</p>
      <p class="desc" v-if="hasNextSong">Odemkne: {{ nextSongName }}</p>
      <p class="desc" v-else>Všechny písničky odemčeny</p>
      <p class="price" :class="{ disabled: !hasNextSong || money < nextSongCost }">
        {{ hasNextSong ? '$' + formatHalfStep(nextSongCost) : 'Vše odemčeno' }}
      </p>
    </section>
  </aside>
</template>

<style scoped>
.shop-sidebar {
  background: rgba(30, 24, 38, 0.96);
  box-shadow:
    inset 0 0 30px rgba(255, 77, 109, 0.08),
    0 18px 34px rgba(0, 0, 0, 0.22);
}

.shop-sidebar h2 {
  color: #ffd5df;
  letter-spacing: 0.02em;
  text-shadow: 0 0 14px rgba(255, 77, 109, 0.18);
}

.shop-upgrade {
  position: relative;
  overflow: hidden;
  background: rgba(48, 35, 49, 0.96);
  box-shadow:
    inset 0 0 10px rgba(255, 77, 109, 0.05),
    0 10px 20px rgba(0, 0, 0, 0.14);
}

.shop-upgrade::before {
  content: none;
}

.shop-upgrade:hover {
  transform: translateY(-2px) scale(1.015);
  background: rgba(58, 39, 58, 0.98);
  box-shadow:
    inset 0 0 12px rgba(255, 77, 109, 0.08),
    0 12px 24px rgba(0, 0, 0, 0.18),
    0 0 12px rgba(255, 77, 109, 0.1);
}

.shop-upgrade.ready {
  background: rgba(92, 42, 58, 0.98);
  box-shadow:
    inset 0 0 14px rgba(255, 77, 109, 0.16),
    0 10px 20px rgba(0, 0, 0, 0.15),
    0 0 16px rgba(255, 77, 109, 0.22);
}

.shop-upgrade h3,
.shop-upgrade .desc,
.shop-upgrade .price {
  position: relative;
  z-index: 1;
}

.shop-upgrade h3 {
  color: #fff8fb;
}

.shop-upgrade .desc {
  color: rgba(255, 255, 255, 0.82);
}

.shop-upgrade .price:not(.disabled) {
  color: #ff7d96;
  text-shadow: 0 0 10px rgba(255, 77, 109, 0.2);
}
</style>
