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
import { playNote, setNotesMuted, setNotesVolume } from '@/utils/notes'

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
  buyPrestige,
  exportSaveFile,
  importSaveString,
  bossWins,
  prestigeLevel,
  prestigeBought,
  prestigeMultiplier,
  prestigeCost,
  selectSong
} = useGameState()

const isMusicMuted = ref<boolean>(localStorage.getItem('musicMuted') === '1')
const musicVolume = ref<number>(Number(localStorage.getItem('musicVolume') || '80'))
setNotesMuted(isMusicMuted.value)
setNotesVolume(musicVolume.value / 100)

const saveFlash = ref<boolean>(false)
const importStatus = ref<string>('')
const importFileInput = ref<HTMLInputElement | null>(null)
function handleSave(): void {
  saveGame()
  saveFlash.value = true
  setTimeout(() => { saveFlash.value = false }, 1500)
}

function handleExportSave(): void {
  exportSaveFile()
  importStatus.value = 'Soubor uložen.'
}

function triggerImportSave(): void {
  importStatus.value = ''
  importFileInput.value?.click()
}

function handleImportFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const contents = typeof reader.result === 'string' ? reader.result : ''
    const result = importSaveString(contents)
    importStatus.value = result ? 'Uložení načteno.' : 'Neplatný nebo poškozený save soubor.'
    if (result) {
      saveFlash.value = true
      setTimeout(() => { saveFlash.value = false }, 1500)
    }
    target.value = ''
  }
  reader.onerror = () => {
    importStatus.value = 'Nepodařilo se načíst soubor.'
    target.value = ''
  }
  reader.readAsText(file)
}

function handleVolumeChange(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  musicVolume.value = Math.max(0, Math.min(100, value))
  localStorage.setItem('musicVolume', musicVolume.value.toString())

  if (musicVolume.value <= 0) {
    isMusicMuted.value = true
    setNotesMuted(true)
  } else {
    if (isMusicMuted.value) {
      isMusicMuted.value = false
      setNotesMuted(false)
    }
    setNotesVolume(musicVolume.value / 100)
  }
}

const showKeyboardHelp = ref<boolean>(false)
function toggleKeyboardHelp(): void {
  showKeyboardHelp.value = !showKeyboardHelp.value
}

const showSettingsMenu = ref<boolean>(false)
function toggleSettingsMenu(): void {
  showSettingsMenu.value = !showSettingsMenu.value
}

const showHelpModal = ref<boolean>(false)
function openHelpModal(): void {
  showHelpModal.value = true
  showSettingsMenu.value = false
}

