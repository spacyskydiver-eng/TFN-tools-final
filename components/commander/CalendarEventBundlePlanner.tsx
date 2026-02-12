"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { CommanderPrepDataType, PlannedOutcome } from "@/lib/kvk-engine"; // adjust path
import { DEFAULT_RECURRING_GH_EVENTS } from "@/lib/kvk-engine"; // adjust path
import { buildCalendarDrivenPlan } from "@/lib/commander/calendar-gh"; // path from step 2

const OUTCOMES: { id: PlannedOutcome; label: string }[] = [
  { id: "win", label: "Win" },
  { id: "loss", label: "Loss" },
  { id: "complete", label: "Complete" },
  { id: "skip", label: "Skip" },
  { id: "unknown", label: "Unknown" },
];

export function CalendarEventBundlePlanner({
  data,
  onChange,
}: {
  data: CommanderPrepDataType;
  onChange: (patch: Partial<CommanderPrepDataType>) => void;
}) {
  const defs = DEFAULT_RECURRING_GH_EVENTS;

const plan = useMemo(() => {
  const raw = JSON.parse(
    localStorage.getItem("rok_calendar_events") || "[]"
  );

  return buildCalendarDrivenPlan(raw, data.daysUntilGoal);
}, [data.daysUntilGoal]);


  const setEnabled = (id: string, v: boolean) => {
    onChange({
      recurringGhEnabled: { ...data.recurringGhEnabled, [id]: v },
    });
  };

  const setOutcomeOverride = (eventId: string, idx: number, outcome: PlannedOutcome) => {
    const prev = data.recurringGhOutcomeOverrides || {};
    const arr = [...(prev[eventId] || [])];
    arr[idx] = outcome;
    onChange({
      recurringGhOutcomeOverrides: { ...prev, [eventId]: arr },
    });
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Calendar-Driven Event & Bundle Gold Heads
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Reads your saved Calendar and counts events before the deadline. You can log outcomes per occurrence.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable switches */}
        <div className="space-y-2">
          {defs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-background/30 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Source: Calendar events
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnabled(d.id, !data.recurringGhEnabled[d.id])}
                className={cn(
                  "h-6 w-11 rounded-full border border-border transition-colors relative",
                  data.recurringGhEnabled[d.id] ? "bg-primary/60" : "bg-secondary/40"
                )}
                aria-label={`Toggle ${d.name}`}
              >
                <span
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background shadow transition-all",
                    data.recurringGhEnabled[d.id] ? "left-[22px]" : "left-[2px]"
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Occurrences list */}
        <div className="rounded-xl border border-border bg-background/30">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Occurrences before deadline</div>
            <div className="text-xs text-muted-foreground">
              {plan.occurrences.length} found
            </div>
          </div>

          {plan.occurrences.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matching events found in Calendar. (Check names like “Ark of Osiris”, “Olympia”, “More Than Gems”.)
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto">
              {(() => {
                // stable per-event indexing for overrides:
                // we index occurrences per eventId in chronological order
                const perEventIndex: Record<string, number> = {};
                return plan.occurrences.map((o: any) => {
                  const idx = perEventIndex[o.eventId] ?? 0;
                  perEventIndex[o.eventId] = idx + 1;

                  return (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border last:border-b-0">
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate">{o.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          In ~{o.dayOffset} days • Occurrence #{idx + 1}
                        </div>
                      </div>

                      <select
                        className="h-8 rounded-md border border-border bg-card text-xs px-2 text-foreground"
                        value={o.plannedOutcome}
                        onChange={(e) => setOutcomeOverride(o.eventId, idx, e.target.value as PlannedOutcome)}
                      >
                        {OUTCOMES.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Bundles */}
        <div className="rounded-xl border border-border bg-background/30 p-3 space-y-3">
          <div className="text-sm font-medium text-foreground">Bundles</div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Writer of History (10 heads each)</div>
            <Input
              className="h-8 w-24 text-xs font-mono"
              value={String(data.bundlePlan.writeOfHistoryCount)}
              onChange={(e) =>
                onChange({
                  bundlePlan: { ...data.bundlePlan, writeOfHistoryCount: Math.max(0, parseInt(e.target.value || "0", 10) || 0) },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Living Legend 50/day (1 head/day)</div>
            <Input
              className="h-8 w-24 text-xs font-mono"
              value={String(data.bundlePlan.livingLegend50PerDay)}
              onChange={(e) =>
                onChange({
                  bundlePlan: { ...data.bundlePlan, livingLegend50PerDay: Math.max(0, Math.min(1, parseInt(e.target.value || "0", 10) || 0)) },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Living Legend 100/day (2 heads/day, max 3)</div>
            <Input
              className="h-8 w-24 text-xs font-mono"
              value={String(data.bundlePlan.livingLegend100PerDay)}
              onChange={(e) =>
                onChange({
                  bundlePlan: { ...data.bundlePlan, livingLegend100PerDay: Math.max(0, Math.min(3, parseInt(e.target.value || "0", 10) || 0)) },
                })
              }
            />
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-xl border border-border bg-background/30 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Events: <span className="font-mono text-foreground">{plan.eventHeads}</span> • Bundles:{" "}
            <span className="font-mono text-foreground">{plan.bundleHeads}</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            Total: <span className="font-mono">{plan.totalHeads}</span>
          </div>
        </div>

        {/* Quick debugging button */}
        <Button
          variant="outline"
          className="w-full h-8 text-xs bg-transparent"
          onClick={() => {
            // forces recompute by touching state if needed
            onChange({ recurringGhOutcomeOverrides: { ...(data.recurringGhOutcomeOverrides || {}) } });
          }}
        >
          Refresh from Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
