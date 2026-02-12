// lib/commander/calendar-gh.ts
import type {
  RecurringGhEventDef,
  RecurringGhEventId,
  GhEventOccurrence,
  PlannedOutcome,
} from "@/lib/kvk-engine"; // <-- adjust path to where your types actually live

type CalendarEventLite = {
  id: string;
  title?: string;
  category?: string;
  description?: string;
  startDate: string; // ISO
  endDate?: string;  // ISO
};

const CAL_KEY = "rok_calendar_events";

function loadCalendarEvents(): CalendarEventLite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function normalize(s: string) {
  return (s || "").toLowerCase().trim();
}

/**
 * Map your calendar event title/category into an eventId we use for GH logic.
 * IMPORTANT: this is the source of truth mapping; tweak strings to match your calendar.
 */
export function mapCalendarToRecurringId(ev: CalendarEventLite): RecurringGhEventId | null {
  const t = normalize(ev.title || "");
  const c = normalize(ev.category || "");

  const hay = `${t} ${c}`;

  if (hay.includes("ark of osiris") || hay.includes("ark")) return "ark";
  if (hay.includes("champions of olympia") || hay.includes("olympia")) return "olympia";
  if (hay.includes("more than gems") || hay.includes("mtg")) return "mtg";
  if (hay.includes("esmeralda")) return "esmeralda";
  if (hay.includes("silk road")) return "silkroad";

  return null;
}

function dayDiffFromNow(dateIso: string): number {
  const now = new Date();
  const start = new Date(dateIso);
  const ms = start.getTime() - now.getTime();
  return Math.floor(ms / 86400000);
}

/**
 * Build ONE occurrence per calendar event instance within [0..daysUntilGoal].
 * Outcomes can be overridden per-occurrence via overrides[eventId][index].
 */
export function buildOccurrencesFromCalendar(
  daysUntilGoal: number,
  defs: RecurringGhEventDef[],
  enabled: Record<string, boolean>,
  overrides?: Record<string, PlannedOutcome[]>,
): GhEventOccurrence[] {
  const events = loadCalendarEvents();
  const defMap = new Map(defs.map((d) => [d.id, d]));

  // collect occurrences per eventId so index order is stable
  const buckets = new Map<RecurringGhEventId, { dayOffset: number; name: string }[]>();

  for (const ev of events) {
    const eventId = mapCalendarToRecurringId(ev);
    if (!eventId) continue;
    if (!enabled[eventId]) continue;

    const def = defMap.get(eventId);
    if (!def) continue;

    // if seasonalOnly, only count if enabled (already checked), so ok

    const offset = dayDiffFromNow(ev.startDate);
    if (offset < 0) continue;
    if (offset > daysUntilGoal) continue;

    const name = def.name;

    const list = buckets.get(eventId) || [];
    list.push({ dayOffset: offset, name });
    buckets.set(eventId, list);
  }

  const out: GhEventOccurrence[] = [];
  for (const [eventId, list] of buckets.entries()) {
    // sort by dayOffset so override index matches chronological order
    list.sort((a, b) => a.dayOffset - b.dayOffset);

    const def = defMap.get(eventId)!;
    for (let idx = 0; idx < list.length; idx++) {
      const planned = overrides?.[eventId]?.[idx] ?? def.defaultOutcome;
      out.push({
        id: `${eventId}-${list[idx].dayOffset}-${idx}`,
        eventId,
        name: list[idx].name,
        dayOffset: list[idx].dayOffset,
        plannedOutcome: planned,
      });
    }
  }

  return out.sort((a, b) => a.dayOffset - b.dayOffset);
}
export function buildCalendarDrivenPlan(
  allEvents: any[],
  daysUntilKvk: number
) {
  const now = new Date()
  const deadline = new Date(
    now.getTime() + daysUntilKvk * 24 * 60 * 60 * 1000
  )

  const occurrences = allEvents.filter((e) => {
    const start = new Date(e.startDate)
    return start >= now && start <= deadline
  })

  // placeholder logic until we wire real GH math
  const eventHeads = 0
  const bundleHeads = 0

  return {
    occurrences,
    totalHeads: eventHeads + bundleHeads,
    eventHeads,
    bundleHeads,
  }
}

