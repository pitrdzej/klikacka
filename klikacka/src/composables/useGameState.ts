import { computed, onMounted, onUnmounted, ref } from 'vue'
import { roundDownToHalf } from '@/utils/number'
import { playNote, keyToNote } from '@/utils/notes'

type FloatingText = { id: number; x: number; y: number; amount: number }
type AudienceMember = { id: number; joinTime: number; leaveTime: number; hue: number }
type GameState = {
    money?: number
    investors?: number
    equipment?: number
    ticketPrice?: number
    audience?: number
    capacity?: number
    adLevel?: number
    songLevel?: number
    selectedSongIndex?: number
    bossWins?: number
    pendingBoss?: BossProfile
    pendingBossRemainingMs?: number
    audienceMembers?: AudienceMember[]
    lastSeenAt?: number
}

type Song = {
    name: string
    melody: string[]
}

type BossProfile = {
    name: string
    fame: number
    image: string
}

type BossResultTone = 'success' | 'error'

const OFFLINE_MULTIPLIER = 0.02
const MAX_OFFLINE_SECONDS = 60 * 60 * 12
const MIN_OFFLINE_REWARD_SECONDS = 60 * 60
const BOSS_MIN_DELAY_MS = 90_000
const BOSS_MAX_DELAY_MS = 180_000
const BOSS_DURATION_SECONDS = 20
const BOSS_WARNING_WINDOW_SECONDS = 60
const BOSS_BAR_VISIBLE_SECONDS = 30
const PLAYER_INACTIVE_MS = 15_000
const BOSS_REENGAGE_CLICKS = 5
const AUDIENCE_BASE_JOIN_DELAY_SECONDS = 18
const AUDIENCE_JOIN_DELAY_STEP_LEVELS = 3
const AUDIENCE_MIN_JOIN_DELAY_SECONDS = 2
const AUDIENCE_BASE_INCOME_INTERVAL_SECONDS = 30
const AUDIENCE_INCOME_STEP_LEVELS = 6
const AUDIENCE_MIN_INCOME_INTERVAL_SECONDS = 5
const AUDIENCE_BASE_STAY_SECONDS = 120
const AUDIENCE_STAY_STEP_LEVELS = 5

const BOSS_ROSTER: BossProfile[] = [
    { name: 'Tomáš Klus', fame: 1.0, image: '/bosses/TomasKlus.jpg' },
    { name: 'Yzomandias', fame: 1.15, image: '/bosses/Yzomandias.jpg' },
    { name: 'Dua Lipa', fame: 1.3, image: '/bosses/DuaLipa.jpg' },
    { name: 'Ed Sheeran', fame: 1.45, image: '/bosses/EdSheeran.jpg' },
    { name: 'Billie Eilish', fame: 1.6, image: '/bosses/Billie.jpg' },
    { name: 'Hana Zagorová', fame: 1.75, image: '/bosses/HanaZagorova.jpg' },
    { name: 'Jan Kafka', fame: 1.9, image: '/bosses/JanKafka.jpg' }
]

const DEFAULT_BOSS: BossProfile = { name: 'Tomáš Klus', fame: 1.0, image: '/bosses/TomasKlus.jpg' }

