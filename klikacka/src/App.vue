<script setup lang="ts">
import { ref, computed } from 'vue'
import '@/assets/reset.css'
import '@/assets/style.css'

const money = ref<number>(100)

const investors = ref<number>(1)
const equipment = ref<number>(1)
const ticketPrice = ref<number>(5)

const audience = ref<number>(2)
const capacity = ref<number>(10)

const clickPower = computed<number>(() => equipment.value)
const floatingTexts = ref<Array<{ id: number; x: number; y: number; amount: number }>>([])
let textId = 0

function sing(event: MouseEvent): void {
  money.value += clickPower.value
  
  const rect = (event.target as HTMLElement).closest('.click-area')?.getBoundingClientRect()
  if (rect) {
    const id = textId++
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    floatingTexts.value.push({ id, x, y, amount: clickPower.value })
    
    setTimeout(() => {
      floatingTexts.value = floatingTexts.value.filter(t => t.id !== id)
    }, 1000)
  }
}

setInterval((): void => {
  money.value += investors.value * 2
}, 1000)


setInterval((): void => {
  if (audience.value < capacity.value) {
    audience.value++
  }

  money.value += audience.value * ticketPrice.value
}, 10000)

function buyInvestor(): void {
  if (money.value >= 10) {
    money.value -= 10
    investors.value++
  }
}

function buyAd(): void {
  if (money.value >= 50) {
    money.value -= 50
  }
}

function buyEquipment(): void {
  if (money.value >= 5) {
    money.value -= 5
    equipment.value++
  }
}

function buyHall(): void {
  if (money.value >= 20) {
    money.value -= 20
    capacity.value += 10
  }
}

function buyTickets(): void {
  if (money.value >= 15) {
    money.value -= 15
    ticketPrice.value += 2
  }
}

const audienceArray = computed<boolean[]>(() =>
  Array.from({ length: capacity.value }, (_, i) => i < audience.value)
)
</script>

<template>
  <div id="app">
    <header>
      <a class="logo">
        <i class="fa-solid fa-microphone"></i>
      </a>
      <nav>
        <a><i class="fa-solid fa-lightbulb"></i></a>
        <a><i class="fa-solid fa-gear"></i></a>
      </nav>
    </header>

    <main class="layout">
      
      <aside class="sidebar">
        <h2>Vylepšení</h2>

        <section class="upgrade" @click="buyInvestor">
          <h3><i class="fa-solid fa-handshake"></i> Investor</h3>
          <p class="desc">+2$ / sekundu</p>
          <p class="price">$10</p>
        </section>

        <section class="upgrade" @click="buyAd">
          <h3><i class="fa-solid fa-bullhorn"></i> Reklama</h3>
          <p class="desc">+1 člověk / 10s</p>
          <p class="price">$50</p>
        </section>

        <section class="upgrade" @click="buyEquipment">
          <h3><i class="fa-solid fa-music"></i> Vybavení</h3>
          <p class="desc">+1$ / klik</p>
          <p class="price">$5</p>
        </section>

        <section class="upgrade" @click="buyHall">
          <h3><i class="fa-solid fa-building"></i> Sál</h3>
          <p class="desc">+ Kapacita 10</p>
          <p class="price">$20</p>
        </section>

        <section class="upgrade" @click="buyTickets">
          <h3><i class="fa-solid fa-ticket"></i> Dražší lístky</h3>
          <p class="desc">+2$ / lístek</p>
          <p class="price">$15</p>
        </section>
      </aside>

      <!-- STAGE -->
      <article class="stage-section">
        <section class="money-display">
          <i class="fa-solid fa-dollar-sign"></i>
          <span class="money-value">{{ money }}</span>
        </section>

        <section class="stage">
          <div class="spotlight"></div>
          <div class="click-area" @click="sing" data-action>
            <i class="fa-solid fa-user"></i>
          </div>
          <div 
            v-for="text in floatingTexts" 
            :key="text.id"
            class="floating-text"
            :style="{ left: text.x + 'px', top: text.y + 'px' }"
          >
            +{{ text.amount }}$
          </div>
        </section>

        <section class="publikum">
          <h3><i class="fa-solid fa-users"></i> Publikum</h3>

          <div class="audience-container">
            <div
              v-for="(active, index) in audienceArray"
              :key="index"
              class="audience-member"
              :class="{ active }"
            ></div>
          </div>

          <p class="audience-stats">
            {{ audience }} / {{ capacity }}
          </p>
        </section>
      </article>

      <aside class="stats">
        <h2>Přehled</h2>
        <table>
          <tr>
            <td>Investoři</td>
            <td>{{ investors }}</td>
          </tr>
          <tr>
            <td>Publikum</td>
            <td>{{ audience }} / {{ capacity }}</td>
          </tr>
          <tr>
            <td>Úroveň vybavení</td>
            <td>{{ equipment }}</td>
          </tr>
          <tr>
            <td>Cena lístku</td>
            <td>{{ ticketPrice }}$</td>
          </tr>
        </table>
      </aside>

    </main>
  </div>
</template>