import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { roundDownToHalf } from '@/utils/number'
import { playNote, keyToNote, extendedKeyToNote } from '@/utils/notes'
import type {
    AudienceMember,
    BoostClaimMilestones,
    BoostRewardOption,
    BoostSlot,
    BoostTimers,
    BoostType,
    BossProfile,
    BossResultTone,
    FloatingText,
    GameState,
    Song
} from '@/game/types'
import {
    AUDIENCE_BASE_INCOME_INTERVAL_SECONDS,
    AUDIENCE_BASE_JOIN_DELAY_SECONDS,
    AUDIENCE_BASE_STAY_SECONDS,
    AUDIENCE_INCOME_STEP_LEVELS,
    AUDIENCE_JOIN_DELAY_STEP_LEVELS,
    AUDIENCE_MIN_INCOME_INTERVAL_SECONDS,
    AUDIENCE_MIN_JOIN_DELAY_SECONDS,
    BOOST_DURATION_SECONDS,
    BOSS_BAR_VISIBLE_SECONDS,
    BOSS_DURATION_SECONDS,
    BOSS_MAX_DELAY_MS,
    BOSS_MIN_DELAY_MS,
    BOSS_REENGAGE_CLICKS,
    BOSS_WARNING_WINDOW_SECONDS,
    MIN_OFFLINE_REWARD_SECONDS,
    OFFLINE_BASE_MAX_SECONDS,
    OFFLINE_BASE_MULTIPLIER,
    OFFLINE_HARD_MAX_SECONDS,
    OFFLINE_MAX_MULTIPLIER,
    PLAYER_INACTIVE_MS,
    PRESTIGE_COST,
    PRESTIGE_REQUIRED_UNLOCKED_SONGS,
    SAVE_DEBOUNCE_MS,
    SAVE_EXPORT_KEY
} from '@/game/config'
import {
    AUDIENCE_BOOST_BOSS_REWARD_NAMES,
    BOSS_LOSS_MESSAGES,
    BOSS_ROSTER,
    BOSS_WIN_MESSAGES,
    DEFAULT_BOSS,
    JAN_KAFKA_WIN_STEAL_CHANCE
} from '@/game/bosses'
import { DEFAULT_SONG, SONGS } from '@/game/songs'

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
    const availableBoosts = ref<BoostType[]>([])
    const boostClaimMilestones = ref<BoostClaimMilestones>({
        click: 0,
        investor: 0,
        audience: 0
    })
    const activeBoosts = ref<BoostType[]>([])
    const boostRewardPending = ref<boolean>(false)
    const audienceBossRewardUnlockedThisFight = ref<boolean>(false)
    const boostTimeLeftSeconds = ref<number>(0)
    const prestigeLevel = ref<number>(0)
    const prestigeBought = computed<boolean>(() => prestigeLevel.value >= 1)
    const prestigeMultiplier = computed<number>(() => Math.pow(2, prestigeLevel.value))
    const extendedPianoEnabled = ref<boolean>(false)
    const extendedPianoUnlockedEver = ref<boolean>(false)

    const totalUpgradeCount = computed<number>(() => {
        const ticketUpgrades = Math.floor(Math.max(0, ticketPrice.value - 1) / 2)
        return Math.max(0, equipment.value - 1) + adLevel.value + ticketUpgrades + songLevel.value
    })

    const extendedPianoRequirementsMet = computed<boolean>(() => {
        return investors.value >= 20 && totalUpgradeCount.value >= 10 && capacity.value >= 80
    })

    const extendedPianoUnlocked = computed<boolean>(() => {
        return extendedPianoRequirementsMet.value || extendedPianoUnlockedEver.value
    })

    const prestigeCost = computed<number>(() => {
        if (prestigeLevel.value === 0) return PRESTIGE_COST
        if (prestigeLevel.value === 1) return 200_000_000
        return 0
    })
    const hasAllSongs = computed<boolean>(() => songLevel.value >= SONGS.length - 1)
    const unlockedSongCount = computed<number>(() => Math.min(songLevel.value + 1, SONGS.length))
    const hasPrestigeSongRequirement = computed<boolean>(() => {
        return unlockedSongCount.value >= PRESTIGE_REQUIRED_UNLOCKED_SONGS
    })

    watch(extendedPianoRequirementsMet, (requirementsMet) => {
        if (!requirementsMet || extendedPianoUnlockedEver.value) return

        extendedPianoUnlockedEver.value = true
        scheduleSaveGame()
    })

    function calculateClickPower(equipmentLevel: number): number {
        if (equipmentLevel <= 1) return 1
        if (equipmentLevel === 2) return 1.5
        if (equipmentLevel === 3) return 2.5

        // stronger, but smooth scaling: linear + superlinear term
        const level = equipmentLevel - 3
        const raw = 2.5 + level * 3.0 + Math.pow(level, 1.6) * 1.2
        return roundDownToHalf(raw)
    }

    const baseClickPower = computed<number>(() => calculateClickPower(equipment.value))
    const clickPower = computed<number>(() => {
        const boostMultiplier = activeBoosts.value.includes('click') ? 2 : 1
        return roundDownToHalf(baseClickPower.value * boostMultiplier * prestigeMultiplier.value)
    })

    function calculateInvestorCost(level: number, equipmentLevel: number): number {
        const baseCost = scaledProgressiveCost(320, 1.2, level, 10, 1.05, 0.86, 4)
        const equipmentSurcharge = 1 + Math.max(0, equipmentLevel - 1) * 0.018
        return roundDownToHalf(baseCost * equipmentSurcharge)
    }

    function calculateInvestorIncome(investorCount: number, equipmentLevel: number): number {
        const equipmentBonus = 1 + Math.max(0, equipmentLevel - 1) * 0.014
        const raw = investorCount * (1 + investorCount * 2.5) * equipmentBonus
        return roundDownToHalf(raw)
    }

    function scaledCost(base: number, growth: number, level: number): number {
        const safeLevel = Math.max(0, level)
        return roundDownToHalf(base * Math.pow(growth, safeLevel))
    }

    function scaledProgressiveCost(
        base: number,
        growth: number,
        level: number,
        lateGrowthStart: number,
        lateGrowth: number,
        earlyDiscountMin = 0.84,
        earlyDiscountLevels = 4
    ): number {
        const safeLevel = Math.max(0, level)
        const lateLevel = Math.max(0, safeLevel - lateGrowthStart)

        let raw = base * Math.pow(growth, safeLevel) * Math.pow(lateGrowth, lateLevel)

        if (safeLevel < earlyDiscountLevels) {
            const t = safeLevel / Math.max(1, earlyDiscountLevels - 1)
            const discount = earlyDiscountMin + (1 - earlyDiscountMin) * t
            raw *= discount
        }

        return roundDownToHalf(raw)
    }

    const investorCost = computed<number>(() => calculateInvestorCost(investors.value, equipment.value))
    const adCost = computed<number>(() => scaledProgressiveCost(117, 1.19, adLevel.value, 8, 1.06, 0.8, 4))
    const equipmentCost = computed<number>(() => scaledProgressiveCost(205, 1.24, equipment.value - 1, 9, 1.05, 0.84, 4))
    const ticketLevel = computed<number>(() => Math.max(0, Math.floor((ticketPrice.value - 1) / 2)))
    const ticketsCost = computed<number>(() => scaledProgressiveCost(560, 1.22, ticketLevel.value, 8, 1.06, 0.84, 4))
    const nextSongCost = computed<number>(() => scaledCost(1200, 5, songLevel.value))
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
    const hallCapacityIncrease = computed<number>(() => {
        if (capacity.value < 100) return 10
        if (capacity.value < 250) return 20
        if (capacity.value < 800) return 50
        if (capacity.value < 3000) return 120
        return 250
    })

    const investorIncome = computed<number>(() => {
        const base = calculateInvestorIncome(investors.value, equipment.value)
        // When investor boost is active, make payouts slightly higher (+15%)
        return roundDownToHalf(base * (activeBoosts.value.includes('investor') ? 1.15 : 1) * prestigeMultiplier.value)
    })
    const investorIncomeIncreasePerPurchase = computed<number>(() => {
        const nextIncome = calculateInvestorIncome(investors.value + 1, equipment.value) * prestigeMultiplier.value
        return roundDownToHalf(nextIncome - investorIncome.value)
    })

    const investorIncomeIntervalSeconds = computed<number>(() => activeBoosts.value.includes('investor') ? 1 : 2)
    const audienceJoinDelaySeconds = computed<number>(() => {
        const reduction = Math.floor(adLevel.value / AUDIENCE_JOIN_DELAY_STEP_LEVELS)
        return Math.max(AUDIENCE_BASE_JOIN_DELAY_SECONDS - reduction, AUDIENCE_MIN_JOIN_DELAY_SECONDS)
    })
    const audienceIncomeIntervalSeconds = computed<number>(() => {
        const reduction = Math.floor(adLevel.value / AUDIENCE_INCOME_STEP_LEVELS)
        return Math.max(AUDIENCE_BASE_INCOME_INTERVAL_SECONDS - reduction, AUDIENCE_MIN_INCOME_INTERVAL_SECONDS)
    })
    const audienceBaseStaySeconds = computed<number>(() => {
        const level = Math.max(0, adLevel.value)
        const linear = level * 2.2
        const scaling = Math.pow(level, 1.22) * 1.8
        const raw = AUDIENCE_BASE_STAY_SECONDS + linear + scaling
        return Math.floor(Math.min(raw, 620))
    })

    const audienceStaySeconds = computed<number>(() => {
        const multiplier = activeBoosts.value.includes('audience') ? 2 : 1
        return Math.floor(audienceBaseStaySeconds.value * multiplier)
    })

    function calculateTicketIncomePerPerson(price: number): number {
        const level = Math.max(0, Math.floor((price - 1) / 2))
        const linear = 40 + level * 32
        const surgeLevel = Math.max(0, level - 2)
        const surge = Math.pow(surgeLevel, 1.8) * 16
        const audienceBoostMultiplier = activeBoosts.value.includes('audience') ? 2 : 1
        return roundDownToHalf((linear + surge) * audienceBoostMultiplier)
    }

    const audienceIncome = computed<number>(() => {
        const raw = audience.value * calculateTicketIncomePerPerson(ticketPrice.value)
        return roundDownToHalf(raw * prestigeMultiplier.value)
    })

    const ticketIncomePerPerson = computed<number>(() => {
        return calculateTicketIncomePerPerson(ticketPrice.value)
    })

    const ticketIncomeIncreasePerUpgrade = computed<number>(() => {
        const nextTicketPrice = ticketPrice.value + 2
        const nextIncome = calculateTicketIncomePerPerson(nextTicketPrice) * prestigeMultiplier.value
        const currentIncome = calculateTicketIncomePerPerson(ticketPrice.value) * prestigeMultiplier.value
        return roundDownToHalf(nextIncome - currentIncome)
    })

    const clickPowerIncreasePerUpgrade = computed<number>(() => {
        const nextClickPower = calculateClickPower(equipment.value + 1)
        const currentClickPower = calculateClickPower(equipment.value)
        return roundDownToHalf((nextClickPower - currentClickPower) * prestigeMultiplier.value)
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
    let lastInvestorIncomeAt = Date.now()
    let bossEndsAt = 0
    let bossNextSpawnAt = 0
    let bossSpawnDelayMs = 0
    let pendingBoss: BossProfile | null = null
    let restoredPendingBoss: BossProfile | null = null
    let restoredPendingBossRemainingMs: number | null = null
    let saveTimeout: ReturnType<typeof setTimeout> | null = null
    let lastSavedState = ''
    let boostExpiresAt: BoostTimers = {
        click: 0,
        investor: 0,
        audience: 0
    }

    function resolvePublicPath(path: string): string {
        if (!path) return path
        if (/^https?:\/\//i.test(path)) return path
        const cleanPath = path.replace(/^\/+/, '')
        return `/${cleanPath}`
    }
    function isBoostAvailable(type: BoostType): boolean {
        return availableBoosts.value.includes(type)
    }

    function grantBoost(type: BoostType): void {
        if (isBoostAvailable(type)) return
        availableBoosts.value = [...availableBoosts.value, type]
    }

    function updateBoostCountdown(): void {
        if (activeBoosts.value.length === 0) {
            boostTimeLeftSeconds.value = 0
            return
        }

        const wasAudienceActive = activeBoosts.value.includes('audience')
        const now = Date.now()
        const stillActive: BoostType[] = []
        const remainingSeconds: number[] = []

        for (const type of activeBoosts.value) {
            const remainingMs = (boostExpiresAt[type] ?? 0) - now
            if (remainingMs > 0) {
                stillActive.push(type)
                remainingSeconds.push(Math.ceil(remainingMs / 1000))
            } else {
                boostExpiresAt[type] = 0
            }
        }

        if (stillActive.length !== activeBoosts.value.length) {
            activeBoosts.value = stillActive

            const isAudienceActive = stillActive.includes('audience')
            if (wasAudienceActive && !isAudienceActive && ticketPrice.value % 2 === 0) {
                ticketPrice.value = Math.max(1, Math.floor(ticketPrice.value / 2))
            }

            scheduleSaveGame()
        }

        boostTimeLeftSeconds.value = remainingSeconds.length > 0 ? Math.max(...remainingSeconds) : 0
    }

    function activateBoost(type: BoostType): void {
        if (!isBoostAvailable(type)) return
        if (activeBoosts.value.includes(type)) return

        availableBoosts.value = availableBoosts.value.filter((boost) => boost !== type)
        activeBoosts.value = [...activeBoosts.value, type]
        boostExpiresAt[type] = Date.now() + BOOST_DURATION_SECONDS * 1000
        updateBoostCountdown()

        if (type === 'audience') {
            const extensionMs = audienceBaseStaySeconds.value * 1000
            audienceMembers.value = audienceMembers.value.map((member) => ({
                ...member,
                leaveTime: member.leaveTime + extensionMs
            }))
        }

        scheduleSaveGame()
    }

    function maybeGrantMilestoneBoost(type: BoostType, level: number): boolean {
        const milestoneStep = type === 'audience' ? 20 : 10
        const milestone = Math.floor(level / milestoneStep) * milestoneStep
        const claimedMilestone = boostClaimMilestones.value[type] ?? 0
        if (milestone < milestoneStep || milestone <= claimedMilestone) return false

        grantBoost(type)
        boostClaimMilestones.value = {
            ...boostClaimMilestones.value,
            [type]: milestone
        }
        return true
    }

    function maybeUnlockProgressBoosts(): boolean {
        const equipmentGranted = maybeGrantMilestoneBoost('click', equipment.value)
        const investorGranted = maybeGrantMilestoneBoost('investor', investors.value)
        const audienceGranted = maybeGrantMilestoneBoost('audience', ticketLevel.value)
        return equipmentGranted || investorGranted || audienceGranted
    }

    function claimBossRewardBoost(type: BoostType): void {
        if (type === 'audience' && !audienceBossRewardUnlockedThisFight.value) return

        grantBoost(type)
        boostRewardPending.value = false
        audienceBossRewardUnlockedThisFight.value = false
        scheduleSaveGame()
    }

    const handleBeforeUnload = () => {
        saveGame()
    }

    const handlePageHide = () => {
        saveGame()
    }

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            saveGame()
        }
    }

    function buildGameState() {
        const activeBossProfile = bossActive.value
            ? BOSS_ROSTER.find((boss) => boss.name === bossCurrentName.value)
            : null

        const pendingBossForSave = pendingBoss ?? activeBossProfile ?? undefined
        const pendingBossRemainingMs = pendingBossForSave
            ? (
                !bossActive.value && bossNextSpawnAt > 0
                    ? Math.max(0, bossNextSpawnAt - Date.now())
                    : 1000
            )
            : null

        return {
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
            prestigeLevel: prestigeLevel.value,
            prestigeBought: prestigeBought.value,
            extendedPianoEnabled: extendedPianoEnabled.value,
            extendedPianoUnlocked: extendedPianoUnlocked.value,
            pendingBoss: pendingBossForSave,
            pendingBossRemainingMs: pendingBossRemainingMs ?? undefined,
            audienceMembers: audienceMembers.value,
            availableBoosts: availableBoosts.value,
            boostClaimMilestones: boostClaimMilestones.value,
            activeBoosts: activeBoosts.value,
            boostRemainingByTypeMs: {
                click: activeBoosts.value.includes('click') ? Math.max(0, boostExpiresAt.click - Date.now()) : 0,
                investor: activeBoosts.value.includes('investor') ? Math.max(0, boostExpiresAt.investor - Date.now()) : 0,
                audience: activeBoosts.value.includes('audience') ? Math.max(0, boostExpiresAt.audience - Date.now()) : 0
            },
            activeBoost: activeBoosts.value[0] ?? undefined,
            boostRemainingMs: activeBoosts.value.length > 0 ? Math.max(
                0,
                ...activeBoosts.value.map((type) => Math.max(0, boostExpiresAt[type] - Date.now()))
            ) : undefined,
            lastSeenAt: Date.now()
        }
    }

    function persistGameState(force = false): void {
        const serialized = JSON.stringify(buildGameState())
        if (!force && serialized === lastSavedState) return

        localStorage.setItem('klikacka-save', serialized)
        lastSavedState = serialized
    }

    function xorBytes(bytes: Uint8Array, key: string): Uint8Array {
        const keyBytes = new TextEncoder().encode(key) as Uint8Array
        return bytes.map((byte, index) => {
            const keyByte = keyBytes[index % keyBytes.length] ?? 0
            return byte ^ keyByte
        })
    }

    function encodeSaveData(payload: string): string {
        const raw = new TextEncoder().encode(payload)
        const obfuscated = xorBytes(raw, SAVE_EXPORT_KEY)
        const binary = String.fromCharCode(...Array.from(obfuscated))
        return btoa(binary)
    }

    function decodeSaveData(encoded: string): string | null {
        try {
            const binary = atob(encoded)
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
            const restored = xorBytes(bytes, SAVE_EXPORT_KEY)
            return new TextDecoder().decode(restored)
        } catch {
            return null
        }
    }

    function exportSaveData(): string {
        return encodeSaveData(JSON.stringify(buildGameState()))
    }

    function exportSaveFile(): void {
        const content = exportSaveData()
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'klikacka-save.txt'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    function scheduleSaveGame(): void {
        if (saveTimeout) return

        saveTimeout = setTimeout(() => {
            saveTimeout = null
            persistGameState()
        }, SAVE_DEBOUNCE_MS)
    }

    const saveGame = () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout)
            saveTimeout = null
        }

        persistGameState(true)
    }

    function applyGameState(gameState: GameState): number | null {
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
        prestigeLevel.value = Math.max(
            0,
            Number(gameState.prestigeLevel) || (gameState.prestigeBought ? 1 : 0)
        )
        extendedPianoUnlockedEver.value = Boolean(gameState.extendedPianoUnlocked || gameState.extendedPianoEnabled)
        extendedPianoEnabled.value = Boolean(gameState.extendedPianoEnabled) && extendedPianoUnlocked.value
        const savedBoosts = Array.isArray(gameState.availableBoosts)
            ? gameState.availableBoosts
            : Array.isArray(gameState.unlockedBoosts)
                ? gameState.unlockedBoosts
                : []
        availableBoosts.value = savedBoosts.filter((boost): boost is BoostType =>
            boost === 'click' || boost === 'investor' || boost === 'audience'
        )
        boostClaimMilestones.value = {
            click: Math.max(0, Number(gameState.boostClaimMilestones?.click) || 0),
            investor: Math.max(0, Number(gameState.boostClaimMilestones?.investor) || 0),
            audience: Math.max(0, Number(gameState.boostClaimMilestones?.audience) || 0)
        }
        const parsedActiveBoosts = Array.isArray(gameState.activeBoosts)
            ? gameState.activeBoosts.filter((boost): boost is BoostType =>
                boost === 'click' || boost === 'investor' || boost === 'audience'
            )
            : []

        if (parsedActiveBoosts.length > 0) {
            activeBoosts.value = parsedActiveBoosts
            boostExpiresAt = {
                click: Date.now() + Math.max(0, Math.floor(Number(gameState.boostRemainingByTypeMs?.click) || 0)),
                investor: Date.now() + Math.max(0, Math.floor(Number(gameState.boostRemainingByTypeMs?.investor) || 0)),
                audience: Date.now() + Math.max(0, Math.floor(Number(gameState.boostRemainingByTypeMs?.audience) || 0))
            }
        } else {
            const legacyActiveBoost =
                gameState.activeBoost === 'click' || gameState.activeBoost === 'investor' || gameState.activeBoost === 'audience'
                    ? gameState.activeBoost
                    : null
            activeBoosts.value = legacyActiveBoost ? [legacyActiveBoost] : []
            const legacyRemaining = Math.max(0, Math.floor(Number(gameState.boostRemainingMs) || 0))
            boostExpiresAt = {
                click: legacyActiveBoost === 'click' ? Date.now() + legacyRemaining : 0,
                investor: legacyActiveBoost === 'investor' ? Date.now() + legacyRemaining : 0,
                audience: legacyActiveBoost === 'audience' ? Date.now() + legacyRemaining : 0
            }
        }
        updateBoostCountdown()
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
    }

    const loadGame = (): number | null => {
        const saved = localStorage.getItem('klikacka-save')

        if (!saved) return null

        try {
            const gameState = JSON.parse(saved) as GameState
            return applyGameState(gameState)
        } catch (e) {
            console.warn('Hru se bohužel nepodařilo uložit: ', e)
            return null
        }
    }

    function importSaveString(encoded: string): boolean {
        const decoded = decodeSaveData(encoded.trim())
        if (!decoded) return false

        try {
            const gameState = JSON.parse(decoded) as GameState
            applyGameState(gameState)
            saveGame()
            return true
        } catch {
            return false
        }
    }

    function applyOfflineEarnings(lastSeenAt: number | null): void {
        if (!lastSeenAt) return

        const diffMs = Date.now() - lastSeenAt
        if (diffMs <= 0) return

        const rawOfflineSeconds = diffMs / 1000
        if (rawOfflineSeconds < MIN_OFFLINE_REWARD_SECONDS) return

        const progressionLevel =
            investors.value +
            adLevel.value +
            equipment.value +
            ticketLevel.value * 2 +
            songLevel.value * 4 +
            bossWins.value * 3

        const dynamicMaxOfflineSeconds = Math.min(
            OFFLINE_BASE_MAX_SECONDS + progressionLevel * 60 * 6,
            OFFLINE_HARD_MAX_SECONDS
        )

        const clampedSeconds = Math.min(rawOfflineSeconds, dynamicMaxOfflineSeconds)
        offlineSeconds.value = clampedSeconds

        const passivePerSecond =
            investorIncome.value / investorIncomeIntervalSeconds.value +
            audienceIncome.value / audienceIncomeIntervalSeconds.value

        const moneyLevelBoost = Math.log10(Math.max(10, money.value + 10)) * 0.01
        const progressionBoost = Math.min(0.16, progressionLevel * 0.0018)
        const offlineMultiplier = Math.min(
            OFFLINE_MAX_MULTIPLIER,
            OFFLINE_BASE_MULTIPLIER + progressionBoost + moneyLevelBoost
        )

        const reward = roundDownToHalf(passivePerSecond * clampedSeconds * offlineMultiplier)

        if (reward < 0.5) return

        offlineEarnings.value = reward
        addMoney(reward)
        scheduleSaveGame()
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

    function setExtendedPianoEnabled(enabled: boolean): void {
        extendedPianoEnabled.value = enabled && extendedPianoUnlocked.value
        scheduleSaveGame()
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

        scheduleSaveGame()
    }

    function isPlayerActive(): boolean {
        return Date.now() - lastInteractionAt.value <= PLAYER_INACTIVE_MS
    }

    function pickRandomBoss(): BossProfile {
        const randomIndex = Math.floor(Math.random() * BOSS_ROSTER.length)
        return BOSS_ROSTER[randomIndex] ?? BOSS_ROSTER[0] ?? DEFAULT_BOSS
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

    function pickRandomMessage(pool: string[], bossName: string): string {
        const index = Math.floor(Math.random() * pool.length)
        const template = pool[index] ?? '{boss}'
        return template.replace('{boss}', bossName)
    }

    function clearRestoredBoss(): void {
        restoredPendingBoss = null
        restoredPendingBossRemainingMs = null
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
            bossWarningText.value = `⚠️ ${bossIncomingName.value || 'Boss'} je právě ve městě. Hraj, aby sis udržel diváky. Dorazí za ${remainingSeconds}s!`
            return
        }

        bossWarningText.value = `${bossIncomingName.value || 'Boss'} je právě ve městě. Hraj, aby sis udržel diváky.`
    }

    function handleKeyPress(event: KeyboardEvent): void {
        if (event.repeat) return
        if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return

        const note =
            extendedPianoEnabled.value && extendedPianoUnlocked.value
                ? extendedKeyToNote(event.key, event.code)
                : keyToNote(event.key, event.code)
        if (!note) return

        const stage = document.querySelector('.click-area')
        const rect = stage?.getBoundingClientRect()
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

        triggerManualNote(note as string, cx, cy)
    }

    function triggerManualNote(note: string, clientX: number, clientY: number): void {
        playNote(note)
        lastPressedNote.value = note

        if (bossActive.value) return

        if (extendedPianoEnabled.value && extendedPianoUnlocked.value) {
            triggerSing(clientX, clientY)
        } else {
            const allowedNotes = new Set(currentSong.value.melody)
            if (allowedNotes.has(note)) {
                triggerSing(clientX, clientY)
            }
        }
    }

    function sing(event: MouseEvent): void {
        const melody = currentSong.value.melody
        const currentIndex = melodyIndex.value % melody.length
        const note = melody[currentIndex] ?? 'C4'
        melodyIndex.value = (currentIndex + 1) % melody.length
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
        bossIncomingImage.value = resolvePublicPath(pendingBoss.image)
        bossWarningText.value = `${pendingBoss.name} je právě ve městě. Hraj, aby sis udržel diváky.`

        const delay = randomBossDelayMs()
        bossSpawnDelayMs = delay
        bossNextSpawnAt = Date.now() + delay
        updateBossIncomingCountdown()

        bossSpawnTimeout = setTimeout(() => {
            startBossFight(pendingBoss ?? pickRandomBoss())
        }, delay)
    }

    function scheduleRestoredBoss(delayMs: number, profile: BossProfile): void {
        clearBossScheduleTimers()

        if (bossClicksUntilEligible.value > 0) return
        if (bossActive.value) return

        pendingBoss = profile
        bossIncomingName.value = profile.name
        bossIncomingImage.value = resolvePublicPath(profile.image)

        const safeDelay = Math.max(1000, Math.floor(delayMs))
        bossSpawnDelayMs = safeDelay
        bossNextSpawnAt = Date.now() + safeDelay
        updateBossIncomingCountdown()

        bossSpawnTimeout = setTimeout(() => {
            startBossFight(pendingBoss ?? pickRandomBoss())
        }, safeDelay)
    }

    function startBossFight(profile: BossProfile): void {
        if (bossActive.value) return

        if (investors.value <= 0) {
            scheduleNextBoss()
            return
        }

        const investorPressure = Math.floor(Math.sqrt(Math.max(investors.value, 0)) * 3)
        const luckFactor = 0.82 + Math.random() * 0.44
        const baseRequired = 36 + investorPressure
        const requiredClicks = Math.max(
            35,
            Math.min(260, Math.floor(baseRequired * profile.fame * luckFactor))
        )
        const durationSeconds = 21 + Math.floor(Math.random() * 6)



        bossActive.value = true
        clearBossScheduleTimers()
        bossCurrentName.value = profile.name
        bossCurrentImage.value = resolvePublicPath(profile.image)
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

        if (!won) {
            const investorLossRatio = Math.random() < 0.5 ? 0.5 : (2 / 3)
            const investorsBefore = investors.value
            const investorPenalty = Math.floor(investorsBefore * investorLossRatio)
            if (investorPenalty > 0) {
                investors.value = Math.max(0, investorsBefore - investorPenalty)
            }

            const moneyPenalty = roundDownToHalf(money.value * 0.5)
            if (moneyPenalty > 0) {
                money.value = roundDownToHalf(money.value - moneyPenalty)
            }

            const lossMessage = pickRandomMessage(BOSS_LOSS_MESSAGES, defeatedName)
            const moneyPenaltyText = moneyPenalty > 0 ? ` -${roundDownToHalf(moneyPenalty)}$` : ''
            const investorPenaltyText = investorPenalty > 0 ? ` -${investorPenalty} investorů` : ''
            const penaltyText = `${moneyPenaltyText}${investorPenaltyText}`
            showBossResult(`${lossMessage}${penaltyText}`, 'error')
        }

        if (won) {
            bossWins.value++
            boostRewardPending.value = true
            audienceBossRewardUnlockedThisFight.value = AUDIENCE_BOOST_BOSS_REWARD_NAMES.has(defeatedName)
            if (defeatedName === 'Jan Kafka' && Math.random() < JAN_KAFKA_WIN_STEAL_CHANCE) {
                const kafkaPenalty = roundDownToHalf(money.value / 3)
                if (kafkaPenalty > 0) {
                    money.value = roundDownToHalf(money.value - kafkaPenalty)
                }

                const kafkaMessage = 'Jan Kafka byl populárnější. I přes výhru ti dokázal sebrat peníze.'
                const kafkaPenaltyText = kafkaPenalty > 0 ? ` -${kafkaPenalty}$` : ''
                showBossResult(`${kafkaMessage}${kafkaPenaltyText}`, 'error')
            } else {
                const winMessage = pickRandomMessage(BOSS_WIN_MESSAGES, defeatedName)
                showBossResult(winMessage, 'success')
            }
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

        scheduleSaveGame()
        if (restoredPendingBoss && restoredPendingBossRemainingMs !== null) {
            const restoredBoss = restoredPendingBoss
            const restoredDelay = restoredPendingBossRemainingMs
            clearRestoredBoss()
            scheduleRestoredBoss(restoredDelay, restoredBoss)
        } else {
            scheduleNextBoss()
        }
    }

    function buyInvestor(): void {
        if (!spendMoney(investorCost.value)) return

        investors.value++
        maybeUnlockProgressBoosts()
        scheduleSaveGame()
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
        scheduleSaveGame()

        const personDelay = audienceJoinDelaySeconds.value * 1000
        const peopleToAdd = 3 + Math.floor(adLevel.value * 0.35)

        for (let i = 0; i < peopleToAdd; i++) {
            setTimeout(() => {
                if (audience.value < capacity.value) {
                    addAudienceMember()
                    scheduleSaveGame()
                }
            }, i * personDelay)
        }
    }

    function buyEquipment(): void {
        if (!spendMoney(equipmentCost.value)) return

        equipment.value++
        maybeUnlockProgressBoosts()
        scheduleSaveGame()
    }

    function buyHall(): void {
        if (investors.value < hallInvestorRequirement.value) return

        investors.value -= hallInvestorRequirement.value
        const add = Math.max(1, Math.floor(hallCapacityIncrease.value * prestigeMultiplier.value))
        capacity.value += add
        scheduleSaveGame()
    }

    function buyTickets(): void {
        if (!spendMoney(ticketsCost.value)) return

        ticketPrice.value += 2
        maybeUnlockProgressBoosts()
        scheduleSaveGame()
    }

    function buySong(): void {
        if (!hasNextSong.value) return
        if (!spendMoney(nextSongCost.value)) return

        songLevel.value++
        selectedSongIndex.value = songLevel.value
        melodyIndex.value = 0
        scheduleSaveGame()
    }

    function resetAfterPrestige(): void {
        const hadExtendedPianoUnlocked = extendedPianoUnlocked.value
        const wasExtendedPianoEnabled = extendedPianoEnabled.value

        money.value = 0
        investors.value = 0
        equipment.value = 1
        ticketPrice.value = 1
        audience.value = 0
        capacity.value = 10
        adLevel.value = 0
        songLevel.value = 0
        selectedSongIndex.value = 0
        availableBoosts.value = []
        boostClaimMilestones.value = {
            click: 0,
            investor: 0,
            audience: 0
        }
        activeBoosts.value = []
        boostRewardPending.value = false
        audienceBossRewardUnlockedThisFight.value = false
        boostTimeLeftSeconds.value = 0
        audienceMembers.value = []
        melodyIndex.value = 0
        bossActive.value = false
        bossTimeLeftSeconds.value = 0
        bossFightDurationSeconds.value = BOSS_DURATION_SECONDS
        bossClicksRequired.value = 0
        bossClicksDone.value = 0
        bossWarningText.value = ''
        bossIncomingName.value = ''
        bossIncomingImage.value = ''
        bossCurrentName.value = ''
        bossCurrentImage.value = ''
        bossNextInSeconds.value = 0
        bossSpawnProgress.value = 0
        bossResultText.value = ''
        bossResultTone.value = 'success'
        bossWins.value = 0
        pendingBoss = null
        clearBossScheduleTimers()
        lastInteractionAt.value = Date.now()

        extendedPianoUnlockedEver.value = hadExtendedPianoUnlocked
        extendedPianoEnabled.value = wasExtendedPianoEnabled
    }

    function buyPrestige(): void {
        if (prestigeLevel.value >= 2) return
        if (money.value < prestigeCost.value) return
        if (!hasPrestigeSongRequirement.value) return
        if (bossWins.value < 20) return

        prestigeLevel.value += 1
        resetAfterPrestige()
        saveGame()
    }

    function selectSong(index: number): void {
        const maxUnlocked = Math.min(songLevel.value, SONGS.length - 1)
        const safeIndex = Math.floor(index)
        if (safeIndex < 0 || safeIndex > maxUnlocked) return

        selectedSongIndex.value = safeIndex
        melodyIndex.value = 0
        scheduleSaveGame()
    }

    function removeExpiredAudience(): boolean {
        const now = Date.now()
        let changed = false

        audienceMembers.value = audienceMembers.value.filter((member) => {
            if (now < member.leaveTime) return true

            audience.value--
            changed = true
            return false
        })

        return changed
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
        if (audience.value === 0 && audienceMembers.value.length === 0) {
            for (let i = 0; i < 6; i++) {
                addAudienceMember()
            }
            scheduleSaveGame()
        }
        if (maybeUnlockProgressBoosts()) {
            scheduleSaveGame()
        }
        lastAudienceIncomeAt = Date.now()
        lastInvestorIncomeAt = Date.now()

        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('pagehide', handlePageHide)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('keydown', handleKeyPress)

        investorInterval = setInterval(() => {
            const now = Date.now()
            if (
                investorIncome.value > 0 &&
                now - lastInvestorIncomeAt >= investorIncomeIntervalSeconds.value * 1000
            ) {
                addMoney(investorIncome.value)
                lastInvestorIncomeAt = now
                scheduleSaveGame()
            }
        }, 250)

        audienceIncomeInterval = setInterval(() => {
            const now = Date.now()
            if (
                audienceIncome.value > 0 &&
                now - lastAudienceIncomeAt >= audienceIncomeIntervalSeconds.value * 1000
            ) {
                addMoney(audienceIncome.value)
                lastAudienceIncomeAt = now
                scheduleSaveGame()
            }
        }, 1000)

        audienceInterval = setInterval(() => {
            if (removeExpiredAudience()) {
                scheduleSaveGame()
            }
        }, 1000)

        inactivityInterval = setInterval(() => {
            if (!isPlayerActive() && bossActive.value) {
                setBossReengageGate('Boss tě nenašel')
            }

            updateBossIncomingCountdown()
            updateBoostCountdown()
        }, 1000)

        if (restoredPendingBoss && restoredPendingBossRemainingMs !== null) {
            const restoredBoss = restoredPendingBoss
            const restoredDelay = restoredPendingBossRemainingMs
            clearRestoredBoss()
            scheduleRestoredBoss(restoredDelay, restoredBoss)
        } else {
            scheduleNextBoss()
        }
    })

    onUnmounted(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('pagehide', handlePageHide)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('keydown', handleKeyPress)

        if (investorInterval) clearInterval(investorInterval)
        if (audienceIncomeInterval) clearInterval(audienceIncomeInterval)
        if (audienceInterval) clearInterval(audienceInterval)
        if (inactivityInterval) clearInterval(inactivityInterval)
        clearBossScheduleTimers()
        if (bossTickInterval) clearInterval(bossTickInterval)
        if (bossResultTimeout) clearTimeout(bossResultTimeout)
        if (saveTimeout) {
            clearTimeout(saveTimeout)
            saveTimeout = null
        }

        saveGame()
    })

    const boostSlots = computed<BoostSlot[]>(() => {
        return [
            {
                type: 'click',
                label: 'Klik x2',
                icon: 'fa-solid fa-hand-pointer',
                effect: '+100 % za klik',
                tooltip: 'Klik x2: dvojnásobný výdělek z každého kliku na 60 sekund.',
                owned: isBoostAvailable('click'),
                active: activeBoosts.value.includes('click')
            },
            {
                type: 'investor',
                label: 'Investor 1s',
                icon: 'fa-solid fa-handshake',
                effect: 'výplata každou 1s',
                tooltip: 'Investor 1s: investoři vyplácí příjem každou 1 sekundu po dobu 60 sekund. Během boostu navíc +15% výnosu.',
                owned: isBoostAvailable('investor'),
                active: activeBoosts.value.includes('investor')
            },
            {
                type: 'audience',
                label: 'Publikum x2',
                icon: 'fa-solid fa-users',
                effect: '2x lístky a výdrž',
                tooltip: 'Publikum x2: lidé zůstanou 2x déle a lístky vydělají 2x víc po dobu 60 sekund.',
                owned: isBoostAvailable('audience'),
                active: activeBoosts.value.includes('audience')
            }
        ]
    })

    const boostRewardOptions = computed<BoostRewardOption[]>(() => {
        const options: BoostRewardOption[] = [
            {
                type: 'click',
                label: 'Klik x2',
                icon: 'fa-solid fa-hand-pointer',
                effect: '+100 % za klik',
                description: 'Každý klik vydělá 2x víc peněz po dobu 60 sekund.'
            },
            {
                type: 'investor',
                label: 'Investor 1s',
                icon: 'fa-solid fa-handshake',
                effect: 'výplata každou 1s',
                description: 'Investoři budou posílat peníze každou 1 sekundu po dobu 60 sekund. Během boostu navíc +15% výnosu.'
            }
        ]

        if (audienceBossRewardUnlockedThisFight.value) {
            options.push({
                type: 'audience',
                label: 'Publikum x2',
                icon: 'fa-solid fa-users',
                effect: '2x lístky a výdrž',
                description: 'Publikum vydělá 2x víc z lístků a vydrží 2x déle po dobu 60 sekund.'
            })
        }

        return options
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
        hallCapacityIncrease,
        clickPower,
        investorIncome,
        investorIncomeIncreasePerPurchase,
        investorIncomeIntervalSeconds,
        audienceJoinDelaySeconds,
        audienceIncome,
        audienceIncomeIntervalSeconds,
        audienceStaySeconds,
        ticketIncomePerPerson,
        ticketIncomeIncreasePerUpgrade,
        bossWins,
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
        prestigeLevel,
        prestigeBought,
        prestigeMultiplier,
        prestigeCost,
        unlockedSongCount,
        prestigeRequiredSongCount: PRESTIGE_REQUIRED_UNLOCKED_SONGS,
        hasPrestigeSongRequirement,
        extendedPianoEnabled,
        extendedPianoUnlocked,
        totalUpgradeCount,
        setExtendedPianoEnabled,
        hasAllSongs,
        selectSong
    }
}