const SONGS: Song[] = [
    {
        name: 'Ovčáci čtveráci',
        melody: [
            'C4', 'E4', 'G4',
            'C4', 'E4', 'G4',
            'E4', 'E4', 'D4', 'E4', 'F4', 'D4',
            'E4', 'E4', 'D4', 'E4', 'F4', 'D4',
            'E4', 'D4', 'C4'
        ]
    },
    {
        name: 'Skákal pes',
        melody: [
            'G4', 'G4', 'E4',
            'G4', 'G4', 'E4',
            'G4', 'G4', 'A4', 'G4',
            'G4', 'F4',
            'F4', 'F4', 'D4',
            'F4', 'F4', 'D4',
            'F4', 'F4', 'G4', 'F4',
            'F4', 'E4'
        ]
    },
    {
        name: 'Kočka leze dírou',
        melody: [
            'C4', 'D4', 'E4', 'F4',
            'G4', 'G4', 'A4', 'A4',
            'G4', 'A4', 'A4', 'G4', 
            'F4', 'F4', 'F4', 'F4',
            'E4', 'E4', 'D4', 'D4',
            'G4', 'F4', 'F4', 'F4', 'F4',
            'E4', 'E4', 'D4', 'D4',
            'C4'
        ]
    },
    {
        name: 'Prší, prší',
        melody: [
            'G4', 'G4', 'A4', 'G4',
            'G4', 'G4', 'A4', 'G4',
            'G4', 'G4', 'A4', 'G4',
            'F4', 'F4', 'F4', 'F4',
            'E4', 'E4', 'E4',
            'D4', 'D4', 'G4', 'G4',
            'C4', 'C4', 'C4'
        ]
    },
    {
        name: 'Shape of you',
        melody: [
            'D4', 'F4', 'D4', 'D4',
            'F4', 'D4', 'D4', 'F4',
            'D4', 'E4', 'D4', 'C4',


        ]
    }
    
]

const DEFAULT_SONG: Song = {
    name: 'Základní melodie',
    melody: ['C4', 'E4', 'G4']
}

