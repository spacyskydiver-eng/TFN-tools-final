/* ------------------------------------------------------------------ */
/*  KvK DATA ENGINE v3                                                  */
/*  AP, honor, crystal, reverse-AP, monument chaining, kill planner     */
/* ------------------------------------------------------------------ */

/* ---------- KvK types ---------- */

export const KVK_TYPES = [
  { id: 'kvk1', label: 'Endless War', shortLabel: 'KvK 1', group: 'early' },
  { id: 'kvk2', label: 'Distant Journey', shortLabel: 'KvK 2', group: 'early' },
  { id: 'kvk3', label: 'Light and Darkness', shortLabel: 'KvK 3', group: 'early' },
  { id: 'soc', label: 'Strife of the Eight', shortLabel: 'SoC', group: 'soc' },
  { id: 'heroic', label: 'Heroic Anthem', shortLabel: 'Heroic', group: 'soc' },
] as const

export type KvkTypeId = (typeof KVK_TYPES)[number]['id']

export function isSoC(kvkType: KvkTypeId): boolean {
  return kvkType === 'soc' || kvkType === 'heroic'
}

/* ---------- AP per kill config (admin-editable) ---------- */

export type ApPerKillConfig = {
  barbs: number
  forts: number
  kahar?: number
}

export const DEFAULT_AP_PER_KILL_EARLY: ApPerKillConfig = {
  barbs: 50,
  forts: 150,
}

export const DEFAULT_AP_PER_KILL_SOC: ApPerKillConfig = {
  barbs: 100,
  forts: 300,
  kahar: 190,
}

export function getDefaultApConfig(kvkType: KvkTypeId): ApPerKillConfig {
  return isSoC(kvkType)
    ? { ...DEFAULT_AP_PER_KILL_SOC }
    : { ...DEFAULT_AP_PER_KILL_EARLY }
}

/* ---------- AP split ---------- */

export type ApSplit = {
  barbsPct: number
  fortsPct: number
  kaharPct: number
}

export function defaultApSplit(kvkType: KvkTypeId): ApSplit {
  if (isSoC(kvkType)) {
    return { barbsPct: 40, fortsPct: 30, kaharPct: 30 }
  }
  return { barbsPct: 60, fortsPct: 40, kaharPct: 0 }
}

export function calcKillsFromSplit(
  totalAp: number,
  split: ApSplit,
  apConfig: ApPerKillConfig,
  kvkType: KvkTypeId,
): { barbs: number; forts: number; kahar: number; barbAp: number; fortAp: number; kaharAp: number } {
  const barbAp = Math.floor(totalAp * (split.barbsPct / 100))
  const fortAp = Math.floor(totalAp * (split.fortsPct / 100))
  const kaharAp = isSoC(kvkType) ? Math.floor(totalAp * (split.kaharPct / 100)) : 0

  return {
    barbs: apConfig.barbs > 0 ? Math.floor(barbAp / apConfig.barbs) : 0,
    forts: apConfig.forts > 0 ? Math.floor(fortAp / apConfig.forts) : 0,
    kahar: isSoC(kvkType) && apConfig.kahar && apConfig.kahar > 0 ? Math.floor(kaharAp / apConfig.kahar) : 0,
    barbAp,
    fortAp,
    kaharAp,
  }
}

/* ---------- Barb/Fort level distribution ---------- */

export type BarbLevelDist = {
  '26-30': number
  '31-35': number
  '36-40': number
  '41-45': number
  '46-50': number
  '51-55': number
}

export type FortLevelDist = {
  '6': number
  '7': number
  '8': number
  '9': number
  '10': number
  '11': number
  '12': number
  '13': number
  '14': number
  '15': number
}

export const BARB_LEVEL_KEYS = ['26-30', '31-35', '36-40', '41-45', '46-50', '51-55'] as const
export const FORT_LEVEL_KEYS = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15'] as const

export function defaultBarbDist(): BarbLevelDist {
  return { '26-30': 0, '31-35': 0, '36-40': 10, '41-45': 20, '46-50': 30, '51-55': 40 }
}



/* ---------- Honor point multipliers ---------- */

export const BARB_HONOR_PER_KILL: Record<string, number> = {
  '26-30': 5,
  '31-35': 8,
  '36-40': 10,
  '41-45': 10,
  '46-50': 16,
  '51-55': 20,
}

export const FORT_HONOR_PER_KILL: Record<string, number> = {
  '6': 15,
  '7': 25,
  '8': 35,
  '9': 45,
  '10': 60,
  '11': 30,
  '12': 45,
  '13': 60,
  '14': 80,
  '15': 100,
}

export const KAHAR_HONOR_PER_KILL = 50

/* ---------- Crystal rewards per kill (SoC only) ---------- */

export type CrystalPerKillConfig = {
  barbs: Record<string, number>
  forts: Record<string, number>
}

export const DEFAULT_CRYSTAL_PER_KILL: CrystalPerKillConfig = {
  barbs: {
    '26-30': 0,
    '31-35': 0,
    '36-40': 0,
    '41-45': 400,   // Lv 41-43
    '46-50': 500,   // Lv 47-49 (avg of 450/500)
    '51-55': 600,   // Lv 53-55
  },
  forts: {
    '6': 0,
    '7': 0,
    '8': 0,
    '9': 0,
    '10': 0,
    '11': 2500,
    '12': 2750,
    '13': 3000,
    '14': 3250,
    '15': 3500,  // configurable
  },
}

/* ---------- Honor + Crystal calculations ---------- */

export type HonorBreakdown = {
  barbsByLevel: { key: string; kills: number; honor: number; crystal: number }[]
  fortsByLevel: { key: string; kills: number; honor: number; crystal: number }[]
  kaharHonor: number
  kaharKills: number
  ruinsHonor: number
  altarHonor: number
  eventMilestoneHonor: number
  totalHonor: number
  totalCrystalFromKills: number
  totalCrystalFromEvents: number
  totalCrystal: number
}

