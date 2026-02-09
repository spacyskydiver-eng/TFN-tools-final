'use client'

import { useEffect, useState } from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Package, FileText, Save } from 'lucide-react'

export function PlannerContent() {
  const [draft, setDraft] = useState<any>(null)

  useEffect(() => {
    const raw = localStorage.getItem('plannerDraft')
    if (raw) setDraft(JSON.parse(raw))
  }, [])

  return (
    <div className="space-y-6">
      {/* EVENTS */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <CardTitle className="text-foreground">Event Timeline</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {draft ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Research Time Needed</span>
                <span className="font-mono text-sm text-foreground">
                  {draft.calcResult.researchRequired} min
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Building Time Needed</span>
                <span className="font-mono text-sm text-foreground">
                  {draft.calcResult.buildingRequired} min
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-3">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No calculator data found. Use the Calculator tab first to generate progression data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BUNDLES */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <CardTitle className="text-foreground">Bundles</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Bundles will appear here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RESULT */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-foreground">Planner Result</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Planner summary will appear here.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full gap-2">
        <Save className="h-4 w-4" />
        Save Progression Plan
      </Button>
    </div>
  )
}
