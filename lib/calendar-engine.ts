/* ------------------------------------------------------------------ */
/*  Calendar Engine – auto-generating repeating RoK events             */
/* ------------------------------------------------------------------ */

export type CalendarEvent = {
  id: string
  title: string
  description: string
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  category: string
  color: string
  isGenerated: boolean // true = auto-generated, false = user-created
}

export type KingdomMode = 'early' | 'mature'

export type MatureSeason =
  | 'preparation'
  | 'season1'
  | 'season2'
  | 'season3'
  | 'soc'

/* ------------------------------------------------------------------ */
/*  CATEGORY COLORS                                                    */
/* ------------------------------------------------------------------ */

export const CATEGORY_COLORS: Record<string, string> = {
  'Mightiest Governor': '#6366f1',
  'Ceroli Crisis': '#f97316',
  'Golden Kingdom': '#eab308',
  'Wheel of Fortune': '#ec4899',
  'Champions of Olympia': '#14b8a6',
  "Esmeralda's House": '#a855f7',
  'Realm of Mystique': '#8b5cf6',
  'AoO Registration': '#22c55e',
  'Ark of Osiris': '#22c55e',
  '20 Gold Head Event': '#f59e0b',
  'Egg / Hammer Event': '#ef4444',
  "Dharluk's Puzzle Box": '#06b6d4',
  'More Than Gems': '#d946ef',
  'KvK': '#ef4444',
  'Osiris League': '#f59e0b',
  'Other': '#6b7280',
}

export const EVENT_CATEGORIES = [
  { label: 'Mightiest Governor', color: CATEGORY_COLORS['Mightiest Governor'] },
  { label: 'KvK', color: CATEGORY_COLORS['KvK'] },
  { label: 'Osiris League', color: CATEGORY_COLORS['Osiris League'] },
  { label: 'Ark of Osiris', color: CATEGORY_COLORS['Ark of Osiris'] },
  { label: 'More Than Gems', color: CATEGORY_COLORS['More Than Gems'] },
  { label: 'Wheel of Fortune', color: CATEGORY_COLORS['Wheel of Fortune'] },
  { label: 'Other', color: CATEGORY_COLORS['Other'] },
]

/* ------------------------------------------------------------------ */
/*  DATE HELPERS                                                       */
/* ------------------------------------------------------------------ */

/** Returns true if `dateStr` is a valid YYYY-MM-DD that produces a real date */
function isValidDateStr(dateStr: string | undefined | null): dateStr is string {
  if (!dateStr || typeof dateStr !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr + 'T00:00:00Z')
  return !Number.isNaN(d.getTime())
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24))
}

/* ------------------------------------------------------------------ */
/*  COMMANDER ROTATION                                                 */
/* ------------------------------------------------------------------ */

const COMMANDER_TYPES = ['Leadership', 'Cavalry', 'Infantry', 'Archer']

function commanderType(cycleIndex: number): string {
  // cycleIndex = how many full 4-week cycles since the anchor
  return COMMANDER_TYPES[cycleIndex % 4]
}

/* ------------------------------------------------------------------ */
/*  SoC 4-WEEK CYCLE DEFINITION                                       */
/* ------------------------------------------------------------------ */

// Day offsets within a week: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
type WeekEventDef = {
  name: string
  startDay: number   // 0=Mon
  endDay: number     // 0=Mon
  category: string
  usesRotation?: boolean   // true for MG and WoF
}

const WEEK1_EVENTS: WeekEventDef[] = [
  { name: 'Mightiest Governor', startDay: 0, endDay: 6, category: 'Mightiest Governor', usesRotation: true },
  { name: 'Ceroli Crisis', startDay: 0, endDay: 2, category: 'Ceroli Crisis' },
  { name: 'Golden Kingdom', startDay: 2, endDay: 4, category: 'Golden Kingdom' },
  { name: 'Wheel of Fortune', startDay: 1, endDay: 3, category: 'Wheel of Fortune', usesRotation: true },
  { name: 'Champions of Olympia', startDay: 4, endDay: 6, category: 'Champions of Olympia' },
]

const WEEK2_EVENTS: WeekEventDef[] = [
  { name: "Esmeralda's House", startDay: 0, endDay: 1, category: "Esmeralda's House" },
  { name: 'Realm of Mystique', startDay: 0, endDay: 1, category: 'Realm of Mystique' },
  { name: 'AoO Registration', startDay: 2, endDay: 3, category: 'AoO Registration' },
  { name: 'Ark of Osiris', startDay: 4, endDay: 5, category: 'Ark of Osiris' },
  { name: '20 Gold Head Event', startDay: 4, endDay: 5, category: '20 Gold Head Event' },
  { name: 'Egg / Hammer Event', startDay: 4, endDay: 5, category: 'Egg / Hammer Event' },
  { name: 'Champions of Olympia', startDay: 5, endDay: 6, category: 'Champions of Olympia' },
]

