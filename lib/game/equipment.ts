/* ================================================================== */
/*  EQUIPMENT DATA & TYPES                                             */
/* ================================================================== */

export type EquipmentSlot = 'helmet' | 'weapon' | 'chest' | 'gloves' | 'legs' | 'boots' | 'accessory_1' | 'accessory_2'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type MaterialTier = 1 | 2 | 3 | 4 | 5

export type StatType =
  | 'infantry_attack' | 'infantry_defense' | 'infantry_health'
  | 'cavalry_attack' | 'cavalry_defense' | 'cavalry_health'
  | 'archer_attack' | 'archer_defense' | 'archer_health'
  | 'troop_attack' | 'troop_defense' | 'troop_health'
  | 'march_speed' | 'gathering_speed' | 'research_speed'
  | 'building_speed' | 'training_speed' | 'healing_speed'

export interface EquipmentStat {
  type: StatType
  value: number
}

export interface MaterialCost {
  materialId: string
  tier: MaterialTier
  amount: number
}

export interface Equipment {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  stats: EquipmentStat[]
  materials: MaterialCost[]
  goldCost: number
  craftTime: number // in minutes
  specialBonus?: string
  set?: string
}

export interface MaterialType {
  id: string
  name: string
  tiers: { tier: MaterialTier; color: string }[]
}

/* ------------------------------------------------------------------ */
/*  SLOT METADATA                                                      */
/* ------------------------------------------------------------------ */

export const SLOT_META: Record<EquipmentSlot, { label: string; row: number; col: number }> = {
  helmet:      { label: 'Helmet',      row: 0, col: 1 },
  weapon:      { label: 'Weapon',      row: 1, col: 0 },
  chest:       { label: 'Chest',       row: 1, col: 2 },
  gloves:      { label: 'Gloves',      row: 2, col: 0 },
  legs:        { label: 'Legs',        row: 2, col: 2 },
  boots:       { label: 'Boots',       row: 3, col: 1 },
  accessory_1: { label: 'Ring',        row: 4, col: 0 },
  accessory_2: { label: 'Amulet',      row: 4, col: 2 },
}

export const SLOT_ORDER: EquipmentSlot[] = [
  'helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory_1', 'accessory_2'
]

/* ------------------------------------------------------------------ */
/*  RARITY COLORS                                                      */
/* ------------------------------------------------------------------ */

export const RARITY_COLORS: Record<Rarity, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: 'bg-zinc-500/15',   border: 'border-zinc-500/40',   text: 'text-zinc-400',   glow: '0 0 12px rgba(161,161,170,0.2)' },
  uncommon:  { bg: 'bg-green-500/15',  border: 'border-green-500/40',  text: 'text-green-400',  glow: '0 0 12px rgba(74,222,128,0.25)' },
  rare:      { bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   text: 'text-blue-400',   glow: '0 0 12px rgba(96,165,250,0.25)' },
  epic:      { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400', glow: '0 0 14px rgba(192,132,252,0.3)' },
  legendary: { bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  text: 'text-amber-400',  glow: '0 0 16px rgba(251,191,36,0.35)' },
}

/* ------------------------------------------------------------------ */
/*  MATERIAL DEFINITIONS                                               */
/* ------------------------------------------------------------------ */

