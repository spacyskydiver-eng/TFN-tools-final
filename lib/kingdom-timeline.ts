// lib/kingdom-timeline.ts

export type KingdomSeason =
  | 'prekvk'
  | 'kvk1'
  | 'kvk2'
  | 'kvk3'
  | 'soc'

/**
 * Rough season ranges in kingdom age days.
 * These are approximations and can be tuned later.
 */
const SEASON_RANGES: { start: number; end: number; season: KingdomSeason }[] = [
  { start: 0, end: 90, season: 'prekvk' },
  { start: 90, end: 140, season: 'kvk1' },
  { start: 140, end: 190, season: 'kvk2' },
  { start: 190, end: 240, season: 'kvk3' },
  { start: 240, end: Infinity, season: 'soc' },
]

export function getSeasonFromAge(ageDays: number): KingdomSeason {
  for (const r of SEASON_RANGES) {
    if (ageDays >= r.start && ageDays < r.end) {
      return r.season
    }
  }
  return 'soc'
}

/**
 * Returns all seasons crossed between two ages.
 */
export function getSeasonsBetween(
  startAge: number,
  endAge: number
): KingdomSeason[] {
  const seasons = new Set<KingdomSeason>()

  for (const r of SEASON_RANGES) {
    const overlaps =
      endAge >= r.start && startAge < r.end

    if (overlaps) seasons.add(r.season)
  }

  return Array.from(seasons)
}
