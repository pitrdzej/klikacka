<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import '@/assets/reset.css'
import '@/assets/style.css'

const money = ref<number>(0) // Start with nothing - pure grind!
const investors = ref<number>(0)
const equipment = ref<number>(1)
const ticketPrice = ref<number>(1)
const audience = ref<number>(0)
const capacity = ref<number>(10)
const adLevel = ref<number>(0)

const clickPower = computed<number>(() => {
  if (equipment.value === 1) return 1 // Base click power
  if (equipment.value === 2) return 2 // First upgrade: +2 total
  if (equipment.value === 3) return 3 // Second upgrade: +3 total
  // From third upgrade onwards: 3.1 base, then multiply
  return Math.floor(31 + (equipment.value - 4) * 3.1) / 10 // 3.1, 6.2, 9.3, etc.
})
const investorIncome = computed<number>(() => Math.floor(investors.value * (1 + investors.value * 2.5))) // Scales from 0 to ~10,000$ per investor
const audienceIncome = computed<number>(() => Math.floor(audience.value * (1 + (ticketPrice.value - 1) * 6))) // Scales from 1$ to ~42,000$ per person

const floatingTexts = ref<Array<{ id: number; x: number; y: number; amount: number }>>([])
let textId = 0

// Audience management
const audienceMembers = ref<Array<{ id: number; joinTime: number; leaveTime: number }>>([])
let audienceInterval: number | null = null
let investorInterval: number | null = null
let audienceIncomeInterval: number | null = null

// Save/Load functionality
const saveGame = () => {
  const gameState = {
    money: money.value,
    investors: investors.value,
    equipment: equipment.value,
    ticketPrice: ticketPrice.value,
    audience: audience.value,
    capacity: capacity.value,
    adLevel: adLevel.value,
    audienceMembers: audienceMembers.value
  }
  localStorage.setItem('klikacka-save', JSON.stringify(gameState))
}

const loadGame = () => {
  const saved = localStorage.getItem('klikacka-save')
  if (saved) {
    try {
      const gameState = JSON.parse(saved)
      money.value = gameState.money || 0
      investors.value = gameState.investors || 0
      equipment.value = gameState.equipment || 1
      ticketPrice.value = gameState.ticketPrice || 1
      audience.value = gameState.audience || 0
      capacity.value = gameState.capacity || 10
      adLevel.value = gameState.adLevel || 0
      audienceMembers.value = gameState.audienceMembers || []
    } catch (e) {
      console.warn('Failed to load save game:', e)
    }
  }
}

function sing(event: MouseEvent): void {
  money.value += clickPower.value
  saveGame() // Save after each click
  
  const rect = (event.target as HTMLElement).closest('.click-area')?.getBoundingClientRect()
  if (rect) {
    const id = textId++
    const x = event.clientX
    const y = event.clientY
    floatingTexts.value.push({ id, x, y, amount: clickPower.value })
    
    setTimeout(() => {
      floatingTexts.value = floatingTexts.value.filter(t => t.id !== id)
    }, 1000)
  }
}

function buyInvestor(): void {
  const cost = Math.floor(300 + (investors.value * 150)) // Start at $300, increase by $150 each time
  if (money.value >= cost) {
    money.value -= cost
    investors.value++
    saveGame()
  }
}

function buyAd(): void {
  const cost = Math.floor(100 * Math.pow(10, adLevel.value)) // Exponential pricing: $100, $1000, $10000, etc.
  if (money.value >= cost && audience.value < capacity.value) { // Can't buy if hall is full
    money.value -= cost
    adLevel.value++
    saveGame()

    // Calculate delay based on ad level (starts at 20 seconds, decreases with upgrades)
    const baseDelay = 20000 // 20 seconds
    const delayReduction = Math.min(adLevel.value * 2000, 18000) // Reduce by 2 seconds per level, max 18 seconds reduction
    const personDelay = Math.max(baseDelay - delayReduction, 2000) // Minimum 2 seconds

    // Add people gradually with calculated delay
    const peopleToAdd = 5 + Math.floor(adLevel.value / 2) // More people with higher ad levels
    for (let i = 0; i < peopleToAdd; i++) {
      setTimeout(() => {
        if (audience.value < capacity.value) {
          addAudienceMember()
          saveGame() // Save when audience changes
        }
      }, i * personDelay) // People arrive with the calculated delay
    }
  }
}

function buyEquipment(): void {
  const cost = Math.floor(200 + (equipment.value * 100)) // Start at $200, increase by $100 each time
  if (money.value >= cost) {
    money.value -= cost
    equipment.value++
    saveGame()
  }
}

function buyHall(): void {
  const requiredInvestors = 5 + Math.floor(capacity.value / 20) // More investors needed for larger halls
  if (investors.value >= requiredInvestors) {
    investors.value -= requiredInvestors
    capacity.value += 10
    saveGame()
  }
}

function buyTickets(): void {
  const cost = Math.floor(500 + ((ticketPrice.value - 1) * 250)) // Start at $500, increase by $250 each time
  if (money.value >= cost) {
    money.value -= cost
    ticketPrice.value += 2
    saveGame()
  }
}

