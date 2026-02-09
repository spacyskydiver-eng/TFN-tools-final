/* ================================================================== */
/*  TROOP TRAINING DATA                                                */
/*  All costs, times, power values, and point values for RoK troops    */
/* ================================================================== */

export type TroopType = 'infantry' | 'archer' | 'cavalry' | 'siege'
export type Tier = 1 | 2 | 3 | 4 | 5

export interface TroopStats {
  tier: Tier
  power: number
  /** Base training time per troop in seconds (before speed bonus) */
  baseTime: number
  food: number
  wood: number
  stone: number
  gold: number
  /** MGE points per troop trained from scratch */
  mgePoints: number
  /** KvK Crusade points per troop */
  kvkPoints: number
}

export interface UpgradeStats {
  fromTier: Tier
  toTier: Tier
  /** Power gained per troop upgraded */
  powerGain: number
  baseTime: number
  food: number
  wood: number
  stone: number
  gold: number
  mgePoints: number
  kvkPoints: number
}

/* ------------------------------------------------------------------ */
/*  TRAINING FROM SCRATCH (per troop)                                  */
/* ------------------------------------------------------------------ */

const TROOP_STATS: Record<Tier, TroopStats> = {
  1: {
    tier: 1,
    power: 2,
    baseTime: 10,
    food: 50,
    wood: 50,
    stone: 0,
    gold: 0,
    mgePoints: 1,
    kvkPoints: 1,
  },
  2: {
    tier: 2,
    power: 8,
    baseTime: 25,
    food: 150,
    wood: 150,
    stone: 50,
    gold: 0,
    mgePoints: 4,
    kvkPoints: 4,
  },
  3: {
    tier: 3,
    power: 24,
    baseTime: 60,
    food: 450,
    wood: 450,
    stone: 200,
    gold: 50,
    mgePoints: 12,
    kvkPoints: 12,
  },
  4: {
    tier: 4,
    power: 60,
    baseTime: 120,
    food: 1000,
    wood: 1000,
    stone: 600,
    gold: 200,
    mgePoints: 30,
    kvkPoints: 30,
  },
  5: {
    tier: 5,
    power: 100,
    baseTime: 180,
    food: 1500,
    wood: 1500,
    stone: 1000,
    gold: 500,
    mgePoints: 50,
    kvkPoints: 50,
  },
}

/* ------------------------------------------------------------------ */
/*  UPGRADE COSTS (per troop)                                          */
/*  e.g. T4->T5 means upgrading a T4 troop to T5                     */
/* ------------------------------------------------------------------ */

function makeUpgrade(from: Tier, to: Tier): UpgradeStats {
  const fromStats = TROOP_STATS[from]
  const toStats = TROOP_STATS[to]
  return {
    fromTier: from,
    toTier: to,
    powerGain: toStats.power - fromStats.power,
    baseTime: Math.round(toStats.baseTime * 0.75),
    food: Math.round((toStats.food - fromStats.food) * 0.8),
    wood: Math.round((toStats.wood - fromStats.wood) * 0.8),
    stone: Math.round((toStats.stone - fromStats.stone) * 0.8),
    gold: Math.round((toStats.gold - fromStats.gold) * 0.8),
    mgePoints: Math.round(toStats.mgePoints * 0.7),
    kvkPoints: Math.round(toStats.kvkPoints * 0.7),
  }
}

/* Pre-compute all upgrade paths */
const UPGRADE_PATHS: Record<string, UpgradeStats> = {
  '4->5': makeUpgrade(4, 5),
  '3->5': { ...makeUpgrade(3, 5), baseTime: 200, mgePoints: 40, kvkPoints: 40 },
  '2->5': { ...makeUpgrade(2, 5), baseTime: 220, mgePoints: 45, kvkPoints: 45 },
  '1->5': { ...makeUpgrade(1, 5), baseTime: 240, mgePoints: 48, kvkPoints: 48 },
  '3->4': makeUpgrade(3, 4),
  '2->4': { ...makeUpgrade(2, 4), baseTime: 140, mgePoints: 25, kvkPoints: 25 },
  '1->4': { ...makeUpgrade(1, 4), baseTime: 160, mgePoints: 28, kvkPoints: 28 },
  '2->3': makeUpgrade(2, 3),
  '1->3': { ...makeUpgrade(1, 3), baseTime: 80, mgePoints: 10, kvkPoints: 10 },
  '1->2': makeUpgrade(1, 2),
}

export function getTroopStats(tier: Tier): TroopStats {
  return TROOP_STATS[tier]
}

export function getUpgradeStats(from: Tier, to: Tier): UpgradeStats | null {
  return UPGRADE_PATHS[`${from}->${to}`] ?? null
}

