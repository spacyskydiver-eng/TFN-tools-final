/**
 * Expands resource + hospital buildings based on City Hall level.
 *
 * RULES (from RoK game data):
 * - Farms, Lumber Mills, Quarries, Gold Mines are available from CH 2+
 * - Number of each resource building slot grows with CH level
 * - Hospitals unlock at CH 2+
 */

const RESOURCE_TYPES = ['farm', 'lumber_mill', 'quarry', 'gold_mine'] as const

/** How many resource building slots at each CH level (simplified) */
function resourceSlotCount(ch: number): number {
  if (ch <= 3) return 1
  if (ch <= 6) return 2
  if (ch <= 10) return 3
  if (ch <= 16) return 4
  return 4
}

function hospitalCount(ch: number): number {
  if (ch < 2) return 0
  if (ch <= 4) return 1
  if (ch <= 10) return 2
  if (ch <= 16) return 3
  return 4
}

/**
 * Given existing building levels and a target CH,
 * returns a merged object with all resource + hospital buildings expanded.
 */
export function expandBuildingsForCH(
  existing: Record<string, number>,
  ch: number
): Record<string, number> {
  const out: Record<string, number> = { ...existing }

  // Resource buildings
  const slots = resourceSlotCount(ch)
  for (const type of RESOURCE_TYPES) {
    for (let i = 1; i <= slots; i++) {
      const key = `${type}_${i}`
      if (!(key in out)) out[key] = 1
    }
  }

  // Hospitals
  const hCount = hospitalCount(ch)
  for (let i = 1; i <= hCount; i++) {
    const key = `hospital_${i}`
    if (!(key in out)) out[key] = 1
  }

  return out
}