function closeHelpModal(): void {
  showHelpModal.value = false
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
  if (!isMusicMuted.value) {
    setNotesVolume(musicVolume.value / 100)
  }
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
          <span v-if="prestigeLevel >= 1" class="prestige-badge">{{ prestigeLevel === 1 ? 'Premium' : 'Ultra' }}</span>
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
            <button class="settings-item" @click="openHelpModal">
              <i class="fa-solid fa-circle-question"></i>
              <span>Nápověda</span>
            </button>
            <button class="settings-item" @click="toggleMusicMute">
              <i :class="isMusicMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
              <span>{{ isMusicMuted ? 'Zapnout hudbu' : 'Vypnout hudbu' }}</span>
            </button>
            <div class="settings-item volume-item">
              <i class="fa-solid fa-sliders"></i>
              <div class="volume-control">
                <label for="music-volume">Hlasitost hudby</label>
                <input
                  id="music-volume"
                  class="volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  :value="musicVolume"
                  @input="handleVolumeChange"
                />
                <span>{{ musicVolume }}%</span>
              </div>
            </div>
            <button class="settings-item" @click="toggleKeyboardHelp">
              <i class="fa-solid fa-keyboard"></i>
              <span>{{ showKeyboardHelp ? 'Skrýt nápovědu kláves' : 'Zobrazit nápovědu kláves' }}</span>
            </button>
            <button class="settings-item" :class="{ 'save-flash': saveFlash }" @click="handleSave">
              <i class="fa-solid fa-save"></i>
              <span>{{ saveFlash ? 'Uloženo!' : 'Uložit hru' }}</span>
            </button>
            <button class="settings-item" @click="handleExportSave">
              <i class="fa-solid fa-download"></i>
              <span>Exportovat save</span>
            </button>
            <button class="settings-item" @click="triggerImportSave">
              <i class="fa-solid fa-upload"></i>
              <span>Importovat save</span>
            </button>
            <input ref="importFileInput" type="file" accept=".txt,.save,.dat" style="display:none" @change="handleImportFileChange" />
            <div class="import-status" v-if="importStatus">{{ importStatus }}</div>
          </div>
        </div>
      </nav>
    </header>

    <section v-if="showHelpModal" class="help-modal" aria-live="polite" @click.self="closeHelpModal">
      <div class="help-modal-card">
        <div class="help-modal-head">
          <h3><i class="fa-solid fa-book"></i> Nápověda</h3>
          <button class="help-close" @click="closeHelpModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="help-modal-content">
          <h4>Uvedení do děje</h4>
          <p>
            Jsem zpěvák. Malý, pouliční zpěvák, který se snaží vylepšovat své vybavení, zisk a svůj
            hudební talent. To se v této hře bude dělat klikáním. Hlavní obraz je moje pódium.
            Jakmile na něj kliknu, zpěvák dostává peníze, které jsou nahoře v pódiu. Od peněz se
            odvíjí prakticky celý průběh hry. Na výběr je získání různých vylepšení, které přidávají
            peníze mnohem rychleji.
          </p>

          <h4>Vylepšení</h4>

          <p><strong>1. Investor</strong></p>
          <p>
            Získali jste investora – to znamená, že vám chodí pravidelně množství peněz na to,
            abyste mohli vystupovat. Pokud nemáte dostatek investorů, nemůžete získat větší pódium.
            Čím více vám věří, tím větší peníze vám dává. Investoři přispívají každé 2 sekundy.
            Dočasný boost Vám zlepší reputaci &rarr; investoři přispívají každou sekundu.
          </p>

          <p><strong>2. Reklama</strong></p>
          <p>
            Jakmile vyvěsíte reklamu, přijde se na vás podívat jeden člověk za 20 sekund. Nejvýše
            však 5 za každé vylepšení. Každý takový člověk vám dává pravidelně (jednou za 30s)
            peníze. Pozor – publikum má omezenou kapacitu. Můžete oslovit jenom tolik lidí, na kolik
            stačí kapacita koncertního sálu. Publikum odchází ze sálu zpravidla po dvou minutách.
            Postupem vylepšování se vám pomalu zkracuje doba chození do sálu a přibývají přicházející
            lidé do sálu. Rovněž se prodlužuje doba, kterou tam jeden divák zůstane, a tím pádem
            i peníze, které začne dávat častěji a častěji. Diváci mohou být Váš největší zdroj příjmů,
            tak je nezanedbejte. Při boostu diváci zůstávají dvakrát déle a rovněž je cena lístků
            dvakrát dražší.
          </p>
          <p><em>Např. Koupíte si reklamu – v publiku se vám objeví postupně 5 dalších lidí. Ti každých 30s přispějí cenou lístku.</em></p>

          <p><strong>3. Vybavení</strong></p>
          <p>
            Pro dobré koncertování si musíte postupně kupovat vybavení. Čím lepší vybavení máte,
            tím více vám lidé dávají jako jednorázový příspěvek – klikáním získáváte více peněz.
            Při boostu je dav uchvácen &rarr; jeden klik Vám přinese dvakrát více peněz.
          </p>

          <p><strong>4. Sál</strong></p>
          <p>
            Čím víc bude lidí, tím větší bude potřeba sál. Jako takový nic nedělá, pouze zvýší
            kapacitu publika. Na zvětšení sálu je potřeba vždy určitý počet investorů, kteří
            následně odchází.
          </p>
          <p><em>Např. Máte 6 investorů a omezenou kapacitu sálu na 10 lidí – jakmile se rozhodnete kapacitu sálu zvětšit na 20 lidí, budete mít pouze jednoho investora. Čím větší sál kupujete, tím více investorů k tomu bude potřeba.</em></p>

          <p><strong>5. Dražší lístky</strong></p>
          <p>Zvýší peníze, které dostáváte od publika.</p>

          <h4>Písničky a piano</h4>
          <p>
            Jakožto zpěvák také hrajete. Vaším nástrojem je piano, na které můžete buď hrát přímo
            podle Vaší fantazie, nebo podle předehraných písniček. Písně zatím nemění zisk, můžete
            však mezi nimi měnit a hrát je tak, jak budete chtít.
          </p>

          <h4>Bossové</h4>
          <p>
            Do cesty se Vám mohou dostat bossové – okolní zpěváci, kteří zrovna budou vystupovat
            poblíž Vašeho místa. Ty musíte přesvědčit, že vy jste tu králem – klikáte rychleji než
            oni, aby Vám ustoupili. Jako odměnu dostáváte boost dle Vašeho výběru. Boost publika
            můžete získat pouze pokud porazíte největší legendy, a sice Jana Kafku nebo Hanu Zagorovou.
            Pokud nad bossem nevyhrajete, polovina až dvě třetiny investorů se naštve a odejde.
            Rovněž ztratíte určitou část zisku.
          </p>

          <h4>Cíl hry</h4>
          <p>
            Být co nejlepší a nejúspěšnější zpěvák, získat co nejvíce peněz, investorů a publika.
            Vyprodej O2 arénu, snaž se získávat pasivní příjem a odemkni co nejvíce písniček.
          </p>
        </div>
      </div>
    </section>

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
        :boss-wins="bossWins"
        :has-all-songs="!hasNextSong"
        :prestige-bought="prestigeBought"
        :prestige-level="prestigeLevel"
        :prestige-multiplier="prestigeMultiplier"
        :prestige-cost="prestigeCost"
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
        @buy-prestige="buyPrestige"
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
        :prestige-level="prestigeLevel"
        :prestige-multiplier="prestigeMultiplier"
        @sing="sing"
        @select-song="selectSong"
        @activate-boost="activateOwnedBoost"
        @buy-song="buySong"
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
        :prestige-multiplier="prestigeMultiplier"
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

.prestige-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0.08rem 0.36rem;
  background: linear-gradient(135deg,#ffd27a,#ff9bb0);
  color: #2b0b00;
  font-weight: 800;
  border-radius: 999px;
  font-size: 0.66rem;
  line-height: 1;
  transform: translateY(-8px);
  vertical-align: top;
  box-shadow: 0 6px 18px rgba(255,155,144,0.12);
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
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.header-center-links {
  justify-self: center;
}

#shop-section,
#stage-section,
#stats-section {
  scroll-margin-top: 112px;
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

.settings-item.volume-item {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.volume-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.volume-control label {
  font-size: 0.78rem;
  color: #f8fafc;
}

.volume-slider {
  width: 100%;
}

.volume-control span {
  font-size: 0.8rem;
  color: #cbd5e1;
  text-align: right;
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

.help-modal {
  position: fixed;
  inset: 0;
  z-index: 220;
  background: rgba(2, 6, 23, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.help-modal-card {
  width: min(760px, 100%);
  max-height: min(78vh, 900px);
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(28, 25, 43, 0.96), rgba(17, 24, 39, 0.94));
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.45);
  border: none;
}

.help-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.help-modal-head h3 {
  margin: 0;
}

.help-close {
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 999px;
  width: 34px;
  height: 34px;
  cursor: pointer;
}

.help-modal-content {
  overflow: auto;
  max-height: calc(78vh - 72px);
  padding: 0 16px 16px;
  color: #e2e8f0;
  line-height: 1.45;
}

.help-modal-content h4 {
  margin: 12px 0 6px;
  color: #fda4af;
}

.help-modal-content ul {
  margin: 6px 0 10px 18px;
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