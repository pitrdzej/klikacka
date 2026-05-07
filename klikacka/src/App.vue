<script setup lang="ts">
import { ref } from 'vue'
import '@/assets/reset.css'
import '@/assets/style.css'
import GameShop from '@/components/GameShop.vue'
import ClickStage from '@/components/ClickStage.vue'
import StatsTable from '@/components/StatsTable.vue'
import OfflineToast from '@/components/OfflineToast.vue'
import BossResultToast from '@/components/BossResultToast.vue'
import { useGameState } from '@/composables/useGameState'
import { setNotesMuted } from '@/utils/notes'

const {
  money,
  investors,
  equipment,
  ticketPrice,
  audience,
  capacity,
  adLevel,
  investorCost,
  adCost,
  equipmentCost,
  ticketsCost,
  nextSongCost,
  hasNextSong,
  unlockedSongNames,
  selectedSongIndex,
  currentSong,
  nextSongName,
  hallInvestorRequirement,
  hallCapacityIncrease,
  clickPower,
  investorIncome,
  investorIncomeIntervalSeconds,
  audienceJoinDelaySeconds,
  audienceIncome,
  audienceIncomeIntervalSeconds,
  audienceStaySeconds,
  ticketIncomePerPerson,
  ticketIncomeIncreasePerUpgrade,
  bossBarVisibleSeconds,
  clickPowerIncreasePerUpgrade,
  floatingTexts,
  offlineEarnings,
  offlineSeconds,
  lastPressedNote,
  bossActive,
  bossTimeLeftSeconds,
  bossFightDurationSeconds,
  bossClicksRequired,
  bossClicksDone,
  bossIncomingName,
  bossIncomingImage,
  bossCurrentName,
  bossCurrentImage,
  bossNextInSeconds,
  bossSpawnProgress,
  bossWarningText,
  bossResultText,
  bossResultTone,
  displayAudience,
  audienceOverflow,
  saveGame,
  sing,
  buyInvestor,
  buyAd,
  buyEquipment,
  buyHall,
  buyTickets,
  buySong,
  selectSong
} = useGameState()

const isMusicMuted = ref<boolean>(localStorage.getItem('musicMuted') === '1')
setNotesMuted(isMusicMuted.value)

const saveFlash = ref<boolean>(false)
function handleSave(): void {
  saveGame()
  saveFlash.value = true
  setTimeout(() => { saveFlash.value = false }, 1500)
}

const showKeyboardHelp = ref<boolean>(false)
function toggleKeyboardHelp(): void {
  showKeyboardHelp.value = !showKeyboardHelp.value
}

function toggleMusicMute(): void {
  isMusicMuted.value = !isMusicMuted.value
  setNotesMuted(isMusicMuted.value)
  localStorage.setItem('musicMuted', isMusicMuted.value ? '1' : '0')
}
</script>

