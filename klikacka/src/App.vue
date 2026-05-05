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
        <a @click="saveGame" title="Uložit hru"><i class="fa-solid fa-save"></i></a>
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