export function calcFullHonor(
  totalBarbs: number,
  totalForts: number,
  kaharKills: number,
  barbDist: BarbLevelDist,
  fortDist: FortLevelDist,
  ruinsHonor: number,
  altarHonor: number,
  eventMilestoneHonor: number,
  eventMilestoneCrystal: number,
  crystalConfig: CrystalPerKillConfig,
  showCrystal: boolean,
): HonorBreakdown {
  const barbTotal = Object.values(barbDist).reduce((s, v) => s + v, 0) || 1
  const barbsByLevel = BARB_LEVEL_KEYS.map((key) => {
    const pct = barbDist[key] / barbTotal
    const kills = Math.round(totalBarbs * pct)
    return {
      key,
      kills,
      honor: kills * (BARB_HONOR_PER_KILL[key] ?? 0),
      crystal: showCrystal ? kills * (crystalConfig.barbs[key] ?? 0) : 0,
    }
  })

  const fortTotal = Object.values(fortDist).reduce((s, v) => s + v, 0) || 1
  const fortsByLevel = FORT_LEVEL_KEYS.map((key) => {
    const pct = fortDist[key] / fortTotal
    const kills = Math.round(totalForts * pct)
    return {
      key,
      kills,
      honor: kills * (FORT_HONOR_PER_KILL[key] ?? 0),
      crystal: showCrystal ? kills * (crystalConfig.forts[key] ?? 0) : 0,
    }
  })

  const kaharHonor = kaharKills * KAHAR_HONOR_PER_KILL

  const totalHonor =
    barbsByLevel.reduce((s, b) => s + b.honor, 0) +
    fortsByLevel.reduce((s, f) => s + f.honor, 0) +
    kaharHonor +
    ruinsHonor +
    altarHonor +
    eventMilestoneHonor

  const totalCrystalFromKills =
    barbsByLevel.reduce((s, b) => s + b.crystal, 0) +
    fortsByLevel.reduce((s, f) => s + f.crystal, 0)

  return {
    barbsByLevel,
    fortsByLevel,
    kaharHonor,
    kaharKills,
    ruinsHonor,
    altarHonor,
    eventMilestoneHonor,
    totalHonor,
    totalCrystalFromKills,
    totalCrystalFromEvents: eventMilestoneCrystal,
    totalCrystal: totalCrystalFromKills + eventMilestoneCrystal,
  }
}

/* ---------- Reverse calculator: Honor goal -> required AP ---------- */

export function calcRequiredAp(
  honorGoal: number,
  split: ApSplit,
  apConfig: ApPerKillConfig,
  barbDist: BarbLevelDist,
  fortDist: FortLevelDist,
  kvkType: KvkTypeId,
): number {
  // Weighted honor-per-AP for barbs
  const barbDistTotal = Object.values(barbDist).reduce((s, v) => s + v, 0) || 1
  let barbHonorPerAp = 0
  if (apConfig.barbs > 0) {
    for (const key of BARB_LEVEL_KEYS) {
      const pct = barbDist[key] / barbDistTotal
      barbHonorPerAp += pct * (BARB_HONOR_PER_KILL[key] ?? 0) / apConfig.barbs
    }
  }

  // Weighted honor-per-AP for forts
  const fortDistTotal = Object.values(fortDist).reduce((s, v) => s + v, 0) || 1
  let fortHonorPerAp = 0
  if (apConfig.forts > 0) {
    for (const key of FORT_LEVEL_KEYS) {
      const pct = fortDist[key] / fortDistTotal
      fortHonorPerAp += pct * (FORT_HONOR_PER_KILL[key] ?? 0) / apConfig.forts
    }
  }

  // Kahar honor-per-AP
  const kaharHonorPerAp = isSoC(kvkType) && apConfig.kahar && apConfig.kahar > 0
    ? KAHAR_HONOR_PER_KILL / apConfig.kahar
    : 0

  // Weighted total honor per 1 AP considering split
  const honorPerAp =
    (split.barbsPct / 100) * barbHonorPerAp +
    (split.fortsPct / 100) * fortHonorPerAp +
    (split.kaharPct / 100) * kaharHonorPerAp

  if (honorPerAp <= 0) return 0
  return Math.ceil(honorGoal / honorPerAp)
}

/* ---------- Kill planner: given honor goal + available AP ---------- */

export function calcKillPlan(
  honorGoal: number,
  availableAp: number,
  split: ApSplit,
  apConfig: ApPerKillConfig,
  barbDist: BarbLevelDist,
  fortDist: FortLevelDist,
  kvkType: KvkTypeId,
  crystalConfig: CrystalPerKillConfig,
  showCrystal: boolean,
  ruinsHonor: number,
  altarHonor: number,
  eventMilestoneHonor: number,
  eventMilestoneCrystal: number,
): {
  expectedHonor: number
  deficit: number
  sufficientAp: boolean
  breakdown: HonorBreakdown
} {
  const kills = calcKillsFromSplit(availableAp, split, apConfig, kvkType)
  const breakdown = calcFullHonor(
    kills.barbs, kills.forts, kills.kahar,
    barbDist, fortDist,
    ruinsHonor, altarHonor, eventMilestoneHonor,
    eventMilestoneCrystal, crystalConfig, showCrystal,
  )
  const deficit = Math.max(0, honorGoal - breakdown.totalHonor)
  return {
    expectedHonor: breakdown.totalHonor,
    deficit,
    sufficientAp: breakdown.totalHonor >= honorGoal,
    breakdown,
  }
}

/* ---------- Monument / Chronicles timeline chaining ---------- */