export const MATERIALS: MaterialType[] = [
  {
    id: 'iron_ore',
    name: 'Iron Ore',
    tiers: [
      { tier: 1, color: '#a1a1aa' },
      { tier: 2, color: '#22c55e' },
      { tier: 3, color: '#3b82f6' },
      { tier: 4, color: '#a855f7' },
      { tier: 5, color: '#f59e0b' },
    ],
  },
  {
    id: 'leather',
    name: 'Leather',
    tiers: [
      { tier: 1, color: '#a1a1aa' },
      { tier: 2, color: '#22c55e' },
      { tier: 3, color: '#3b82f6' },
      { tier: 4, color: '#a855f7' },
      { tier: 5, color: '#f59e0b' },
    ],
  },
  {
    id: 'ebony',
    name: 'Ebony',
    tiers: [
      { tier: 1, color: '#a1a1aa' },
      { tier: 2, color: '#22c55e' },
      { tier: 3, color: '#3b82f6' },
      { tier: 4, color: '#a855f7' },
      { tier: 5, color: '#f59e0b' },
    ],
  },
  {
    id: 'animal_bone',
    name: 'Animal Bone',
    tiers: [
      { tier: 1, color: '#a1a1aa' },
      { tier: 2, color: '#22c55e' },
      { tier: 3, color: '#3b82f6' },
      { tier: 4, color: '#a855f7' },
      { tier: 5, color: '#f59e0b' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  STAT DISPLAY NAMES                                                 */
/* ------------------------------------------------------------------ */

export const STAT_LABELS: Record<StatType, string> = {
  infantry_attack:  'Infantry Attack',
  infantry_defense: 'Infantry Defense',
  infantry_health:  'Infantry Health',
  cavalry_attack:   'Cavalry Attack',
  cavalry_defense:  'Cavalry Defense',
  cavalry_health:   'Cavalry Health',
  archer_attack:    'Archer Attack',
  archer_defense:   'Archer Defense',
  archer_health:    'Archer Health',
  troop_attack:     'Troop Attack',
  troop_defense:    'Troop Defense',
  troop_health:     'Troop Health',
  march_speed:      'March Speed',
  gathering_speed:  'Gathering Speed',
  research_speed:   'Research Speed',
  building_speed:   'Building Speed',
  training_speed:   'Training Speed',
  healing_speed:    'Healing Speed',
}

/* ------------------------------------------------------------------ */
/*  EQUIPMENT DATABASE                                                 */
/* ------------------------------------------------------------------ */

export const EQUIPMENT_DB: Equipment[] = [
  // --- LEGENDARY ---
  {
    id: 'dragons_breath_bow',
    name: "Dragon's Breath Bow",
    slot: 'weapon',
    rarity: 'legendary',
    stats: [
      { type: 'archer_defense', value: 20 },
      { type: 'cavalry_health', value: 5 },
      { type: 'infantry_health', value: 5 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 15 },
      { materialId: 'leather', tier: 5, amount: 15 },
      { materialId: 'ebony', tier: 5, amount: 60 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Dragon',
  },
  {
    id: 'hammer_sun_moon',
    name: 'Hammer of the Sun and Moon',
    slot: 'weapon',
    rarity: 'legendary',
    stats: [
      { type: 'infantry_attack', value: 25 },
      { type: 'archer_health', value: 5 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 10 },
      { materialId: 'leather', tier: 5, amount: 70 },
      { materialId: 'ebony', tier: 5, amount: 10 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Sunset',
  },
  {
    id: 'lance_hellish_wasteland',
    name: 'Lance of the Hellish Wasteland',
    slot: 'weapon',
    rarity: 'legendary',
    stats: [
      { type: 'cavalry_attack', value: 20 },
      { type: 'infantry_health', value: 5 },
      { type: 'archer_attack', value: 5 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 60 },
      { materialId: 'leather', tier: 5, amount: 15 },
      { materialId: 'ebony', tier: 5, amount: 15 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Wasteland',
  },
  {
    id: 'sacred_dominion',
    name: 'Sacred Dominion',
    slot: 'weapon',
    rarity: 'legendary',
    stats: [
      { type: 'cavalry_attack', value: 25 },
      { type: 'archer_defense', value: 5 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 70 },
      { materialId: 'leather', tier: 5, amount: 10 },
      { materialId: 'ebony', tier: 5, amount: 10 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Dominion',
  },
  {
    id: 'helm_of_the_phoenix',
    name: 'Helm of the Phoenix',
    slot: 'helmet',
    rarity: 'legendary',
    stats: [
      { type: 'troop_defense', value: 8 },
      { type: 'troop_health', value: 5 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 40 },
      { materialId: 'leather', tier: 5, amount: 30 },
      { materialId: 'animal_bone', tier: 5, amount: 20 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Phoenix',
  },
  {
    id: 'heart_of_the_saint',
    name: 'Heart of the Saint',
    slot: 'chest',
    rarity: 'legendary',
    stats: [
      { type: 'infantry_defense', value: 15 },
      { type: 'troop_health', value: 5 },
    ],
    materials: [
      { materialId: 'leather', tier: 5, amount: 50 },
      { materialId: 'animal_bone', tier: 5, amount: 30 },
      { materialId: 'iron_ore', tier: 5, amount: 10 },
    ],
    goldCost: 2000000,
    craftTime: 17280,
    set: 'Saint',
  },
  {
    id: 'gauntlets_of_shadow',
    name: 'Gauntlets of Shadow',
    slot: 'gloves',
    rarity: 'legendary',
    stats: [
      { type: 'cavalry_defense', value: 12 },
      { type: 'archer_attack', value: 5 },
    ],
    materials: [
      { materialId: 'leather', tier: 5, amount: 45 },
      { materialId: 'iron_ore', tier: 5, amount: 25 },
      { materialId: 'ebony', tier: 5, amount: 20 },
    ],
    goldCost: 1500000,
    craftTime: 14400,
    set: 'Shadow',
  },
  {
    id: 'greaves_of_the_vanguard',
    name: 'Greaves of the Vanguard',
    slot: 'legs',
    rarity: 'legendary',
    stats: [
      { type: 'troop_attack', value: 6 },
      { type: 'march_speed', value: 8 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 35 },
      { materialId: 'leather', tier: 5, amount: 35 },
      { materialId: 'animal_bone', tier: 5, amount: 20 },
    ],
    goldCost: 1500000,
    craftTime: 14400,
    set: 'Vanguard',
  },
  {
    id: 'boots_of_the_fleet',
    name: 'Boots of the Fleet',
    slot: 'boots',
    rarity: 'legendary',
    stats: [
      { type: 'march_speed', value: 15 },
      { type: 'troop_health', value: 3 },
    ],
    materials: [
      { materialId: 'leather', tier: 5, amount: 50 },
      { materialId: 'animal_bone', tier: 5, amount: 30 },
      { materialId: 'ebony', tier: 5, amount: 10 },
    ],
    goldCost: 1500000,
    craftTime: 14400,
    set: 'Fleet',
  },
  {
    id: 'ring_of_doom',
    name: 'Ring of Doom',
    slot: 'accessory_1',
    rarity: 'legendary',
    stats: [
      { type: 'troop_attack', value: 8 },
      { type: 'troop_defense', value: 3 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 5, amount: 30 },
      { materialId: 'ebony', tier: 5, amount: 40 },
      { materialId: 'animal_bone', tier: 5, amount: 20 },
    ],
    goldCost: 1500000,
    craftTime: 14400,
    set: 'Doom',
  },
  {
    id: 'eternal_night_amulet',
    name: 'Eternal Night Amulet',
    slot: 'accessory_2',
    rarity: 'legendary',
    stats: [
      { type: 'troop_defense', value: 6 },
      { type: 'troop_health', value: 6 },
    ],
    materials: [
      { materialId: 'ebony', tier: 5, amount: 40 },
      { materialId: 'animal_bone', tier: 5, amount: 30 },
      { materialId: 'iron_ore', tier: 5, amount: 20 },
    ],
    goldCost: 1500000,
    craftTime: 14400,
    set: 'Eternal',
  },
  // --- EPIC ---
  {
    id: 'windswept_war_helm',
    name: 'Windswept War Helm',
    slot: 'helmet',
    rarity: 'epic',
    stats: [
      { type: 'cavalry_defense', value: 8 },
      { type: 'march_speed', value: 4 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 4, amount: 30 },
      { materialId: 'leather', tier: 4, amount: 20 },
      { materialId: 'animal_bone', tier: 4, amount: 10 },
    ],
    goldCost: 800000,
    craftTime: 8640,
    set: 'Windswept',
  },
  {
    id: 'staff_of_the_lost',
    name: 'Staff of the Lost',
    slot: 'weapon',
    rarity: 'epic',
    stats: [
      { type: 'infantry_attack', value: 12 },
      { type: 'troop_health', value: 3 },
    ],
    materials: [
      { materialId: 'leather', tier: 4, amount: 20 },
      { materialId: 'iron_ore', tier: 4, amount: 20 },
      { materialId: 'ebony', tier: 4, amount: 50 },
    ],
    goldCost: 800000,
    craftTime: 8640,
  },
  {
    id: 'platemail_of_dawn',
    name: 'Platemail of Dawn',
    slot: 'chest',
    rarity: 'epic',
    stats: [
      { type: 'troop_defense', value: 8 },
      { type: 'infantry_health', value: 4 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 4, amount: 40 },
      { materialId: 'leather', tier: 4, amount: 15 },
      { materialId: 'animal_bone', tier: 4, amount: 5 },
    ],
    goldCost: 800000,
    craftTime: 8640,
  },
  {
    id: 'grips_of_the_ranger',
    name: 'Grips of the Ranger',
    slot: 'gloves',
    rarity: 'epic',
    stats: [
      { type: 'archer_attack', value: 10 },
      { type: 'archer_defense', value: 4 },
    ],
    materials: [
      { materialId: 'leather', tier: 4, amount: 30 },
      { materialId: 'ebony', tier: 4, amount: 20 },
      { materialId: 'animal_bone', tier: 4, amount: 10 },
    ],
    goldCost: 600000,
    craftTime: 7200,
  },
  {
    id: 'treads_of_the_scout',
    name: 'Treads of the Scout',
    slot: 'boots',
    rarity: 'epic',
    stats: [
      { type: 'march_speed', value: 10 },
      { type: 'gathering_speed', value: 5 },
    ],
    materials: [
      { materialId: 'leather', tier: 4, amount: 35 },
      { materialId: 'animal_bone', tier: 4, amount: 20 },
      { materialId: 'ebony', tier: 4, amount: 5 },
    ],
    goldCost: 600000,
    craftTime: 7200,
  },
  {
    id: 'legguards_of_resolve',
    name: 'Legguards of Resolve',
    slot: 'legs',
    rarity: 'epic',
    stats: [
      { type: 'infantry_defense', value: 8 },
      { type: 'cavalry_health', value: 3 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 4, amount: 30 },
      { materialId: 'leather', tier: 4, amount: 20 },
      { materialId: 'animal_bone', tier: 4, amount: 10 },
    ],
    goldCost: 600000,
    craftTime: 7200,
  },
  {
    id: 'signet_of_storms',
    name: 'Signet of Storms',
    slot: 'accessory_1',
    rarity: 'epic',
    stats: [
      { type: 'troop_attack', value: 5 },
      { type: 'archer_health', value: 3 },
    ],
    materials: [
      { materialId: 'iron_ore', tier: 4, amount: 20 },
      { materialId: 'ebony', tier: 4, amount: 30 },
      { materialId: 'animal_bone', tier: 4, amount: 10 },
    ],
    goldCost: 600000,
    craftTime: 7200,
  },
  {
    id: 'pendant_of_fortitude',
    name: 'Pendant of Fortitude',
    slot: 'accessory_2',
    rarity: 'epic',
    stats: [
      { type: 'troop_defense', value: 4 },
      { type: 'troop_health', value: 4 },
    ],
    materials: [
      { materialId: 'ebony', tier: 4, amount: 25 },
      { materialId: 'animal_bone', tier: 4, amount: 25 },
      { materialId: 'iron_ore', tier: 4, amount: 10 },
    ],
    goldCost: 600000,
    craftTime: 7200,
  },
  // --- RARE ---
  {
    id: 'iron_war_helm',
    name: 'Iron War Helm',
    slot: 'helmet',
    rarity: 'rare',
    stats: [{ type: 'troop_defense', value: 4 }],
    materials: [
      { materialId: 'iron_ore', tier: 3, amount: 20 },
      { materialId: 'leather', tier: 3, amount: 10 },
    ],
    goldCost: 300000,
    craftTime: 4320,
  },
  {
    id: 'commanders_blade',
    name: "Commander's Blade",
    slot: 'weapon',
    rarity: 'rare',
    stats: [{ type: 'troop_attack', value: 5 }],
    materials: [
      { materialId: 'iron_ore', tier: 3, amount: 25 },
      { materialId: 'ebony', tier: 3, amount: 15 },
    ],
    goldCost: 300000,
    craftTime: 4320,
  },
  {
    id: 'brigandine_vest',
    name: 'Brigandine Vest',
    slot: 'chest',
    rarity: 'rare',
    stats: [{ type: 'troop_health', value: 4 }],
    materials: [
      { materialId: 'leather', tier: 3, amount: 25 },
      { materialId: 'iron_ore', tier: 3, amount: 15 },
    ],
    goldCost: 300000,
    craftTime: 4320,
  },
  {
    id: 'leather_work_gloves',
    name: 'Leather Work Gloves',
    slot: 'gloves',
    rarity: 'rare',
    stats: [{ type: 'gathering_speed', value: 8 }],
    materials: [
      { materialId: 'leather', tier: 3, amount: 20 },
      { materialId: 'animal_bone', tier: 3, amount: 10 },
    ],
    goldCost: 200000,
    craftTime: 2880,
  },
  {
    id: 'scouts_boots',
    name: "Scout's Boots",
    slot: 'boots',
    rarity: 'rare',
    stats: [{ type: 'march_speed', value: 6 }],
    materials: [
      { materialId: 'leather', tier: 3, amount: 20 },
      { materialId: 'animal_bone', tier: 3, amount: 10 },
    ],
    goldCost: 200000,
    craftTime: 2880,
  },
]

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

export type Loadout = Partial<Record<EquipmentSlot, Equipment>>

export function getLoadoutStats(loadout: Loadout): Record<StatType, number> {
  const stats = {} as Record<StatType, number>
  for (const key of Object.keys(STAT_LABELS) as StatType[]) {
    stats[key] = 0
  }
  for (const eq of Object.values(loadout)) {
    if (!eq) continue
    for (const s of eq.stats) {
      stats[s.type] += s.value
    }
  }
  return stats
}

export function computeCraftingTotals(items: Equipment[]): {
  materials: Record<string, Record<number, number>>
  gold: number
  time: number
} {
  const materials: Record<string, Record<number, number>> = {}
  let gold = 0
  let time = 0

  for (const item of items) {
    gold += item.goldCost
    time += item.craftTime
    for (const mat of item.materials) {
      if (!materials[mat.materialId]) materials[mat.materialId] = {}
      materials[mat.materialId][mat.tier] = (materials[mat.materialId][mat.tier] || 0) + mat.amount
    }
  }

  return { materials, gold, time }
}
