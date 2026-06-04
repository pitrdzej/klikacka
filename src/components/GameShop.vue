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
  bossWins: number
  unlockedSongCount: number
  prestigeRequiredSongCount: number
  hasPrestigeSongRequirement: boolean
  prestigeBought: boolean
  prestigeCost: number
  prestigeLevel: number
  prestigeMultiplier: number
}>()

const emit = defineEmits<{
  (e: 'buy-investor'): void
  (e: 'buy-ad'): void
  (e: 'buy-equipment'): void
  (e: 'buy-hall'): void
  (e: 'buy-tickets'): void
  (e: 'buy-song'): void
  (e: 'buy-prestige'): void
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

    <section class="upgrade shop-upgrade prestige" :class="{ ready: prestigeLevel >= 2 || (money >= prestigeCost && hasPrestigeSongRequirement && bossWins >= 20), active: prestigeLevel >= 1 }">
      <h3><i class="fa-solid fa-crown"></i> Prestiž</h3>
      <p class="desc">Trvalý efekt: každá prestiž výrazně zrychlí výdělek, kliky, publikum i kapacitu.</p>
      <p class="prestige-value">Aktuální bonus: <strong>x{{ formatHalfStep(prestigeMultiplier) }}</strong></p>
      <p class="prestige-status" v-if="prestigeLevel === 0">Koupíš první prestiž, resetuješ hru a začneš silněji.</p>
      <p class="prestige-status" v-else-if="prestigeLevel === 1">První prestiž aktivní. Odemkněte druhou pro ještě větší násobek.</p>
      <p class="prestige-status" v-else>Maximální prestiž. Vše se teď pohybuje rychleji a vydělává víc.</p>
      <ul class="prestige-conds">
        <li :class="{ ok: money >= prestigeCost }">Cena: alespoň ${{ formatHalfStep(prestigeCost) }}</li>
        <li :class="{ ok: hasPrestigeSongRequirement }">Odemčeno alespoň {{ prestigeRequiredSongCount }} písní ({{ unlockedSongCount }})</li>
        <li :class="{ ok: bossWins >= 20 }">Porazil jsi alespoň 20 bossů ({{ bossWins }})</li>
      </ul>
      <p class="price" :class="{ disabled: prestigeLevel >= 2 || money < prestigeCost || !hasPrestigeSongRequirement || bossWins < 20 }">
        <button class="prestige-button" :disabled="prestigeLevel >= 2 || money < prestigeCost || !hasPrestigeSongRequirement || bossWins < 20" @click.prevent="emit('buy-prestige')">
          {{ prestigeLevel >= 2 ? 'Prestiž max' : prestigeLevel === 1 ? 'Koupit druhou prestiž' : 'Koupit prestiž' }}
        </button>
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

.shop-upgrade.prestige {
  background: rgba(89, 44, 78, 0.98);
  border: 1px solid rgba(255, 204, 102, 0.14);
}

.prestige-conds {
  margin: 0.8rem 0 0;
  padding: 0;
  list-style: none;
  color: rgba(255, 255, 255, 0.78);
}

.prestige-conds li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-size: 0.92rem;
}

.prestige-conds li.ok {
  color: #b6ffae;
}

.prestige-conds li::before {
  content: '•';
  color: currentColor;
}

.prestige-conds li.ok::before {
  content: '✓';
}

.prestige-conds li:not(.ok) {
  opacity: 0.7;
}

.prestige-conds li:not(.ok)::before {
  color: #ff7d96;
}

.shop-upgrade.prestige.active {
  background: linear-gradient(145deg, rgba(255, 204, 102, 0.14), rgba(255, 191, 40, 0.2));
  border-color: rgba(255, 191, 40, 0.4);
}

.prestige-value {
  margin: 0.75rem 0 0.2rem;
  font-size: 1rem;
  font-weight: 700;
  color: #ffdc82;
  text-shadow: 0 0 10px rgba(255, 220, 130, 0.25);
}

.prestige-highlight {
  margin-top: 0.45rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.9rem;
  background: rgba(255, 199, 111, 0.1);
  color: #ffe7c4;
  font-weight: 600;
}

/* removed .small-note: prestige is applied automatically */

.prestige-status {
  margin-top: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.85rem;
  background: rgba(182, 255, 174, 0.12);
  color: #d5ffd0;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.prestige-button {
  width: 100%;
  border: none;
  background: linear-gradient(135deg, #ffbe4b, #ff8c63);
  color: #1b0d00;
  font-weight: 700;
  padding: 0.8rem 1rem;
  border-radius: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.prestige-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(255, 140, 99, 0.22);
}

.prestige-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