export type MonumentStage = {
  id: string
  name: string
  duration: number         // in days
  description: string
  objectives: string
  rewards: string
  completed: boolean
}

/**
 * Compute chained start days for monument stages.
 * Formula: stage[n].startDay = stage[n-1].startDay + stage[n-1].duration
 * First stage starts at anchorDay (registration start day).
 */
export function chainMonumentStages(
  stages: MonumentStage[],
  anchorDay: number,
): { stage: MonumentStage; startDay: number; endDay: number }[] {
  let currentDay = anchorDay
  return stages.map((stage) => {
    const startDay = currentDay
    const endDay = startDay + stage.duration - 1
    currentDay = startDay + stage.duration
    return { stage, startDay, endDay }
  })
}

/**
 * Check if a stage is completed based on the spreadsheet formula:
 * completed = currentKvkDay >= stageEndDay + 1  (i.e. current time >= event end)
 */
export function isStageAutoCompleted(currentKvkDay: number, stageEndDay: number): boolean {
  return currentKvkDay > stageEndDay
}

/**
 * Get current KvK day number from start date
 */
export function getCurrentKvkDay(startDate: string): number {
  if (!startDate) return 0
  const start = new Date(startDate + 'T00:00:00Z')
  const now = new Date()
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = todayUtc - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}

/* ---------- Ancient Ruins & Altar config ---------- */

export type RuinsAltarConfig = {
  ruinsHonorPerAttend: number
  altarHonorPerAttend: number
}

export const DEFAULT_RUINS_ALTAR_CONFIG: RuinsAltarConfig = {
  ruinsHonorPerAttend: 0,
  altarHonorPerAttend: 0,
}

/* ---------- Event milestone type ---------- */

export type EventMilestone = {
  id: string
  level: number
  honor: number
  crystal: number
  reached: boolean
}

/* ---------- Timeline event type ---------- */

export type KvkTimelineEvent = {
  id: string
  name: string
  startDay: number
  duration: number
  category: 'war-of-conquest' | 'chronicles'
  description: string
  milestones: EventMilestone[]
}

export const EVENT_CATEGORIES = [
  { id: 'war-of-conquest', label: 'War of Conquest' },
  { id: 'chronicles', label: 'Chronicles' },
] as const
/* ---------- Grinding style presets ---------- */

export type GrindingStyle = 'mostly-barbs' | 'balanced' | 'mostly-forts'

export const GRINDING_STYLES: { id: GrindingStyle; label: string; description: string }[] = [
  { id: 'mostly-barbs', label: 'Mostly Barbarians', description: 'Focus AP on barbarian kills for steady honor' },
  { id: 'balanced', label: 'Balanced', description: 'Even split between barbarians and forts' },
  { id: 'mostly-forts', label: 'Mostly Forts', description: 'Focus AP on forts for higher honor per kill' },
]

export function getApSplitFromStyle(style: GrindingStyle, kvkType: KvkTypeId): ApSplit {
  if (isSoC(kvkType)) {
    switch (style) {
      case 'mostly-barbs': return { barbsPct: 55, fortsPct: 15, kaharPct: 30 }
      case 'balanced':     return { barbsPct: 35, fortsPct: 30, kaharPct: 35 }
      case 'mostly-forts': return { barbsPct: 15, fortsPct: 55, kaharPct: 30 }
    }
  }
  switch (style) {
    case 'mostly-barbs': return { barbsPct: 75, fortsPct: 25, kaharPct: 0 }
    case 'balanced':     return { barbsPct: 50, fortsPct: 50, kaharPct: 0 }
    case 'mostly-forts': return { barbsPct: 25, fortsPct: 75, kaharPct: 0 }
  }
}

/* ---------- Level focus presets ---------- */

export type BarbLevelFocus = '26-30' | '31-35' | '36-40' | '41-45' | '46-50' | '51-55'
export type FortLevelFocus = '6-15'

export function getBarbDistFromFocus(focus: BarbLevelFocus): BarbLevelDist {
  // Concentrate kills around the selected level range with falloff
  const weights: Record<BarbLevelFocus, BarbLevelDist> = {
    '26-30': { '26-30': 60, '31-35': 25, '36-40': 10, '41-45': 5, '46-50': 0, '51-55': 0 },
    '31-35': { '26-30': 10, '31-35': 55, '36-40': 25, '41-45': 10, '46-50': 0, '51-55': 0 },
    '36-40': { '26-30': 0, '31-35': 10, '36-40': 55, '41-45': 25, '46-50': 10, '51-55': 0 },
    '41-45': { '26-30': 0, '31-35': 0, '36-40': 10, '41-45': 55, '46-50': 25, '51-55': 10 },
    '46-50': { '26-30': 0, '31-35': 0, '36-40': 0, '41-45': 10, '46-50': 55, '51-55': 35 },
    '51-55': { '26-30': 0, '31-35': 0, '36-40': 0, '41-45': 0, '46-50': 25, '51-55': 75 },
  }
  return weights[focus]
}

export function getDefaultFortDist(): FortLevelDist {
  return { '6': 0, '7': 0, '8': 0, '9': 5, '10': 15, '11': 10, '12': 15, '13': 20, '14': 20, '15': 15 }
}
/* ---------- Saved KvK run type ---------- */

export type KvkRun = {
  id: string
  name: string
  kvkType: KvkTypeId
  startDate: string
  kvkDurationDays: number
  createdAt: number
  totalAp: number
  apSplit: ApSplit
  apConfig: ApPerKillConfig
  barbDist: BarbLevelDist
  fortDist: FortLevelDist
  ruinsAltarConfig: RuinsAltarConfig
  crystalConfig: CrystalPerKillConfig
  timelineEvents: KvkTimelineEvent[]
  monumentStages: MonumentStage[]
  monumentAnchorDay: number
  ruinsAttended: number
  altarAttended: number
  honorGoal: number
  grindingStyle: GrindingStyle
  barbLevelFocus: BarbLevelFocus
  // KP Calculator
kpData: KpData
commanderPrep: CommanderPrepData
}