const WEEK3_EVENTS: WeekEventDef[] = [
  { name: 'Mightiest Governor', startDay: 0, endDay: 6, category: 'Mightiest Governor', usesRotation: true },
  { name: 'Ceroli Crisis', startDay: 0, endDay: 2, category: 'Ceroli Crisis' },
  { name: 'Golden Kingdom', startDay: 2, endDay: 4, category: 'Golden Kingdom' },
  { name: 'Wheel of Fortune', startDay: 1, endDay: 3, category: 'Wheel of Fortune', usesRotation: true },
  { name: 'Champions of Olympia', startDay: 4, endDay: 6, category: 'Champions of Olympia' },
  { name: 'More Than Gems', startDay: 5, endDay: 6, category: 'More Than Gems' },
]

const WEEK4_EVENTS: WeekEventDef[] = [
  { name: "Dharluk's Puzzle Box", startDay: 0, endDay: 1, category: "Dharluk's Puzzle Box" },
  { name: 'Realm of Mystique', startDay: 0, endDay: 1, category: 'Realm of Mystique' },
  { name: 'AoO Registration', startDay: 2, endDay: 3, category: 'AoO Registration' },
  { name: 'Ark of Osiris', startDay: 4, endDay: 5, category: 'Ark of Osiris' },
  { name: '20 Gold Head Event', startDay: 4, endDay: 5, category: '20 Gold Head Event' },
  { name: 'Egg / Hammer Event', startDay: 4, endDay: 5, category: 'Egg / Hammer Event' },
  { name: 'Champions of Olympia', startDay: 5, endDay: 6, category: 'Champions of Olympia' },
]

const SOC_CYCLE = [WEEK1_EVENTS, WEEK2_EVENTS, WEEK3_EVENTS, WEEK4_EVENTS]

/* ------------------------------------------------------------------ */
/*  SoC ANCHOR                                                         */
/* ------------------------------------------------------------------ */

const SOC_ANCHOR = '2026-02-09' // Monday, start of Week 1

/* ------------------------------------------------------------------ */
/*  GENERATE SoC EVENTS                                                */
/* ------------------------------------------------------------------ */

export function generateSoCEvents(rangeStart: string, rangeEnd: string): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // Validate inputs before any date math
  if (!isValidDateStr(rangeStart) || !isValidDateStr(rangeEnd)) return events

  // Find which cycle week the rangeStart falls in
  const daysSinceAnchor = diffDays(rangeStart, SOC_ANCHOR)
  // Go back far enough to cover any event that might span into rangeStart
  let cycleStartOffset = Math.floor(daysSinceAnchor / 28) * 28
  if (cycleStartOffset > daysSinceAnchor) cycleStartOffset -= 28

  // Start one full cycle before to catch spanning events
  cycleStartOffset -= 28

  const rangeEndDate = new Date(rangeEnd + 'T00:00:00Z').getTime()

  for (let offset = cycleStartOffset; ; offset += 28) {
    const cycleMonday = addDays(SOC_ANCHOR, offset)
    const cycleMondayDate = new Date(cycleMonday + 'T00:00:00Z').getTime()

    // If the cycle start is past our range end, stop
    if (cycleMondayDate > rangeEndDate + 28 * 24 * 60 * 60 * 1000) break

    const cycleIndex = Math.floor(offset / 28)

    for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
      const weekMonday = addDays(cycleMonday, weekIdx * 7)
      const weekDefs = SOC_CYCLE[weekIdx]

      for (const def of weekDefs) {
        const eventStart = addDays(weekMonday, def.startDay)
        const eventEnd = addDays(weekMonday, def.endDay)

        // Skip if entirely outside range
        if (eventEnd < rangeStart || eventStart > rangeEnd) continue

        let title = def.name
        if (def.usesRotation) {
          const cmdType = commanderType(cycleIndex >= 0 ? cycleIndex : (cycleIndex % 4 + 4) % 4)
          title = `${def.name} – ${cmdType}`
        }

        const color = CATEGORY_COLORS[def.category] || CATEGORY_COLORS['Other']

        events.push({
          id: `soc-${offset}-${weekIdx}-${def.name}-${eventStart}`,
          title,
          description: '',
          startDate: eventStart,
          endDate: eventEnd,
          category: def.category,
          color,
          isGenerated: true,
        })
      }
    }
  }

  return events
}

