<script setup lang="ts">
import '@/assets/reset.css'
import '@/assets/style.css'
import GameShop from '@/components/GameShop.vue'
import ClickStage from '@/components/ClickStage.vue'
import StatsTable from '@/components/StatsTable.vue'
import OfflineToast from '@/components/OfflineToast.vue'
import { useGameState } from '@/composables/useGameState'

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
  hallInvestorRequirement,
  clickPower,
  investorIncome,
  investorIncomeIntervalSeconds,
  audienceIncome,
  audienceIncomeIntervalSeconds,
  floatingTexts,
  offlineEarnings,
  offlineSeconds,
  displayAudience,
  audienceOverflow,
  saveGame,
  sing,
  buyInvestor,
  buyAd,
  buyEquipment,
  buyHall,
  buyTickets
} = useGameState()
</script>

<template>
  <div id="app">
    <OfflineToast :earnings="offlineEarnings" :offline-seconds="offlineSeconds" />
    <header>
      <a class="logo">
        <i class="fa-solid fa-microphone"></i>
      </a>
      <nav>
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
        :hall-investor-requirement="hallInvestorRequirement"
        :click-power="clickPower"
        @buy-investor="buyInvestor"
        @buy-ad="buyAd"
        @buy-equipment="buyEquipment"
        @buy-hall="buyHall"
        @buy-tickets="buyTickets"
      />

      <ClickStage
        :money="money"
        :floating-texts="floatingTexts"
        :audience="audience"
        :capacity="capacity"
        :display-audience="displayAudience"
        :audience-overflow="audienceOverflow"
        @sing="sing"
      />

      <StatsTable
        :investors="investors"
        :ad-level="adLevel"
        :audience="audience"
        :capacity="capacity"
        :equipment="equipment"
        :ticket-price="ticketPrice"
        :investor-income="investorIncome"
        :investor-income-interval-seconds="investorIncomeIntervalSeconds"
        :audience-income="audienceIncome"
        :audience-income-interval-seconds="audienceIncomeIntervalSeconds"
      />

    </main>
  </div>
</template>