function addAudienceMember(): void {
  if (audience.value < capacity.value) {
    const now = Date.now()
    const member = {
      id: Date.now() + Math.random(),
      joinTime: now,
      leaveTime: now + 120000 // 2 minutes
    }
    audienceMembers.value.push(member)
    audience.value++
  }
}

function removeExpiredAudience(): void {
  const now = Date.now()
  audienceMembers.value = audienceMembers.value.filter(member => {
    if (now >= member.leaveTime) {
      audience.value--
      return false
    }
    return true
  })
}

// Computed for display
const displayAudience = computed(() => {
  const total = audience.value
  const maxVisible = 50
  if (total <= maxVisible) {
    return Array.from({ length: Math.max(capacity.value, total) }, (_, i) => i < total)
  } else {
    // Show last 50 as active
    return Array.from({ length: maxVisible }, () => true)
  }
})

const audienceOverflow = computed(() => {
  return audience.value > 50 ? audience.value - 50 : 0
})

onMounted(() => {
  loadGame() // Load saved game on startup
  
  // Investor income every 2 seconds
  investorInterval = setInterval(() => {
    money.value += investorIncome.value
    saveGame() // Save after income
  }, 2000)

  // Audience income every 30 seconds
  audienceIncomeInterval = setInterval(() => {
    money.value += audienceIncome.value
    saveGame() // Save after income
  }, 30000)

  // Check for expired audience every second
  audienceInterval = setInterval(() => {
    removeExpiredAudience()
    saveGame() // Save after audience changes
  }, 1000)
})

onUnmounted(() => {
  if (investorInterval) clearInterval(investorInterval)
  if (audienceIncomeInterval) clearInterval(audienceIncomeInterval)
  if (audienceInterval) clearInterval(audienceInterval)
})
</script>

<template>
  <div id="app">
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
      
      <aside class="sidebar">
        <h2>Vylepšení</h2>

        <section class="upgrade" @click="buyInvestor">
          <h3><i class="fa-solid fa-handshake"></i> Investor</h3>
          <p class="desc">+{{ Math.floor(1 + investors * 2.5).toLocaleString() }}$ / 2s (max 2000)</p>
          <p class="price" :class="{ 'disabled': money < (300 + (investors * 150)) }">${{ (300 + (investors * 150)).toLocaleString() }}</p>
        </section>

        <section class="upgrade" @click="buyAd">
          <h3><i class="fa-solid fa-bullhorn"></i> Reklama</h3>
          <p class="desc">{{ 5 + Math.floor(adLevel / 2) }} lidí za {{ Math.max(20000 - Math.min(adLevel * 2000, 18000), 2000) / 1000 }}s (max 100)</p>
          <p class="price" :class="{ 'disabled': money < (400 + (adLevel * 200)) || audience >= capacity }">${{ (400 + (adLevel * 200)).toLocaleString() }}</p>
        </section>

        <section class="upgrade" @click="buyEquipment">
          <h3><i class="fa-solid fa-music"></i> Vybavení</h3>
          <p class="desc">+{{ clickPower.toFixed(1) }}$ / klik (max 4000)</p>
          <p class="price" :class="{ 'disabled': money < (200 + (equipment * 100)) }">${{ (200 + (equipment * 100)).toLocaleString() }}</p>
        </section>

        <section class="upgrade" @click="buyHall">
          <h3><i class="fa-solid fa-building"></i> Sál</h3>
          <p class="desc">+10 kapacity ({{ 5 + Math.floor(capacity / 20) }} investorů)</p>
          <p class="price" :class="{ 'disabled': investors < (5 + Math.floor(capacity / 20)) }">Vyžaduje {{ 5 + Math.floor(capacity / 20) }} investorů</p>
        </section>

        <section class="upgrade" @click="buyTickets">
          <h3><i class="fa-solid fa-ticket"></i> Dražší lístky</h3>
          <p class="desc">+{{ Math.floor(1 + (ticketPrice - 1) * 6) }}$ / lístek (max 7000)</p>
          <p class="price" :class="{ 'disabled': money < (500 + ((ticketPrice - 1) * 250)) }">${{ (500 + ((ticketPrice - 1) * 250)).toLocaleString() }}</p>
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
              v-for="(active, index) in displayAudience"
              :key="index"
              class="audience-member"
              :class="{ active }"
            ></div>
          </div>

          <p class="audience-stats">
            {{ audienceOverflow > 0 ? audienceOverflow + ' + ' : '' }}{{ Math.min(audience, 50) }} / {{ capacity }}
          </p>
        </section>
      </article>

      <aside class="stats">
        <h2>Přehled</h2>
        <table>
          <tbody>
            <tr>
              <td>Investoři</td>
              <td>{{ investors }}</td>
            </tr>
            <tr>
              <td>Úroveň reklamy</td>
              <td>{{ adLevel }}</td>
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
            <tr>
              <td>Příjem od investorů</td>
              <td>{{ investorIncome.toLocaleString() }}$ / 2s</td>
            </tr>
            <tr>
              <td>Příjem od publika</td>
              <td>{{ audienceIncome.toLocaleString() }}$ / 30s</td>
            </tr>
          </tbody>
        </table>
      </aside>

    </main>
  </div>
</template>