export function createNewKvkRun(kvkType: KvkTypeId, startDate: string, name?: string): KvkRun {
  const defaultStyle: GrindingStyle = 'balanced'
  const defaultFocus: BarbLevelFocus = '41-45'
  return {
    id: `kvk-${Date.now()}`,
    name: name || `${KVK_TYPES.find((t) => t.id === kvkType)?.label ?? 'KvK'} - ${startDate}`,
    kvkType,
    startDate,
    kvkDurationDays: 60,
    createdAt: Date.now(),
    totalAp: 0,
    apSplit: getApSplitFromStyle(defaultStyle, kvkType),
    apConfig: getDefaultApConfig(kvkType),
    barbDist: getBarbDistFromFocus(defaultFocus),
    fortDist: getDefaultFortDist(),
    ruinsAltarConfig: { ...DEFAULT_RUINS_ALTAR_CONFIG },
    crystalConfig: { ...DEFAULT_CRYSTAL_PER_KILL, barbs: { ...DEFAULT_CRYSTAL_PER_KILL.barbs }, forts: { ...DEFAULT_CRYSTAL_PER_KILL.forts } },
    timelineEvents: [],
    monumentStages: [],
    monumentAnchorDay: 1,
    ruinsAttended: 0,
    altarAttended: 0,
    honorGoal: 0,
    grindingStyle: defaultStyle,
    barbLevelFocus: defaultFocus,
    kpData: createDefaultKpData(),
    commanderPrep: createDefaultCommanderPrep(),
  }
}



/* ---------- Smart grind suggestion ---------- */

export type GrindSuggestion = {
  barbKills: number
  fortKills: number
  kaharKills: number
  barbApUsed: number
  fortApUsed: number
  kaharApUsed: number
  estimatedHonor: number
  deficit: number
  sufficient: boolean
}

export function calcSmartGrindSuggestion(
  totalAp: number,
  split: ApSplit,
  apConfig: ApPerKillConfig,
  barbDist: BarbLevelDist,
  fortDist: FortLevelDist,
  kvkType: KvkTypeId,
  honorGoal: number,
  ruinsHonor: number,
  altarHonor: number,
  eventMilestoneHonor: number,
): GrindSuggestion {
  const kills = calcKillsFromSplit(totalAp, split, apConfig, kvkType)

  // Calculate honor from kills using distribution
  const barbDistTotal = Object.values(barbDist).reduce((s, v) => s + v, 0) || 1
  let barbHonor = 0
  for (const key of BARB_LEVEL_KEYS) {
    const pct = barbDist[key] / barbDistTotal
    barbHonor += Math.round(kills.barbs * pct) * (BARB_HONOR_PER_KILL[key] ?? 0)
  }

  const fortDistTotal = Object.values(fortDist).reduce((s, v) => s + v, 0) || 1
  let fortHonor = 0
  for (const key of FORT_LEVEL_KEYS) {
    const pct = fortDist[key] / fortDistTotal
    fortHonor += Math.round(kills.forts * pct) * (FORT_HONOR_PER_KILL[key] ?? 0)
  }

  const kaharHonor = kills.kahar * KAHAR_HONOR_PER_KILL
  const estimatedHonor = barbHonor + fortHonor + kaharHonor + ruinsHonor + altarHonor + eventMilestoneHonor
  const deficit = Math.max(0, honorGoal - estimatedHonor)

  return {
    barbKills: kills.barbs,
    fortKills: kills.forts,
    kaharKills: kills.kahar,
    barbApUsed: kills.barbAp,
    fortApUsed: kills.fortAp,
    kaharApUsed: kills.kaharAp,
    estimatedHonor,
    deficit,
    sufficient: estimatedHonor >= honorGoal,
  }
}

/* ================================================================ */
/*  KILL POINTS (KP) ENGINE                                         */
/* ================================================================ */

export const KP_PER_KILL: Record<string, number> = {
  t1: 0.2,
  t2: 2,
  t3: 4,
  t4: 10,
  t5: 20,
}

export const KP_TIER_LABELS: Record<string, string> = {
  t1: 'T1',
  t2: 'T2',
  t3: 'T3',
  t4: 'T4',
  t5: 'T5',
}

export const KP_TIER_KEYS = ['t1', 't2', 't3', 't4', 't5'] as const
export type KpTierKey = (typeof KP_TIER_KEYS)[number]

export type KpTierKills = Record<KpTierKey, number>
export type KpTierPct = Record<KpTierKey, number>

export type KpDataType = {
  tierKills: KpTierKills
  kpGoal: number
  currentKp: number
  daysRemaining: number
  mixedPlan: KpTierPct
}

export function createDefaultKpData(): KpDataType {
  return {
    tierKills: { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 },
    kpGoal: 0,
    currentKp: 0,
    daysRemaining: 30,
    mixedPlan: { t1: 0, t2: 0, t3: 20, t4: 40, t5: 40 },
  }
}

export function calcKpFromKills(kills: KpTierKills): { perTier: Record<KpTierKey, number>; total: number } {
  const perTier = {} as Record<KpTierKey, number>
  let total = 0
  for (const key of KP_TIER_KEYS) {
    const kp = kills[key] * KP_PER_KILL[key]
    perTier[key] = kp
    total += kp
  }
  return { perTier, total }
}
export const WOF_MILESTONES = [
  { spins: 10, heads: 5 },
  { spins: 25, heads: 5 },
  { spins: 45, heads: 10 },
  { spins: 70, heads: 10 },
  { spins: 100, heads: 15 },
]
export function calcWofMilestoneHeads(spins: number): number {
  let total = 0

  for (const m of WOF_MILESTONES) {
    if (spins >= m.spins) {
      total += m.heads
    }
  }

  return total
}