/** All possible training paths for a target tier */
export function getPathsForTier(targetTier: Tier): { label: string; key: string; from: Tier | null; to: Tier }[] {
  const paths: { label: string; key: string; from: Tier | null; to: Tier }[] = [
    { label: `T${targetTier}`, key: `train-${targetTier}`, from: null, to: targetTier },
  ]
  for (let f = targetTier - 1; f >= 1; f--) {
    paths.push({
      label: `T${f} -> T${targetTier}`,
      key: `${f}->${targetTier}`,
      from: f as Tier,
      to: targetTier,
    })
  }
  return paths
}

/* ------------------------------------------------------------------ */
/*  CALCULATION HELPERS                                                */
/* ------------------------------------------------------------------ */

export interface TrainingResult {
  troops: number
  time: number // in seconds
  food: number
  wood: number
  stone: number
  gold: number
  power: number
  mgePoints: number
  kvkPoints: number
}

/** Calculate results for training N troops from scratch */
export function calcTraining(
  tier: Tier,
  count: number,
  speedBonus: number
): TrainingResult {
  const stats = TROOP_STATS[tier]
  const speedMult = 1 + speedBonus / 100
  return {
    troops: count,
    time: Math.round((stats.baseTime * count) / speedMult),
    food: stats.food * count,
    wood: stats.wood * count,
    stone: stats.stone * count,
    gold: stats.gold * count,
    power: stats.power * count,
    mgePoints: stats.mgePoints * count,
    kvkPoints: stats.kvkPoints * count,
  }
}

/** Calculate results for upgrading N troops */
export function calcUpgrade(
  fromTier: Tier,
  toTier: Tier,
  count: number,
  speedBonus: number
): TrainingResult | null {
  const up = getUpgradeStats(fromTier, toTier)
  if (!up) return null
  const speedMult = 1 + speedBonus / 100
  return {
    troops: count,
    time: Math.round((up.baseTime * count) / speedMult),
    food: up.food * count,
    wood: up.wood * count,
    stone: up.stone * count,
    gold: up.gold * count,
    power: up.powerGain * count,
    mgePoints: up.mgePoints * count,
    kvkPoints: up.kvkPoints * count,
  }
}

/** Calculate how many troops you can train given speedups + resources */
export function calcFromSpeedups(
  tier: Tier,
  fromTier: Tier | null,
  speedBonus: number,
  speedupSeconds: number,
  resources: { food: number; wood: number; stone: number; gold: number }
): TrainingResult {
  const stats = fromTier
    ? getUpgradeStats(fromTier, tier)
    : TROOP_STATS[tier]
  if (!stats) return { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }

  const speedMult = 1 + speedBonus / 100
  const timePerTroop = (stats.baseTime) / speedMult

  // Max from time
  const maxFromTime = timePerTroop > 0 ? Math.floor(speedupSeconds / timePerTroop) : Infinity

  // Max from each resource
  const limits: number[] = [maxFromTime]
  if (stats.food > 0) limits.push(Math.floor(resources.food / stats.food))
  if (stats.wood > 0) limits.push(Math.floor(resources.wood / stats.wood))
  if (stats.stone > 0) limits.push(Math.floor(resources.stone / stats.stone))
  if (stats.gold > 0) limits.push(Math.floor(resources.gold / stats.gold))

  const count = Math.max(0, Math.min(...limits))

  if (fromTier) {
    return calcUpgrade(fromTier, tier, count, speedBonus) ?? { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }
  }
  return calcTraining(tier, count, speedBonus)
}

/** Calculate how many troops needed for target MGE points */
export function calcFromMgePoints(
  tier: Tier,
  fromTier: Tier | null,
  speedBonus: number,
  targetPoints: number
): TrainingResult {
  const stats = fromTier
    ? getUpgradeStats(fromTier, tier)
    : TROOP_STATS[tier]
  if (!stats || stats.mgePoints <= 0) return { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }

  const count = Math.ceil(targetPoints / stats.mgePoints)

  if (fromTier) {
    return calcUpgrade(fromTier, tier, count, speedBonus) ?? { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }
  }
  return calcTraining(tier, count, speedBonus)
}

/* ------------------------------------------------------------------ */
/*  TIME FORMATTING                                                    */
/* ------------------------------------------------------------------ */

export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 && d === 0) parts.push(`${s}s`)
  return parts.join(' ') || '0s'
}

export const TROOP_TYPES: { id: TroopType; label: string; color: string }[] = [
  { id: 'infantry', label: 'Infantry', color: 'hsl(210, 80%, 60%)' },
  { id: 'archer', label: 'Archer', color: 'hsl(145, 70%, 50%)' },
  { id: 'cavalry', label: 'Cavalry', color: 'hsl(35, 90%, 55%)' },
  { id: 'siege', label: 'Siege', color: 'hsl(0, 75%, 60%)' },
]

export const TIERS: Tier[] = [5, 4, 3, 2, 1]
