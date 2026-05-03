import { computed, onMounted, onUnmounted, ref } from 'vue'
import { roundDownToHalf } from '@/utils/number'

type FloatingText = { id: number; x: number; y: number; amount: number }
type AudienceMember = { id: number; joinTime: number; leaveTime: number }
type GameState = {
  money?: number
  investors?: number
  equipment?: number
  ticketPrice?: number
  audience?: number
  capacity?: number
  adLevel?: number
  audienceMembers?: AudienceMember[]
  lastSeenAt?: number
}

const OFFLINE_MULTIPLIER = 0.02
const MAX_OFFLINE_SECONDS = 60 * 60 * 12

export function useGameState() {
  const money = ref<number>(0)
  const investors = ref<number>(0)
  const equipment = ref<number>(1)
  const ticketPrice = ref<number>(1)
  const audience = ref<number>(0)
  const capacity = ref<number>(10)
  const adLevel = ref<number>(0)

  const clickPower = computed<number>(() => {
    if (equipment.value === 1) return 1
    if (equipment.value === 2) return 2
    if (equipment.value === 3) return 3

    const raw = Math.floor(31 + (equipment.value - 4) * 3.1) / 10
    return roundDownToHalf(raw)
  })

  function scaledCost(base: number, growth: number, level: number): number {
    const safeLevel = Math.max(0, level)
    return roundDownToHalf(base * Math.pow(growth, safeLevel))
  }

  const investorCost = computed<number>(() => scaledCost(300, 1.18, investors.value))
  const adCost = computed<number>(() => scaledCost(300, 1.26, adLevel.value))
  const equipmentCost = computed<number>(() => scaledCost(220, 1.3, equipment.value - 1))
  const ticketLevel = computed<number>(() => Math.max(0, Math.floor((ticketPrice.value - 1) / 2)))
  const ticketsCost = computed<number>(() => scaledCost(500, 1.24, ticketLevel.value))
  const hallInvestorRequirement = computed<number>(() => 4 + Math.floor(capacity.value / 15))

  const investorIncome = computed<number>(() => {
    const raw = investors.value * (1 + investors.value * 2.5)
    return roundDownToHalf(raw)
  })

  const investorIncomeIntervalSeconds = computed<number>(() => 2)
  const audienceIncomeIntervalSeconds = computed<number>(() => 30)

  const audienceIncome = computed<number>(() => {
    const raw = audience.value * (1 + (ticketPrice.value - 1) * 6)
    return roundDownToHalf(raw)
  })

  const floatingTexts = ref<FloatingText[]>([])
  const audienceMembers = ref<AudienceMember[]>([])
  const offlineEarnings = ref<number>(0)
  const offlineSeconds = ref<number>(0)

  let textId = 0
  let audienceInterval: ReturnType<typeof setInterval> | null = null
  let investorInterval: ReturnType<typeof setInterval> | null = null
  let audienceIncomeInterval: ReturnType<typeof setInterval> | null = null

  const handleBeforeUnload = () => {
    saveGame()
  }

  const saveGame = () => {
    const gameState = {
      money: roundDownToHalf(money.value),
      investors: investors.value,
      equipment: equipment.value,
      ticketPrice: ticketPrice.value,
      audience: audience.value,
      capacity: capacity.value,
      adLevel: adLevel.value,
      audienceMembers: audienceMembers.value,
      lastSeenAt: Date.now()
    }

    localStorage.setItem('klikacka-save', JSON.stringify(gameState))
  }

  const loadGame = (): number | null => {
    const saved = localStorage.getItem('klikacka-save')

    if (!saved) return null

    try {
      const gameState = JSON.parse(saved) as GameState
      money.value = roundDownToHalf(Number(gameState.money) || 0)
      investors.value = Number(gameState.investors) || 0
      equipment.value = Number(gameState.equipment) || 1
      ticketPrice.value = Number(gameState.ticketPrice) || 1
      audience.value = Number(gameState.audience) || 0
      capacity.value = Number(gameState.capacity) || 10
      adLevel.value = Number(gameState.adLevel) || 0
      audienceMembers.value = Array.isArray(gameState.audienceMembers) ? gameState.audienceMembers : []

      return Number(gameState.lastSeenAt) || null
    } catch (e) {
      console.warn('Hru se bohužel nepodařilo uložit: ', e)
      return null
    }
  }

  function applyOfflineEarnings(lastSeenAt: number | null): void {
    if (!lastSeenAt) return

    const diffMs = Date.now() - lastSeenAt
    if (diffMs <= 0) return

    const clampedSeconds = Math.min(diffMs / 1000, MAX_OFFLINE_SECONDS)
    offlineSeconds.value = clampedSeconds
    const passivePerSecond =
      investorIncome.value / investorIncomeIntervalSeconds.value +
      audienceIncome.value / audienceIncomeIntervalSeconds.value
    const reward = roundDownToHalf(passivePerSecond * clampedSeconds * OFFLINE_MULTIPLIER)

    if (reward < 0.5) return

    offlineEarnings.value = reward
    addMoney(reward)
    saveGame()
  }

  function addMoney(amount: number): void {
    money.value = roundDownToHalf(money.value + amount)
  }

  function spendMoney(amount: number): boolean {
    if (money.value < amount) return false

    money.value = roundDownToHalf(money.value - amount)
    return true
  }

  function sing(event: MouseEvent): void {
    addMoney(clickPower.value)
    saveGame()

    const clickArea = (event.target as HTMLElement).closest('.click-area')
    if (!clickArea) return

    const id = textId++
    floatingTexts.value.push({
      id,
      x: event.clientX,
      y: event.clientY,
      amount: clickPower.value
    })

    setTimeout(() => {
      floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id)
    }, 1000)
  }

  function buyInvestor(): void {
    if (!spendMoney(investorCost.value)) return

    investors.value++
    saveGame()
  }

  function addAudienceMember(): void {
    if (audience.value >= capacity.value) return

    const now = Date.now()
    audienceMembers.value.push({
      id: Date.now() + Math.random(),
      joinTime: now,
      leaveTime: now + 120000
    })
    audience.value++
  }

  function buyAd(): void {
    if (audience.value >= capacity.value || !spendMoney(adCost.value)) return

    adLevel.value++
    saveGame()

    const baseDelay = 20000
    const delayReduction = Math.min(adLevel.value * 2000, 18000)
    const personDelay = Math.max(baseDelay - delayReduction, 2000)
    const peopleToAdd = 5 + Math.floor(adLevel.value / 2)

    for (let i = 0; i < peopleToAdd; i++) {
      setTimeout(() => {
        if (audience.value < capacity.value) {
          addAudienceMember()
          saveGame()
        }
      }, i * personDelay)
    }
  }

  function buyEquipment(): void {
    if (!spendMoney(equipmentCost.value)) return

    equipment.value++
    saveGame()
  }

  function buyHall(): void {
    if (investors.value < hallInvestorRequirement.value) return

    investors.value -= hallInvestorRequirement.value
    capacity.value += 10
    saveGame()
  }

  function buyTickets(): void {
    if (!spendMoney(ticketsCost.value)) return

    ticketPrice.value += 2
    saveGame()
  }

  function removeExpiredAudience(): void {
    const now = Date.now()

    audienceMembers.value = audienceMembers.value.filter((member) => {
      if (now < member.leaveTime) return true

      audience.value--
      return false
    })
  }

  const displayAudience = computed<boolean[]>(() => {
    const total = audience.value
    const maxVisible = 50

    if (total <= maxVisible) {
      const slots = Math.max(capacity.value, total)
      const result: boolean[] = []

      for (let i = 0; i < slots; i++) {
        result.push(i < total)
      }

      return result
    }

    const result: boolean[] = []

    for (let i = 0; i < maxVisible; i++) {
      result.push(true)
    }

    return result
  })

  const audienceOverflow = computed<number>(() => {
    return audience.value > 50 ? audience.value - 50 : 0
  })

  onMounted(() => {
    const lastSeenAt = loadGame()
    applyOfflineEarnings(lastSeenAt)

    window.addEventListener('beforeunload', handleBeforeUnload)

    investorInterval = setInterval(() => {
      if (investorIncome.value > 0) {
        addMoney(investorIncome.value)
        saveGame()
      }
    }, investorIncomeIntervalSeconds.value * 1000)

    audienceIncomeInterval = setInterval(() => {
      if (audienceIncome.value > 0) {
        addMoney(audienceIncome.value)
        saveGame()
      }
    }, audienceIncomeIntervalSeconds.value * 1000)

    audienceInterval = setInterval(() => {
      removeExpiredAudience()
      saveGame()
    }, 1000)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)

    if (investorInterval) clearInterval(investorInterval)
    if (audienceIncomeInterval) clearInterval(audienceIncomeInterval)
    if (audienceInterval) clearInterval(audienceInterval)

    saveGame()
  })

  return {
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
  }
}