export function calcKillsForKpGoal(kpGoal: number): Record<KpTierKey, number> {
  const result = {} as Record<KpTierKey, number>
  for (const key of KP_TIER_KEYS) {
    result[key] = Math.ceil(kpGoal / KP_PER_KILL[key])
  }
  return result
}

export function calcMixedKpPlan(kpGoal: number, pcts: KpTierPct): Record<KpTierKey, { kpShare: number; killsNeeded: number }> {
  const totalPct = Object.values(pcts).reduce((s, v) => s + v, 0) || 1
  const result = {} as Record<KpTierKey, { kpShare: number; killsNeeded: number }>
  for (const key of KP_TIER_KEYS) {
    const share = kpGoal * (pcts[key] / totalPct)
    result[key] = {
      kpShare: share,
      killsNeeded: KP_PER_KILL[key] > 0 ? Math.ceil(share / KP_PER_KILL[key]) : 0,
    }
  }
  return result
}

/* ================================================================ */
/*  COMMANDER PREPARATION ENGINE                                     */
/* ================================================================ */

export type CommanderSkillSet = [number, number, number, number]

export type CommanderDef = {
  id: string
  name: string
  rarity: 'legendary' | 'epic'
  headsPerSkill: number[]  // heads needed per level for each skill (cumulative for simplicity: total heads per skill level 1-5)
}

// Legendary commander: 10/20/30/40/50 heads per skill level = total to max one skill = 150
// We store total heads to reach each skill level from 0
export const HEADS_PER_SKILL_LEVEL_LEGENDARY = [10, 20, 30, 40, 50] // level 1=10, level 2=20 more, etc.
export const HEADS_PER_SKILL_LEVEL_EPIC = [5, 10, 15, 20, 25]

export const COMMANDER_PRESETS: CommanderDef[] = [
  { id: 'legendary-generic', name: 'Legendary Commander', rarity: 'legendary', headsPerSkill: HEADS_PER_SKILL_LEVEL_LEGENDARY },
  { id: 'epic-generic', name: 'Epic Commander', rarity: 'epic', headsPerSkill: HEADS_PER_SKILL_LEVEL_EPIC },
]

export function calcHeadsNeeded(
  headsPerLevel: number[],
  currentLevels: CommanderSkillSet,
  targetLevels: CommanderSkillSet,
): { invested: number; needed: number; total: number } {
  let invested = 0
  let needed = 0
  for (let i = 0; i < 4; i++) {
    for (let lv = 0; lv < currentLevels[i]; lv++) {
      invested += headsPerLevel[lv] ?? 0
    }
    for (let lv = currentLevels[i]; lv < targetLevels[i]; lv++) {
      needed += headsPerLevel[lv] ?? 0
    }
  }
  return { invested, needed, total: invested + needed }
}

/* --- VIP Gold Head Income --- */

export const VIP_HEADS_PER_DAY: Record<number, number> = {
  0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  10: 1, 11: 1, 12: 2, 13: 2, 14: 3, 15: 4, 16: 4, 17: 5,
}

/* --- Wheel of Fortune --- */

// Average INCLUDING milestone chests
export const WOF_AVG_HEADS_PER_SPIN = 0.47 // community average from data
export const WOF_GEMS_PER_SPIN = 800 // legacy alias for regular price
export const WOF_EXPECTED_VALUE_PER_SPIN = 612 // expected value per spin (w/ chest)
export const WOF_EVENT_DAYS = 3

// Pricing tiers (per event)
export const WOF_FREE_SPINS_PER_DAY = 1
export const WOF_FREE_SPINS_TOTAL = WOF_FREE_SPINS_PER_DAY * WOF_EVENT_DAYS // 3

export const WOF_DISCOUNT_SINGLE_GEMS = 400 // 50% off, 1 per day
export const WOF_DISCOUNT_SINGLE_PER_DAY = 1
export const WOF_DISCOUNT_SINGLE_TOTAL = WOF_DISCOUNT_SINGLE_PER_DAY * WOF_EVENT_DAYS // 3

export const WOF_DISCOUNT_5PACK_GEMS = 3600 // 10% off, 1 pack per day
export const WOF_DISCOUNT_5PACK_SPINS = 5
export const WOF_DISCOUNT_5PACK_PER_DAY = 1
export const WOF_DISCOUNT_5PACK_TOTAL = WOF_DISCOUNT_5PACK_PER_DAY * WOF_EVENT_DAYS // 3 packs = 15 spins

export const WOF_REGULAR_SINGLE_GEMS = 800 // full price per spin

// Purchase bundles (real money, stock: 1 each)
export type WofBundle = {
  id: string
  name: string
  spins: number
  bonusGems: number
  label: string
}

export const WOF_BUNDLES: WofBundle[] = [
  { id: 'stw1', name: 'Spin to Win I', spins: 5, bonusGems: 1050, label: '5 spins + 1,050 gems' },
  { id: 'stw2', name: 'Spin to Win II', spins: 10, bonusGems: 2200, label: '10 spins + 2,200 gems' },
  { id: 'stw3', name: 'Spin to Win III', spins: 15, bonusGems: 4600, label: '15 spins + 4,600 gems' },
  { id: 'stw4', name: 'Spin to Win IV', spins: 25, bonusGems: 12000, label: '25 spins + 12,000 gems' },
  { id: 'stw5', name: 'Spin to Win V', spins: 45, bonusGems: 25000, label: '45 spins + 25,000 gems' },
]

export type WofPlanInput = {
  targetSpins: number
  useBundles: Record<string, boolean> // bundle id -> enabled
}

