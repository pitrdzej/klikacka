export type FloatingText = { id: number; x: number; y: number; amount: number }

export type AudienceMember = {
  id: number
  joinTime: number
  leaveTime: number
  hue: number
}

export type BoostType = 'click' | 'investor' | 'audience'
export type BoostClaimMilestones = Record<BoostType, number>
export type BoostTimers = Record<BoostType, number>

export type Song = {
  name: string
  melody: string[]
}

export type BossProfile = {
  name: string
  fame: number
  image: string
}

export type BossResultTone = 'success' | 'error'

export type GameState = {
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
  availableBoosts?: BoostType[]
  unlockedBoosts?: BoostType[]
  boostClaimMilestones?: Partial<BoostClaimMilestones>
  activeBoosts?: BoostType[]
  boostRemainingByTypeMs?: Partial<Record<BoostType, number>>
  activeBoost?: BoostType
  boostRemainingMs?: number
  lastSeenAt?: number
  prestigeLevel?: number
  prestigeBought?: boolean
  extendedPianoEnabled?: boolean
  extendedPianoUnlocked?: boolean
}

export type BoostSlot = {
  type: BoostType
  label: string
  icon: string
  effect: string
  tooltip: string
  owned: boolean
  active: boolean
}

export type BoostRewardOption = {
  type: BoostType
  label: string
  icon: string
  effect: string
  description: string
}