<template>
  <div id="app">
    <OfflineToast :earnings="offlineEarnings" :offline-seconds="offlineSeconds" />
    <BossResultToast :text="bossResultText" :tone="bossResultTone" />
    <header>
      <a class="logo">
        <i class="fa-solid fa-microphone"></i>
      </a>
      <nav>
        <a @click="toggleMusicMute" :title="isMusicMuted ? 'Zapnout hudbu' : 'Vypnout hudbu'">
          <i :class="isMusicMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
        </a>
        <a
          class="help-toggle"
          @click="toggleKeyboardHelp"
          :title="showKeyboardHelp ? 'Skrýt nápovědu kláves' : 'Zobrazit nápovědu kláves'"
          :aria-pressed="showKeyboardHelp"
        >
          <i class="fa-solid fa-keyboard"></i>
          <span class="help-tooltip">{{ showKeyboardHelp ? 'Skrýt nápovědu kláves' : 'Zobrazit nápovědu kláves' }}</span>
        </a>
        <a @click="handleSave" title="Uložit hru" :class="{ 'save-flash': saveFlash }">
          <i class="fa-solid fa-save"></i>
          <span v-if="saveFlash" class="save-label">Uloženo!</span>
        </a>
        <a><i class="fa-solid fa-gear"></i></a>
      </nav>
    </header>

    <main class="layout">
      <GameShop
        :money="money"
        :investors="investors"
        :equipment="equipment"
        :ticket-price="ticketPrice"
        :audience="audience"
        :capacity="capacity"
        :ad-level="adLevel"
        :investor-cost="investorCost"
        :ad-cost="adCost"
        :equipment-cost="equipmentCost"
        :tickets-cost="ticketsCost"
        :next-song-cost="nextSongCost"
        :has-next-song="hasNextSong"
        :current-song-name="currentSong.name"
        :next-song-name="nextSongName"
        :hall-investor-requirement="hallInvestorRequirement"
        :hall-capacity-increase="hallCapacityIncrease"
        :ticket-income-increase-per-upgrade="ticketIncomeIncreasePerUpgrade"
        :click-power-increase-per-upgrade="clickPowerIncreasePerUpgrade"
        :audience-join-delay-seconds="audienceJoinDelaySeconds"
        :audience-income-interval-seconds="audienceIncomeIntervalSeconds"
        :audience-stay-seconds="audienceStaySeconds"
        @buy-investor="buyInvestor"
        @buy-ad="buyAd"
        @buy-equipment="buyEquipment"
        @buy-hall="buyHall"
        @buy-tickets="buyTickets"
        @buy-song="buySong"
      />

      <ClickStage
        :money="money"
        :floating-texts="floatingTexts"
        :current-song-name="currentSong.name"
        :unlocked-song-names="unlockedSongNames"
        :selected-song-index="selectedSongIndex"
        :audience="audience"
        :capacity="capacity"
        :display-audience="displayAudience"
        :audience-overflow="audienceOverflow"
        :boss-active="bossActive"
        :boss-time-left-seconds="bossTimeLeftSeconds"
        :boss-fight-duration-seconds="bossFightDurationSeconds"
        :boss-clicks-required="bossClicksRequired"
        :boss-clicks-done="bossClicksDone"
        :boss-incoming-name="bossIncomingName"
        :boss-incoming-image="bossIncomingImage"
        :boss-current-name="bossCurrentName"
        :boss-current-image="bossCurrentImage"
        :boss-next-in-seconds="bossNextInSeconds"
        :boss-spawn-progress="bossSpawnProgress"
        :boss-bar-visible-seconds="bossBarVisibleSeconds"
        :boss-warning-text="bossWarningText"
        :last-pressed-note="lastPressedNote"
        :show-keyboard-help="showKeyboardHelp"
        @sing="sing"
        @select-song="selectSong"
      />

      <StatsTable
        :investors="investors"
        :ad-level="adLevel"
        :audience="audience"
        :capacity="capacity"
        :equipment="equipment"
        :ticket-income-per-person="ticketIncomePerPerson"
        :click-power="clickPower"
        :audience-stay-seconds="audienceStaySeconds"
        :investor-income="investorIncome"
        :investor-income-interval-seconds="investorIncomeIntervalSeconds"
        :audience-income="audienceIncome"
        :audience-income-interval-seconds="audienceIncomeIntervalSeconds"
      />

    </main>
  </div>
</template>

<style scoped>
.save-flash {
  color: #4caf50 !important;
  transition: color 0.2s;
}
.save-label {
  font-size: 0.7rem;
  margin-left: 4px;
  font-weight: bold;
  color: #4caf50;
  vertical-align: middle;
}

.help-toggle {
  position: relative;
}

.help-toggle[aria-pressed='true'] {
  color: #7dd3fc !important;
}

.help-tooltip {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  padding: 6px 8px;
  color: #e2e8f0;
  font-size: 0.72rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.help-toggle:hover .help-tooltip,
.help-toggle:focus-visible .help-tooltip {
  opacity: 1;
  transform: translateY(0);
}
</style>