export type WofPlanResult = {
  totalSpins: number
  freeSpins: number
  discountSingleSpins: number
  discountSingleGems: number
  discount5PackCount: number
  discount5PackSpins: number
  discount5PackGems: number
  regularSpins: number
  regularGems: number
  bundleSpins: number
  bundleBonusGems: number
  bundleNames: string[]
  totalGemCost: number
  expectedHeads: number
  expectedValue: number
  costPerHead: number
}
export type KpData = KpDataType

/**
 * Calculate WoF spin cost breakdown with accurate tiered pricing.
 *
 * Allocation order (strict):
 *   1. Free spins         — 3 total (1/day x 3 days)
 *   2. Discount singles   — up to 3 at 400 gems each (50% off, 1/day x 3 days)
 *   3. Discount 5-packs   — only FULL packs, up to 3 packs at 3,600 gems each
 *   4. Regular spins      — 800 gems each, unlimited
 *
 * Bundle spins (real-money) are subtracted from the total target BEFORE
 * gem-cost tiers are applied, so they reduce how many gems you need.
 *
 * Verified examples:
 *   7 spins  -> 3 free, 3 discount singles (1,200), 1 regular (800)       = 2,000 gems
 *   10 spins -> 3 free, 3 discount singles (1,200), 4 regular (3,200)     = 4,400 gems
 *   11 spins -> 3 free, 3 discount singles (1,200), 1 pack of 5 (3,600)   = 4,800 gems
 *   25 spins -> 3 free, 3 singles (1,200), 3 packs of 5 = 15 (10,800), 4 regular (3,200) = 15,200 gems
 */
export function calcWofPlan(input: WofPlanInput): WofPlanResult {
  let remaining = input.targetSpins

  // Bundle spins are subtracted first (real-money, no gem cost)
  let bundleSpins = 0
  let bundleBonusGems = 0
  const bundleNames: string[] = []
  for (const bundle of WOF_BUNDLES) {
    if (input.useBundles[bundle.id]) {
      bundleSpins += bundle.spins
      bundleBonusGems += bundle.bonusGems
      bundleNames.push(bundle.name)
    }
  }
  remaining = Math.max(0, remaining - bundleSpins)

  // Step 1 — Free spins (3 total)
  const freeSpins = Math.min(remaining, WOF_FREE_SPINS_TOTAL)
  remaining -= freeSpins

  // Step 2 — Discount singles at 400 gems (up to 3)
  const discountSingleSpins = Math.min(remaining, WOF_DISCOUNT_SINGLE_TOTAL)
  const discountSingleGems = discountSingleSpins * WOF_DISCOUNT_SINGLE_GEMS
  remaining -= discountSingleSpins

// Step 3 — Use as many 5-packs as possible (spreadsheet logic)
const discount5PackCount = Math.floor(
  remaining / WOF_DISCOUNT_5PACK_SPINS
)

const discount5PackSpins =
  discount5PackCount * WOF_DISCOUNT_5PACK_SPINS

const discount5PackGems =
  discount5PackSpins * 720 // 3600 / 5

remaining -= discount5PackSpins

  // Step 4 — Regular spins at 800 gems each
  const regularSpins = remaining
  const regularGems = regularSpins * WOF_REGULAR_SINGLE_GEMS

  // Totals
  const totalSpins = freeSpins + bundleSpins + discountSingleSpins + discount5PackSpins + regularSpins
  const totalGemCost = discountSingleGems + discount5PackGems + regularGems
  const spinHeads = totalSpins * WOF_AVG_HEADS_PER_SPIN
const milestoneHeads = calcWofMilestoneHeads(totalSpins)

const expectedHeads = spinHeads + milestoneHeads

  const expectedValue = totalSpins * WOF_EXPECTED_VALUE_PER_SPIN
  const costPerHead = expectedHeads > 0 ? Math.round(totalGemCost / expectedHeads) : 0

  return {
    totalSpins,
    freeSpins,
    discountSingleSpins,
    discountSingleGems,
    discount5PackCount,
    discount5PackSpins,
    discount5PackGems,
    regularSpins,
    regularGems,
    bundleSpins,
    bundleBonusGems,
    bundleNames,
    totalGemCost,
    expectedHeads,
    expectedValue,
    costPerHead,
  }
}

/** Simple legacy helper: estimate spins needed for a target head count */
export function calcWofEstimate(targetHeads: number): { spins: number; gems: number } {
  if (targetHeads <= 0) return { spins: 0, gems: 0 }
  const spins = Math.ceil(targetHeads / WOF_AVG_HEADS_PER_SPIN)
  const plan = calcWofPlan({ targetSpins: spins, useBundles: {} })
  return { spins: plan.totalSpins, gems: plan.totalGemCost }
}
/* --- Wheel milestone expected heads (from spreadsheet) --- */
/*
   Values derived from your spreadsheet's
   "Expected Heads (with chest)" column.

   milestoneHeads = totalHeads - (spins * avgHeadsPerSpin)
*/

export const WOF_MILESTONE_EXPECTED_HEADS: Record<number, number> = {
  10: 5.0,   // ~9.7 total - spins contribution
  25: 10.0,
  45: 20.0,
  70: 30.0,
  100: 45.0,
}
function calcMilestoneHeads(spins: number): number {
  let total = 0

  for (const [milestone, heads] of Object.entries(WOF_MILESTONE_EXPECTED_HEADS)) {
    const threshold = Number(milestone)
    if (spins >= threshold) {
      total += heads
    }
  }

  return total
}