/* ------------------------------------------------------------------ */
/*  GENERATE EARLY KINGDOM EVENTS                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate early kingdom Wheel of Fortune events.
 * Only generates if BOTH kingdomStartDate AND firstWheelDate are valid.
 * If firstWheelDate is missing/empty, returns [] (no Wheel events).
 */
export function generateEarlyKingdomEvents(
  kingdomStartDate: string,
  firstWheelDate: string,
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // Guard: kingdom start date must be valid to calculate day cap
  if (!isValidDateStr(kingdomStartDate)) return events
  // Guard: range dates must be valid
  if (!isValidDateStr(rangeStart) || !isValidDateStr(rangeEnd)) return events
  // Guard: if no first Wheel date provided, return empty (no auto Wheel events)
  if (!isValidDateStr(firstWheelDate)) return events

  const maxDay = 55
  const maxDate = addDays(kingdomStartDate, maxDay - 1)
  const effectiveEnd = rangeEnd < maxDate ? rangeEnd : maxDate

  // Generate Wheel of Fortune every 2 weeks, each lasting 3 days
  let wheelStart = firstWheelDate
  let wheelIdx = 0

  while (wheelStart <= effectiveEnd) {
    const wheelEnd = addDays(wheelStart, 2) // 3 days inclusive

    if (wheelEnd >= rangeStart && wheelStart <= effectiveEnd) {
      events.push({
        id: `early-wheel-${wheelIdx}`,
        title: 'Wheel of Fortune',
        description: 'Early kingdom Wheel of Fortune event',
        startDate: wheelStart,
        endDate: wheelEnd > effectiveEnd ? effectiveEnd : wheelEnd,
        category: 'Wheel of Fortune',
        color: CATEGORY_COLORS['Wheel of Fortune'],
        isGenerated: true,
      })
    }

    wheelStart = addDays(wheelStart, 14) // every 2 weeks
    wheelIdx++
  }

  return events
}

/** Get the kingdom day number for a given date. Returns null if inputs are invalid. */
export function getKingdomDay(
  kingdomStartDate: string,
  dateStr: string,
): number | null {
  if (!isValidDateStr(kingdomStartDate) || !isValidDateStr(dateStr)) return null
  return diffDays(dateStr, kingdomStartDate) + 1
}

/* ------------------------------------------------------------------ */
/*  MATURE KINGDOM SEASON EVENTS (placeholder pattern for non-SoC)    */
/* ------------------------------------------------------------------ */

/**
 * Generate auto events for a mature-kingdom season.
 *
 * Auto-generation ONLY happens for:
 *   - Season 3 (SoC cycle minus a few categories)
 *   - Season of Conquest (full SoC cycle)
 *
 * Preparation, Season 1, and Season 2 do NOT auto-generate global events.
 * Admins create events manually for those seasons (like Outlook / Google Cal).
 */

const SEASON3_REMOVED_CATEGORIES: string[] = [] // Season 3 gets the full SoC cycle for now

export function generateMatureSeasonEvents(
  season: MatureSeason,
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  // Validate range dates
  if (!isValidDateStr(rangeStart) || !isValidDateStr(rangeEnd)) return []

  if (season === 'soc') {
    return generateSoCEvents(rangeStart, rangeEnd)
  }

  if (season === 'season3') {
    // Season 3 uses the SoC cycle, optionally with some categories removed
    const allEvents = generateSoCEvents(rangeStart, rangeEnd)
    if (SEASON3_REMOVED_CATEGORIES.length === 0) return allEvents
    return allEvents.filter(
      (e) => !SEASON3_REMOVED_CATEGORIES.includes(e.category),
    )
  }

  // Preparation, Season 1, Season 2 → NO auto-generated events.
  // Admins add events manually for these seasons.
  return []
}

/* ------------------------------------------------------------------ */
/*  SETTINGS PERSISTENCE                                               */
/* ------------------------------------------------------------------ */

export type CalendarSettings = {
  mode: KingdomMode
  kingdomStartDate: string
  firstWheelDate: string
  matureSeason: MatureSeason
}

const SETTINGS_KEY = 'rok_calendar_settings'
const MANUAL_EVENTS_KEY = 'rok_calendar_manual_events'

export function loadSettings(): CalendarSettings {
  if (typeof window === 'undefined') return defaultSettings()
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: CalendarSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function defaultSettings(): CalendarSettings {
  return {
    mode: 'mature',
    kingdomStartDate: '',
    firstWheelDate: '',
    matureSeason: 'soc',
  }
}

export function loadManualEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MANUAL_EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveManualEvents(events: CalendarEvent[]) {
  localStorage.setItem(MANUAL_EVENTS_KEY, JSON.stringify(events))
}