export function useGameState() {
    const money = ref<number>(0)
    const investors = ref<number>(0)
    const equipment = ref<number>(1)
    const ticketPrice = ref<number>(1)
    const audience = ref<number>(0)
    const capacity = ref<number>(10)
    const adLevel = ref<number>(0)
    const songLevel = ref<number>(0)
    const selectedSongIndex = ref<number>(0)

    function calculateClickPower(equipmentLevel: number): number {
        if (equipmentLevel <= 1) return 1
        if (equipmentLevel === 2) return 2.5
        if (equipmentLevel === 3) return 5

        const level = equipmentLevel - 3
        const raw = 5 + level * 4 + Math.pow(level, 1.38) * 2.6
        return roundDownToHalf(Math.min(raw, 12000))
    }

    const clickPower = computed<number>(() => calculateClickPower(equipment.value))

    function scaledCost(base: number, growth: number, level: number): number {
        const safeLevel = Math.max(0, level)
        return roundDownToHalf(base * Math.pow(growth, safeLevel))
    }

    const investorCost = computed<number>(() => scaledCost(340, 1.2, investors.value))
    const adCost = computed<number>(() => scaledCost(150, 1.14, adLevel.value))
    const equipmentCost = computed<number>(() => scaledCost(220, 1.3, equipment.value - 1))
    const ticketLevel = computed<number>(() => Math.max(0, Math.floor((ticketPrice.value - 1) / 2)))
    const ticketsCost = computed<number>(() => scaledCost(620, 1.24, ticketLevel.value))
    const nextSongCost = computed<number>(() => scaledCost(1200, 8.5, songLevel.value))
    const hasNextSong = computed<boolean>(() => songLevel.value < SONGS.length - 1)
    const unlockedSongNames = computed<string[]>(() => {
        const maxUnlocked = Math.min(songLevel.value, SONGS.length - 1)
        return SONGS.slice(0, maxUnlocked + 1).map((song) => song.name)
    })
    const currentSong = computed<Song>(() => {
        const maxUnlocked = Math.min(songLevel.value, SONGS.length - 1)
        const safeSelected = Math.min(Math.max(selectedSongIndex.value, 0), maxUnlocked)
        return SONGS[safeSelected] ?? SONGS[0] ?? DEFAULT_SONG
    })
    const nextSongName = computed<string>(() => {
        if (!hasNextSong.value) return 'Vše odemčeno'
        return SONGS[songLevel.value + 1]?.name ?? 'Další písnička'
    })
    const hallInvestorRequirement = computed<number>(() => 4 + Math.floor(capacity.value / 15))

    const investorIncome = computed<number>(() => {
        const raw = investors.value * (1 + investors.value * 2.5)
        return roundDownToHalf(raw)
    })

    const investorIncomeIntervalSeconds = computed<number>(() => 2)
    const audienceJoinDelaySeconds = computed<number>(() => {
        const reduction = Math.floor(adLevel.value / AUDIENCE_JOIN_DELAY_STEP_LEVELS)
        return Math.max(AUDIENCE_BASE_JOIN_DELAY_SECONDS - reduction, AUDIENCE_MIN_JOIN_DELAY_SECONDS)
    })
    const audienceIncomeIntervalSeconds = computed<number>(() => {
        const reduction = Math.floor(adLevel.value / AUDIENCE_INCOME_STEP_LEVELS)
        return Math.max(AUDIENCE_BASE_INCOME_INTERVAL_SECONDS - reduction, AUDIENCE_MIN_INCOME_INTERVAL_SECONDS)
    })
    const audienceStaySeconds = computed<number>(() => {
        const bonus = Math.floor(adLevel.value / AUDIENCE_STAY_STEP_LEVELS)
        return AUDIENCE_BASE_STAY_SECONDS + bonus
    })

    const audienceIncome = computed<number>(() => {
        const raw = audience.value * (1 + (ticketPrice.value - 1) * 12)
        return roundDownToHalf(raw)
    })

    const ticketIncomePerPerson = computed<number>(() => {
        const raw = 1 + (ticketPrice.value - 1) * 12
        return roundDownToHalf(raw)
    })

    const ticketIncomeIncreasePerUpgrade = computed<number>(() => {
        const nextTicketPrice = ticketPrice.value + 2
        const nextIncome = 1 + (nextTicketPrice - 1) * 12
        const currentIncome = 1 + (ticketPrice.value - 1) * 12
        return roundDownToHalf(nextIncome - currentIncome)
    })

    const clickPowerIncreasePerUpgrade = computed<number>(() => {
        const nextClickPower = calculateClickPower(equipment.value + 1)
        const currentClickPower = calculateClickPower(equipment.value)
        return roundDownToHalf(nextClickPower - currentClickPower)
    })

    const floatingTexts = ref<FloatingText[]>([])
    const audienceMembers = ref<AudienceMember[]>([])
    const lastPressedNote = ref<string>('')
    const melodyIndex = ref<number>(0)
    const offlineEarnings = ref<number>(0)
    const offlineSeconds = ref<number>(0)
    const bossActive = ref<boolean>(false)
    const bossTimeLeftSeconds = ref<number>(0)
    const bossFightDurationSeconds = ref<number>(BOSS_DURATION_SECONDS)
    const bossClicksRequired = ref<number>(0)
    const bossClicksDone = ref<number>(0)
    const bossWarningText = ref<string>('')
    const bossIncomingName = ref<string>('')
    const bossIncomingImage = ref<string>('')
    const bossCurrentName = ref<string>('')
    const bossCurrentImage = ref<string>('')
    const bossNextInSeconds = ref<number>(0)
    const bossSpawnProgress = ref<number>(0)
    const bossResultText = ref<string>('')
    const bossResultTone = ref<BossResultTone>('success')
    const lastInteractionAt = ref<number>(Date.now())
    const bossClicksUntilEligible = ref<number>(0)
    const bossWins = ref<number>(0)

    let textId = 0
    let audienceInterval: ReturnType<typeof setInterval> | null = null
    let investorInterval: ReturnType<typeof setInterval> | null = null
    let audienceIncomeInterval: ReturnType<typeof setInterval> | null = null
    let bossSpawnTimeout: ReturnType<typeof setTimeout> | null = null
    let bossTickInterval: ReturnType<typeof setInterval> | null = null
    let inactivityInterval: ReturnType<typeof setInterval> | null = null
    let bossResultTimeout: ReturnType<typeof setTimeout> | null = null
    let lastAudienceIncomeAt = Date.now()
    let bossEndsAt = 0
    let bossNextSpawnAt = 0
    let bossSpawnDelayMs = 0
    let pendingBoss: BossProfile | null = null
    let restoredPendingBoss: BossProfile | null = null
    let restoredPendingBossRemainingMs: number | null = null

    const handleBeforeUnload = () => {
        saveGame()
    }

    const saveGame = () => {
        const pendingBossRemainingMs =
            !bossActive.value && pendingBoss && bossNextSpawnAt > 0
                ? Math.max(0, bossNextSpawnAt - Date.now())
                : null

        const gameState = {
            money: roundDownToHalf(money.value),
            investors: investors.value,
            equipment: equipment.value,
            ticketPrice: ticketPrice.value,
            audience: audience.value,
            capacity: capacity.value,
            adLevel: adLevel.value,
            songLevel: songLevel.value,
            selectedSongIndex: selectedSongIndex.value,
            bossWins: bossWins.value,
            pendingBoss: pendingBoss ?? undefined,
            pendingBossRemainingMs: pendingBossRemainingMs ?? undefined,
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
            songLevel.value = Math.min(Math.max(Number(gameState.songLevel) || 0, 0), SONGS.length - 1)
            selectedSongIndex.value = Math.min(
                Math.max(Number(gameState.selectedSongIndex) || 0, 0),
                songLevel.value
            )
            bossWins.value = Math.max(Number(gameState.bossWins) || 0, 0)
            restoredPendingBoss =
                gameState.pendingBoss &&
                typeof gameState.pendingBoss.name === 'string' &&
                typeof gameState.pendingBoss.fame === 'number' &&
                typeof gameState.pendingBoss.image === 'string'
                    ? gameState.pendingBoss
                    : null
            restoredPendingBossRemainingMs =
                typeof gameState.pendingBossRemainingMs === 'number' && gameState.pendingBossRemainingMs >= 0
                    ? gameState.pendingBossRemainingMs
                    : null
            audienceMembers.value = Array.isArray(gameState.audienceMembers)
                ? gameState.audienceMembers.map((member) => ({
                    ...member,
                    hue: typeof member.hue === 'number' ? member.hue : Math.floor(Math.random() * 360)
                }))
                : []

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

        const rawOfflineSeconds = diffMs / 1000
        if (rawOfflineSeconds < MIN_OFFLINE_REWARD_SECONDS) return

        const clampedSeconds = Math.min(rawOfflineSeconds, MAX_OFFLINE_SECONDS)
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

    function createAudienceHue(): number {
        return Math.floor(Math.random() * 360)
    }

    function spendMoney(amount: number): boolean {
        if (money.value < amount) return false

        money.value = roundDownToHalf(money.value - amount)
        return true
    }

    function triggerSing(x: number, y: number): void {
        registerInteraction()

        addMoney(clickPower.value)

        if (bossActive.value) {
            bossClicksDone.value++
            if (bossClicksDone.value >= bossClicksRequired.value) {
                finishBossFight(true)
            }
        }

        const id = textId++
        floatingTexts.value.push({ id, x, y, amount: clickPower.value })
        setTimeout(() => {
            floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id)
        }, 1000)

        saveGame()
    }

    function isPlayerActive(): boolean {
        return Date.now() - lastInteractionAt.value <= PLAYER_INACTIVE_MS
    }

    function getBossLevelFromWins(): number {
        return Math.min(BOSS_ROSTER.length - 1, Math.floor(bossWins.value / 2))
    }

    function pickRandomBoss(): BossProfile {
        const maxLevel = getBossLevelFromWins()
        const unlocked = BOSS_ROSTER.slice(0, maxLevel + 1)
        const randomIndex = Math.floor(Math.random() * unlocked.length)
        return unlocked[randomIndex] ?? BOSS_ROSTER[0] ?? DEFAULT_BOSS
    }

    function showBossResult(text: string, tone: BossResultTone = 'success'): void {
        bossResultText.value = text
        bossResultTone.value = tone

        if (bossResultTimeout) {
            clearTimeout(bossResultTimeout)
            bossResultTimeout = null
        }

        bossResultTimeout = setTimeout(() => {
            bossResultText.value = ''
        }, 5000)
    }

    function clearBossScheduleTimers(): void {
        if (bossSpawnTimeout) {
            clearTimeout(bossSpawnTimeout)
            bossSpawnTimeout = null
        }

        bossNextSpawnAt = 0
        bossSpawnDelayMs = 0
        bossNextInSeconds.value = 0
        bossSpawnProgress.value = 0
        bossIncomingName.value = ''
        bossIncomingImage.value = ''
        pendingBoss = null
    }

    function setBossReengageGate(message: string): void {
        clearBossScheduleTimers()

        if (bossTickInterval) {
            clearInterval(bossTickInterval)
            bossTickInterval = null
        }

        bossActive.value = false
        bossCurrentName.value = ''
        bossCurrentImage.value = ''
        bossTimeLeftSeconds.value = 0
        bossClicksDone.value = 0
        bossClicksRequired.value = 0
        bossFightDurationSeconds.value = BOSS_DURATION_SECONDS

        if (bossClicksUntilEligible.value <= 0) {
            bossClicksUntilEligible.value = BOSS_REENGAGE_CLICKS
        }

        bossWarningText.value = `${message} Klikni ještě ${bossClicksUntilEligible.value}x a boss se vrátí.`
    }

    function registerInteraction(): void {
        lastInteractionAt.value = Date.now()

        if (bossClicksUntilEligible.value <= 0) return

        bossClicksUntilEligible.value--

        if (bossClicksUntilEligible.value > 0) {
            bossWarningText.value = `Boss čeká na tvoji aktivitu. Klikni ještě ${bossClicksUntilEligible.value}x.`
            return
        }

        bossWarningText.value = 'Jsi zpět. Rival tě znovu sleduje...'
        scheduleNextBoss()
    }

    function updateBossIncomingCountdown(): void {
        if (bossActive.value) return
        if (bossClicksUntilEligible.value > 0 || !bossSpawnTimeout || bossNextSpawnAt <= 0) {
            bossNextInSeconds.value = 0
            bossSpawnProgress.value = 0
            return
        }

        const remainingMs = bossNextSpawnAt - Date.now()
        if (remainingMs <= 0) {
            bossNextInSeconds.value = 0
            bossSpawnProgress.value = 100
            return
        }

        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
        bossNextInSeconds.value = remainingSeconds

        if (bossSpawnDelayMs > 0) {
            const elapsed = bossSpawnDelayMs - remainingMs
            bossSpawnProgress.value = Math.max(0, Math.min(100, Math.floor((elapsed / bossSpawnDelayMs) * 100)))
        }

        if (remainingSeconds <= BOSS_WARNING_WINDOW_SECONDS) {
            bossWarningText.value = `⚠️ ${bossIncomingName.value || 'Boss'} dorazí za ${remainingSeconds}s!`
            return
        }

        if (bossWarningText.value.startsWith('⚠️')) {
            bossWarningText.value = ''
        }
    }

    function handleKeyPress(event: KeyboardEvent): void {
        if (event.repeat) return
        if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return

        const note = keyToNote(event.key)
        if (!note) return

        playNote(note as string)
        lastPressedNote.value = note as string

        const stage = document.querySelector('.click-area')
        const rect = stage?.getBoundingClientRect()
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

        triggerSing(cx, cy)
    }

    function sing(event: MouseEvent): void {
        const melody = currentSong.value.melody
        const note = melody[melodyIndex.value % melody.length] ?? 'C4'
        melodyIndex.value = (melodyIndex.value + 1) % melody.length
        playNote(note)
        lastPressedNote.value = note
        triggerSing(event.clientX, event.clientY)
    }

    function randomBossDelayMs(): number {
        const range = BOSS_MAX_DELAY_MS - BOSS_MIN_DELAY_MS
        return BOSS_MIN_DELAY_MS + Math.floor(Math.random() * range)
    }

    function updateBossCountdown(): void {
        if (!bossActive.value) return

        const remainingMs = bossEndsAt - Date.now()
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
        bossTimeLeftSeconds.value = seconds

        if (remainingMs <= 0) {
            finishBossFight(false)
        }
    }

    function scheduleNextBoss(): void {
        clearBossScheduleTimers()

        if (bossClicksUntilEligible.value > 0) {
            return
        }

        if (!isPlayerActive()) {
            setBossReengageGate('Nejsi aktivní.')
            return
        }

        pendingBoss = pickRandomBoss()
        bossIncomingName.value = pendingBoss.name
        bossIncomingImage.value = pendingBoss.image

        const delay = randomBossDelayMs()
        bossSpawnDelayMs = delay
        bossNextSpawnAt = Date.now() + delay
        updateBossIncomingCountdown()

        bossSpawnTimeout = setTimeout(() => {
            if (!isPlayerActive()) {
                setBossReengageGate('Nejsi aktivní.')
                return
            }

            startBossFight(pendingBoss ?? pickRandomBoss())
        }, delay)
    }

    function scheduleRestoredBoss(delayMs: number, profile: BossProfile): void {
        clearBossScheduleTimers()

        if (bossClicksUntilEligible.value > 0) return
        if (bossActive.value) return

        pendingBoss = profile
        bossIncomingName.value = profile.name
        bossIncomingImage.value = profile.image

        const safeDelay = Math.max(1000, Math.floor(delayMs))
        bossSpawnDelayMs = safeDelay
        bossNextSpawnAt = Date.now() + safeDelay
        updateBossIncomingCountdown()

        bossSpawnTimeout = setTimeout(() => {
            if (!isPlayerActive()) {
                setBossReengageGate('Nejsi aktivní.')
                return
            }

            startBossFight(pendingBoss ?? pickRandomBoss())
        }, safeDelay)
    }

    function startBossFight(profile: BossProfile): void {
        if (bossActive.value) return

        if (investors.value <= 0) {
            scheduleNextBoss()
            return
        }

        const level = getBossLevelFromWins()
        const investorPressure = Math.floor(Math.sqrt(Math.max(investors.value, 0)) * 3)
        const baseRequired = 28 + level * 7
        const requiredClicks = Math.max(
            35,
            Math.min(260, Math.floor((baseRequired + investorPressure) * profile.fame))
        )
        const durationSeconds = Math.max(12, BOSS_DURATION_SECONDS - Math.floor(level / 2))

        if (!isPlayerActive()) {
            setBossReengageGate('Nejsi aktivní.')
            return
        }

        bossActive.value = true
        clearBossScheduleTimers()
        bossCurrentName.value = profile.name
        bossCurrentImage.value = profile.image
        bossClicksRequired.value = requiredClicks
        bossClicksDone.value = 0
        bossFightDurationSeconds.value = durationSeconds
        bossWarningText.value = ''
        bossEndsAt = Date.now() + durationSeconds * 1000
        updateBossCountdown()

        if (bossTickInterval) {
            clearInterval(bossTickInterval)
            bossTickInterval = null
        }

        bossTickInterval = setInterval(() => {
            updateBossCountdown()
        }, 250)
    }

    function finishBossFight(won: boolean): void {
        if (!bossActive.value) return

        const defeatedName = bossCurrentName.value

        if (!won && investors.value > 0) {
            investors.value = 0
            showBossResult(`❌ ${defeatedName} tě porazil. Investoři odešli.`, 'error')
        }

        if (won) {
            bossWins.value++
            showBossResult(`✅ ${defeatedName} byl poražen! Publikum šílí.`, 'success')
        }

        bossActive.value = false
        bossCurrentName.value = ''
        bossCurrentImage.value = ''
        bossTimeLeftSeconds.value = 0
        bossFightDurationSeconds.value = BOSS_DURATION_SECONDS
        if (won) {
            bossWarningText.value = ''
        }

        if (bossTickInterval) {
            clearInterval(bossTickInterval)
            bossTickInterval = null
        }

        saveGame()
        if (restoredPendingBoss && restoredPendingBossRemainingMs !== null) {
            scheduleRestoredBoss(restoredPendingBossRemainingMs, restoredPendingBoss)
        } else {
            scheduleNextBoss()
        }
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
            leaveTime: now + audienceStaySeconds.value * 1000,
            hue: createAudienceHue()
        })
        audience.value++
    }

    function buyAd(): void {
        if (audience.value >= capacity.value || !spendMoney(adCost.value)) return

        adLevel.value++
        saveGame()

        const personDelay = audienceJoinDelaySeconds.value * 1000
        const peopleToAdd = 3 + Math.floor(adLevel.value * 0.35)

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

    function buySong(): void {
        if (!hasNextSong.value) return
        if (!spendMoney(nextSongCost.value)) return

        songLevel.value++
        selectedSongIndex.value = songLevel.value
        melodyIndex.value = 0
        saveGame()
    }

    function selectSong(index: number): void {
        const maxUnlocked = Math.min(songLevel.value, SONGS.length - 1)
        const safeIndex = Math.floor(index)
        if (safeIndex < 0 || safeIndex > maxUnlocked) return

        selectedSongIndex.value = safeIndex
        melodyIndex.value = 0
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

    const displayAudience = computed<Array<{ active: boolean; hue: number }>>(() => {
        const total = audienceMembers.value.length
        const maxVisible = 50
        if (total <= 0) {
            const slots = Math.max(0, Math.min(maxVisible, capacity.value))
            return Array.from({ length: slots }, () => ({ active: false, hue: 0 }))
        }

        const chunkBase = Math.floor((total - 1) / maxVisible) * maxVisible
        const activeInChunk = total - chunkBase
        const chunkCapacity = Math.max(0, Math.min(maxVisible, capacity.value - chunkBase))
        const sourceMembers = audienceMembers.value.slice(chunkBase, chunkBase + maxVisible)
        const slots = Math.max(chunkCapacity, activeInChunk)

        const result: Array<{ active: boolean; hue: number }> = []
        for (let i = 0; i < slots; i++) {
            const member = sourceMembers[i]
            result.push({
                active: i < activeInChunk,
                hue: member?.hue ?? 0
            })
        }

        return result
    })

    const audienceOverflow = computed<number>(() => {
        if (audience.value <= 0) return 0
        return Math.floor((audience.value - 1) / 50) * 50
    })

    onMounted(() => {
        const lastSeenAt = loadGame()
        applyOfflineEarnings(lastSeenAt)
        lastAudienceIncomeAt = Date.now()

        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('keydown', handleKeyPress)

        investorInterval = setInterval(() => {
            if (investorIncome.value > 0) {
                addMoney(investorIncome.value)
                saveGame()
            }
        }, investorIncomeIntervalSeconds.value * 1000)

        audienceIncomeInterval = setInterval(() => {
            const now = Date.now()
            if (
                audienceIncome.value > 0 &&
                now - lastAudienceIncomeAt >= audienceIncomeIntervalSeconds.value * 1000
            ) {
                addMoney(audienceIncome.value)
                lastAudienceIncomeAt = now
                saveGame()
            }
        }, 1000)

        audienceInterval = setInterval(() => {
            removeExpiredAudience()
            saveGame()
        }, 1000)

        inactivityInterval = setInterval(() => {
            if (!isPlayerActive() && bossActive.value) {
                setBossReengageGate('Boss tě nenašel')
            }

            updateBossIncomingCountdown()
        }, 1000)

        scheduleNextBoss()
    })

    onUnmounted(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('keydown', handleKeyPress)

        if (investorInterval) clearInterval(investorInterval)
        if (audienceIncomeInterval) clearInterval(audienceIncomeInterval)
        if (audienceInterval) clearInterval(audienceInterval)
        if (inactivityInterval) clearInterval(inactivityInterval)
        clearBossScheduleTimers()
        if (bossTickInterval) clearInterval(bossTickInterval)
        if (bossResultTimeout) clearTimeout(bossResultTimeout)

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
        bossBarVisibleSeconds: BOSS_BAR_VISIBLE_SECONDS,
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
    }
}