/** Quick-reference table of common spin counts and their costs (verified against spreadsheet) */
export const WOF_REFERENCE_TABLE = [
  { spins: 1, cost: 0, expectedHeads: 0.47, notes: '1 free spin' },
  { spins: 2, cost: 0, expectedHeads: 0.94, notes: '2 free spins' },
  { spins: 3, cost: 0, expectedHeads: 1.41, notes: '3 free spins (1/day)' },
  { spins: 4, cost: 400, expectedHeads: 1.88, notes: '3 free + 1 discount single' },
  { spins: 5, cost: 800, expectedHeads: 2.35, notes: '3 free + 2 discount singles' },
  { spins: 6, cost: 1200, expectedHeads: 2.82, notes: '3 free + 3 discount singles' },
  { spins: 7, cost: 2000, expectedHeads: 3.29, notes: '3 free + 3 discount + 1 regular' },
  { spins: 10, cost: 4400, expectedHeads: 4.70, notes: '3 free + 3 discount + 4 regular' },
  { spins: 11, cost: 4800, expectedHeads: 5.17, notes: '3 free + 3 discount + 1 five-pack' },
  { spins: 25, cost: 15200, expectedHeads: 11.75, notes: '3 free + 3 singles + 3 packs + 4 regular' },
  { spins: 45, cost: 29600, expectedHeads: 21.15, notes: '3 free + 3 singles + 7 packs + 4 regular' },
  { spins: 70, cost: 47600, expectedHeads: 32.90, notes: '3 free + 3 singles + 12 packs + 4 regular' },
  { spins: 100, cost: 69200, expectedHeads: 47.00, notes: '3 free + 3 singles + 18 packs + 4 regular' },
]

/* --- Event / Bundle Head Income --- */

export type HeadIncomeSource = {
  id: string
  name: string
  headsAvailable: number
  enabled: boolean
}

export const DEFAULT_HEAD_INCOME_SOURCES: HeadIncomeSource[] = [
  { id: 'mge', name: 'Mightiest Governor', headsAvailable: 0, enabled: false },

  { id: 'aoo', name: 'Ark of Osiris', headsAvailable: 10, enabled: false },

  { id: 'olympia', name: 'Champions of Olympia', headsAvailable: 2, enabled: false },

  { id: 'mtg', name: 'More Than Gems', headsAvailable: 10, enabled: false },

  { id: 'esmeralda', name: 'Esmeralda Wheel', headsAvailable: 10, enabled: false },

  { id: 'silkroad', name: 'Silk Road Event', headsAvailable: 5, enabled: false },

  { id: 'history', name: 'Writer of History Bundle', headsAvailable: 10, enabled: false },

  { id: 'livinglegend', name: 'Living Legend Bundle (Daily)', headsAvailable: 7, enabled: false },
]


/* ================================================================ */
/*  GOLD HEAD INCOME PLANNER (Recurring Events + Custom + Bundles)   */
/* ================================================================ */

export type RecurrenceUnit = 'days' | 'weeks'

export type PlannedOutcome = 'unknown' | 'win' | 'loss' | 'complete' | 'skip'

export type RecurringGhEventId =
  | 'ark'
  | 'olympia'
  | 'mtg'
  | 'esmeralda'
  | 'silkroad'

export type RecurringGhEventDef = {
  id: RecurringGhEventId
  name: string
  global: boolean
  enabledByDefault: boolean
  interval: number
  unit: RecurrenceUnit
  // heads depends on outcome (Ark), or fixed (Olympia)
  headsForOutcome: Record<PlannedOutcome, number>
  // if user never logs, what should we assume for projection?
  defaultOutcome: PlannedOutcome
  // if seasonal, only count when enabled by user
  seasonalOnly?: boolean
}

export const DEFAULT_RECURRING_GH_EVENTS: RecurringGhEventDef[] = [
  {
    id: 'ark',
    name: 'Ark of Osiris',
    global: true,
    enabledByDefault: true,
    interval: 2,
    unit: 'weeks',
    headsForOutcome: { win: 10, loss: 5, unknown: 0, complete: 0, skip: 0 },
    defaultOutcome: 'win', // user can change per occurrence
  },
  {
    id: 'olympia',
    name: 'Champions of Olympia',
    global: true,
    enabledByDefault: true,
    interval: 1,
    unit: 'weeks',
    headsForOutcome: { complete: 2, skip: 0, unknown: 0, win: 0, loss: 0 },
    defaultOutcome: 'complete',
  },
  {
    id: 'mtg',
    name: 'More Than Gems',
    global: true,
    enabledByDefault: false,
    interval: 2,
    unit: 'weeks',
    headsForOutcome: { complete: 0, skip: 0, unknown: 0, win: 0, loss: 0 },
    defaultOutcome: 'complete',
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda Wheel',
    global: false,
    enabledByDefault: false,
    interval: 2,
    unit: 'weeks',
    headsForOutcome: { complete: 0, skip: 0, unknown: 0, win: 0, loss: 0 },
    defaultOutcome: 'complete',
    seasonalOnly: true,
  },
  {
    id: 'silkroad',
    name: 'Silk Road',
    global: true,
    enabledByDefault: false,
    interval: 2,
    unit: 'weeks',
    headsForOutcome: { complete: 0, skip: 0, unknown: 0, win: 0, loss: 0 },
    defaultOutcome: 'complete',
  },
]

export type GhEventOccurrence = {
  id: string
  eventId: RecurringGhEventId | 'custom'
  name: string
  dayOffset: number // day number from today (0..daysUntilGoal)
  plannedOutcome: PlannedOutcome
}

export type CustomGhEvent = {
  id: string
  name: string
  heads: number
  dayOffset: number // one-time custom event
  enabled: boolean
}

export type BundlePlan = {
  writeOfHistoryCount: number // one-time purchases (10 heads each)
  livingLegend50PerDay: number // 0..1 per day
  livingLegend100PerDay: number // 0..3 per day
}

/** interval (weeks/days) -> intervalDays */
export function toIntervalDays(interval: number, unit: RecurrenceUnit): number {
  return unit === 'weeks' ? interval * 7 : interval
}

