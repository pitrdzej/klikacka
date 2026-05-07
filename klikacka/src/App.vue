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
import { playNote, setNotesMuted } from '@/utils/notes'

type BoostKind = 'click' | 'investor' | 'audience'

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
  boostTimeLeftSeconds,
  boostSlots,
  boostRewardPending,
  boostRewardOptions,
  displayAudience,
  audienceOverflow,
  claimBossRewardBoost,
  activateBoost,
  saveGame,
  sing,
  triggerManualNote,
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

const showSettingsMenu = ref<boolean>(false)
function toggleSettingsMenu(): void {
  showSettingsMenu.value = !showSettingsMenu.value
}

function scrollToSection(sectionId: 'shop-section' | 'stage-section' | 'stats-section'): void {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function playLogoChord(): void {
  playNote('C4')
  playNote('E4')
  playNote('G4')
}

const boostRewardChooserOpen = ref<boolean>(false)

function openBossRewardChooser(): void {
  boostRewardChooserOpen.value = true
}

function closeBossRewardChooser(): void {
  boostRewardChooserOpen.value = false
}

function pickBossRewardBoost(type: BoostKind): void {
  claimBossRewardBoost(type)
  boostRewardChooserOpen.value = false
}

function activateOwnedBoost(type: BoostKind): void {
  activateBoost(type)
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
      <a class="logo interactive-logo" @click="playLogoChord">
        <i class="fa-solid fa-microphone"></i>
      </a>
      <nav class="mobile-header-links header-center-links">
        <button @click="scrollToSection('shop-section')">Vylepšení</button>
        <button @click="scrollToSection('stage-section')">Stage</button>
        <button @click="scrollToSection('stats-section')">Přehled</button>
      </nav>
      <nav>
        <div class="settings-wrap">
          <a class="settings-toggle" @click="toggleSettingsMenu" title="Nastavení">
            <i class="fa-solid fa-gear"></i>
          </a>

          <div v-if="showSettingsMenu" class="settings-menu">
            <button class="settings-item" @click="toggleMusicMute">
              <i :class="isMusicMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
              <span>{{ isMusicMuted ? 'Zapnout hudbu' : 'Vypnout hudbu' }}</span>
            </button>
            <button class="settings-item" @click="toggleKeyboardHelp">
              <i class="fa-solid fa-keyboard"></i>
              <span>{{ showKeyboardHelp ? 'Skrýt nápovědu kláves' : 'Zobrazit nápovědu kláves' }}</span>
            </button>
            <button class="settings-item" :class="{ 'save-flash': saveFlash }" @click="handleSave">
              <i class="fa-solid fa-save"></i>
              <span>{{ saveFlash ? 'Uloženo!' : 'Uložit hru' }}</span>
            </button>
          </div>
        </div>
      </nav>
    </header>

    <section v-if="boostRewardPending && !boostRewardChooserOpen" class="boost-reward-banner" aria-live="polite">
      <div class="boost-reward-banner-card">
        <strong><i class="fa-solid fa-gift"></i> Porazil jsi bosse!</strong>
        <span>Vyber si boost jako odměnu.</span>
        <button class="boost-banner-action" @click="openBossRewardChooser">Vybrat vybavení</button>
      </div>
    </section>

    <section v-if="boostRewardChooserOpen" class="boost-reward-picker" aria-live="assertive">
      <div class="boost-reward-card">
        <h3><i class="fa-solid fa-gift"></i> Výběr vybavení za výhru</h3>
        <p>Vyber jedno vybavení. Přidá se do slotu pod stagí a aktivuješ ho až ručně kliknutím.</p>
        <div class="boost-reward-list">
          <button
            v-for="option in boostRewardOptions"
            :key="option.type"
            class="boost-reward-item"
            @click="pickBossRewardBoost(option.type)"
          >
            <strong><i :class="option.icon"></i> {{ option.label }}</strong>
            <em>{{ option.effect }}</em>
            <span>{{ option.description }}</span>
          </button>
        </div>
        <button class="boost-action-secondary boost-chooser-cancel" @click="closeBossRewardChooser">Rozhodnu se jindy</button>
      </div>
    </section>

    <main class="layout">
      <GameShop
        id="shop-section"
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
        id="stage-section"
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
        :boost-slots="boostSlots"
        :boost-time-left-seconds="boostTimeLeftSeconds"
        :show-keyboard-help="showKeyboardHelp"
        @sing="sing"
        @select-song="selectSong"
        @activate-boost="activateOwnedBoost"
        @play-note="triggerManualNote"
      />

      <StatsTable
        id="stats-section"
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
#app {
  padding-top: 86px;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 150;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

nav {
  display: flex;
  justify-content: flex-end;
}

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

.settings-wrap {
  position: relative;
}

.interactive-logo {
  cursor: pointer;
  transition: transform 0.18s ease;
}

.interactive-logo:hover {
  transform: scale(1.12);
}

.mobile-header-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.header-center-links {
  justify-self: center;
}

.settings-toggle {
  cursor: pointer;
}

.settings-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 240px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 30;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: rgba(51, 65, 85, 0.28);
  color: #e2e8f0;
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 0.86rem;
  cursor: pointer;
}

.settings-item:hover {
  background: rgba(71, 85, 105, 0.45);
}

.boost-reward-banner {
  position: fixed;
  top: 78px;
  right: 18px;
  z-index: 115;
}

.boost-reward-banner-card {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(251, 191, 36, 0.38);
  color: #f8fafc;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
}

.boost-reward-banner-card span {
  color: #cbd5e1;
  font-size: 0.84rem;
}

.boost-banner-action {
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  background: #f43f5e;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.boost-reward-picker {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.boost-reward-card {
  width: min(560px, 100%);
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(59, 39, 73, 0.94));
  border: 1px solid rgba(251, 113, 133, 0.35);
  border-radius: 16px;
  padding: 16px;
  color: #f8fafc;
}

.boost-reward-card.compact {
  width: min(460px, 100%);
}

.boost-reward-card h3 {
  margin: 0 0 8px;
}

.boost-reward-card p {
  margin: 0 0 12px;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.boost-reward-list {
  display: grid;
  gap: 8px;
}

.boost-reward-item {
  border: none;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  text-align: left;
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boost-reward-item:hover {
  background: rgba(127, 29, 29, 0.55);
}

.boost-reward-item.selected {
  outline: 2px solid rgba(251, 113, 133, 0.9);
  background: rgba(127, 29, 29, 0.72);
}

.boost-reward-item strong {
  display: flex;
  align-items: center;
  gap: 8px;
}

.boost-reward-item em {
  font-size: 0.76rem;
  font-style: normal;
  color: #fda4af;
  font-weight: 700;
}

.boost-reward-item span {
  font-size: 0.8rem;
  color: #e2e8f0;
}

.boost-chooser-cancel {
  margin-top: 10px;
  width: 100%;
}

.boost-reward-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.boost-action-primary,
.boost-action-secondary {
  border: none;
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 700;
  cursor: pointer;
}

.boost-action-primary {
  background: linear-gradient(135deg, #e11d48, #fb7185);
  color: white;
}

.boost-action-secondary {
  background: rgba(51, 65, 85, 0.72);
  color: #e2e8f0;
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

@media (max-width: 768px) {
  #app {
    padding-top: 96px;
  }

  header {
    grid-template-columns: auto 1fr auto;
    gap: 8px;
  }

  .mobile-header-links {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 0;
  }

  .mobile-header-links button {
    border: none;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-menu {
    right: 0;
    min-width: 210px;
  }
}
</style>