/** Generate occurrences from 0..daysUntilGoal (inclusive) */
export function buildGhOccurrences(
  daysUntilGoal: number,
  defs: RecurringGhEventDef[],
  enabled: Record<string, boolean>,
  overrides?: Record<string, PlannedOutcome[]>, // optional per-event outcomes
): GhEventOccurrence[] {
  const out: GhEventOccurrence[] = []

  for (const def of defs) {
    if (!enabled[def.id]) continue

    const every = toIntervalDays(def.interval, def.unit)
    if (every <= 0) continue

    // assume next occurrence is "every" days from now (simple + predictable)
    // if you later want “next Saturday”, you can add a startOffset param.
    let idx = 0
    for (let day = every; day <= daysUntilGoal; day += every) {
      const planned = overrides?.[def.id]?.[idx] ?? def.defaultOutcome
      out.push({
        id: `${def.id}-${day}-${idx}`,
        eventId: def.id,
        name: def.name,
        dayOffset: day,
        plannedOutcome: planned,
      })
      idx++
    }
  }

  return out.sort((a, b) => a.dayOffset - b.dayOffset)
}

export function calcHeadsFromOccurrences(
  defs: RecurringGhEventDef[],
  occ: GhEventOccurrence[],
): number {
  const defMap = new Map(defs.map((d) => [d.id, d]))
  let total = 0

  for (const o of occ) {
    const def = defMap.get(o.eventId as RecurringGhEventId)
    if (!def) continue
    total += def.headsForOutcome[o.plannedOutcome] ?? 0
  }
  return total
}

export function calcBundleHeads(daysUntilGoal: number, plan: BundlePlan): number {
  const writeOfHistoryHeads = plan.writeOfHistoryCount * 10
  const livingLegendHeads =
    daysUntilGoal * (plan.livingLegend50PerDay * 1 + plan.livingLegend100PerDay * 2)

  return writeOfHistoryHeads + livingLegendHeads
}


/* --- Commander Prep Data --- */

export type CommanderPrepDataType = {
  commanderName: string
  commanderType: 'legendary' | 'epic'
  currentSkills: CommanderSkillSet
  targetSkills: CommanderSkillSet
  vipLevel: number
  headIncomeSources: HeadIncomeSource[]
  wofTargetHeads: number
  currentGems: number
  dailyGemIncome: number
  daysUntilGoal: number
  recurringGhEnabled: Record<string, boolean>
  recurringGhOutcomeOverrides: Record<string, PlannedOutcome[]>
  customGhEvents: CustomGhEvent[]
  bundlePlan: BundlePlan
}

// Legacy alias for backward compatibility
export type CommanderPrepData = CommanderPrepDataType

export function createDefaultCommanderPrep(): CommanderPrepDataType {
  const recurringEnabled: Record<string, boolean> = {}
  for (const ev of DEFAULT_RECURRING_GH_EVENTS) {
    recurringEnabled[ev.id] = ev.enabledByDefault
  }

  return {
    commanderName: '',
    commanderType: 'legendary',
    currentSkills: [5, 1, 1, 1],
    targetSkills: [5, 5, 1, 1],
    vipLevel: 10,

    // Keep ONLY MGE manual source (default 0)
    headIncomeSources: DEFAULT_HEAD_INCOME_SOURCES.map((s) => ({ ...s })),

    wofTargetHeads: 0,
    currentGems: 0,
    dailyGemIncome: 0,

    daysUntilGoal: 30,

    recurringGhEnabled: recurringEnabled,
    recurringGhOutcomeOverrides: {},
    customGhEvents: [],

    bundlePlan: {
      writeOfHistoryCount: 0,
      livingLegend50PerDay: 0,
      livingLegend100PerDay: 0,
    },
  }
}


/** Calculate total milestone honor from events where milestones are reached */
export function calcEventMilestoneHonor(events: KvkTimelineEvent[]): number {
  return events.reduce(
    (sum, ev) =>
      sum + ev.milestones.filter((m) => m.reached).reduce((s, m) => s + m.honor, 0),
    0,
  )
}

/** Calculate total milestone crystals from events where milestones are reached */
export function calcEventMilestoneCrystal(events: KvkTimelineEvent[]): number {
  return events.reduce(
    (sum, ev) =>
      sum + ev.milestones.filter((m) => m.reached).reduce((s, m) => s + m.crystal, 0),
    0,
  )
}
/* ================================================================ */
/*  CALENDAR → GOLD HEAD ENGINE                                     */
/* ================================================================ */

export type CalendarEventLite = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  category: string
  color: string
}

function loadCalendarEvents(): CalendarEventLite[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem('rok_calendar_events')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function calcHeadsFromCalendar(daysUntilGoal: number): number {
  const events = loadCalendarEvents()

  const now = new Date()
  const goal = new Date(now.getTime() + daysUntilGoal * 86400000)

  let total = 0

  for (const ev of events) {
    const start = new Date(ev.startDate)

    // skip events outside goal range
    if (start > goal) continue

    switch (ev.category) {
      case 'Ark of Osiris':
        total += 10
        break

      case 'Champions of Olympia':
        // weekly event
        total += Math.floor(daysUntilGoal / 7) * 2
        break

      case 'More Than Gems':
        total += 10
        break

      case 'Esmeralda Wheel':
        total += 5
        break

      case 'Silk Road':
        total += 5
        break
    }
  }

  return total
}
export function mapCalendarEventToRecurringId(title: string): RecurringGhEventId | null {
  const t = title.toLowerCase()
  if (t.includes('ark of osiris') || t.includes('aoo')) return 'ark'
  if (t.includes('olympia')) return 'olympia'
  if (t.includes('more than gems') || t.includes('mtg')) return 'mtg'
  if (t.includes('esmeralda')) return 'esmeralda'
  if (t.includes('silk road')) return 'silkroad'
  return null
}
