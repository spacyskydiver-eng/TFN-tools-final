'use client'

import React from "react"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutList,
  LayoutGrid,
  Calendar as CalendarIcon,
  Edit3,
  Settings2,
  AlertTriangle,
  Crown,
  Shield,
  Swords,
  Target,
  Zap,
} from 'lucide-react'
import {
  type CalendarEvent,
  type KingdomMode,
  type MatureSeason,
  type CalendarSettings,
  EVENT_CATEGORIES,
  CATEGORY_COLORS,
  generateEarlyKingdomEvents,
  generateMatureSeasonEvents,
  getKingdomDay,
  loadSettings,
  saveSettings,
  loadManualEvents,
  saveManualEvents,
  defaultSettings,
} from '@/lib/calendar-engine'

/* ------------------------------------------------------------------ */
/*  TYPES & HELPERS                                                    */
/* ------------------------------------------------------------------ */

type ViewMode = 'timeline' | 'cards' | 'calendar'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function daysRemaining(endDate: string) {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const end = new Date(endDate + 'T00:00:00Z')
  const today = new Date(todayStr + 'T00:00:00Z')
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function daysUntilStart(startDate: string) {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const start = new Date(startDate + 'T00:00:00Z')
  const today = new Date(todayStr + 'T00:00:00Z')
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const SEASON_LABELS: Record<MatureSeason, string> = {
  preparation: 'Preparation Season (Early Kingdom)',
  season1: 'Season 1',
  season2: 'Season 2',
  season3: 'Season 3',
  soc: 'Season of Conquest',
}

const SEASON_ICONS: Record<MatureSeason, React.ElementType> = {
  preparation: Crown,
  season1: Shield,
  season2: Swords,
  season3: Target,
  soc: Zap,
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function CalendarContent() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin ?? false

  const [settings, setSettings] = useState<CalendarSettings>(defaultSettings)
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Load saved settings + manual events
  useEffect(() => {
    setSettings(loadSettings())
    setManualEvents(loadManualEvents())
  }, [])

  const updateSettings = useCallback((next: CalendarSettings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const persistManual = useCallback((next: CalendarEvent[]) => {
    setManualEvents(next)
    saveManualEvents(next)
  }, [])

  // Generate range: show ~3 months around current view
  const viewRange = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
    // 4 months ahead
    const endDate = new Date(y, m + 4, 0)
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    // 1 month back
    const startBack = new Date(y, m - 1, 1)
    const startStr = `${startBack.getFullYear()}-${String(startBack.getMonth() + 1).padStart(2, '0')}-01`
    return { start: startStr, end }
  }, [])

  // Calendar view range (for month view, generate wider range)
  const calendarRange = useMemo(() => {
    const y = calendarMonth.getFullYear()
    const m = calendarMonth.getMonth()
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const endDate = new Date(y, m + 1, 0)
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    return { start, end }
  }, [calendarMonth])

  // Use the wider range for list/timeline views, calendar range for month view
  const activeRange = viewMode === 'calendar' ? calendarRange : viewRange

  // Generate auto events
  // Auto-generation only for: early mode (Wheel only if date set), Season 3, SoC
  // Preparation, Season 1, Season 2 → no auto events (admin creates manually)
  const generatedEvents = useMemo(() => {
    if (settings.mode === 'early') {
      // Early kingdom: only generates Wheel events if firstWheelDate is set
      return generateEarlyKingdomEvents(
        settings.kingdomStartDate,
        settings.firstWheelDate,
        activeRange.start,
        activeRange.end,
      )
    }
    // Mature mode — generateMatureSeasonEvents already returns [] for
    // preparation, season1, season2. Only season3 and soc get auto events.
    return generateMatureSeasonEvents(settings.matureSeason, activeRange.start, activeRange.end)
  }, [settings, activeRange])

  // Combine generated + manual events
  const allEvents = useMemo(() => {
    return [...generatedEvents, ...manualEvents].sort(
      (a, b) => new Date(a.startDate + 'T00:00:00Z').getTime() - new Date(b.startDate + 'T00:00:00Z').getTime()
    )
  }, [generatedEvents, manualEvents])

  // Check if early kingdom should suggest switching
  const earlyKingdomDay55Passed = useMemo(() => {
    if (settings.mode !== 'early' && settings.matureSeason !== 'preparation') return false
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const day = getKingdomDay(settings.kingdomStartDate, todayStr)
    return day !== null && day > 55
  }, [settings])

  // Event CRUD for manual events
  const createEvent = () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`
    const newEvent: CalendarEvent = {
      id: `manual-${Date.now()}`,
      title: 'New Event',
      description: '',
      startDate: todayStr,
      endDate: nextWeekStr,
      category: 'Other',
      color: '#6b7280',
      isGenerated: false,
    }
    setEditing(newEvent)
    setShowEditor(true)
  }

  const saveEvent = (event: CalendarEvent) => {
    const exists = manualEvents.find(e => e.id === event.id)
    const next = exists
      ? manualEvents.map(e => (e.id === event.id ? event : e))
      : [event, ...manualEvents]
    persistManual(next)
    setEditing(null)
    setShowEditor(false)
  }

  const deleteEvent = (id: string) => {
    persistManual(manualEvents.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* View mode toggles */}
          {([
            { mode: 'timeline' as ViewMode, icon: LayoutList, label: 'Timeline' },
            { mode: 'cards' as ViewMode, icon: LayoutGrid, label: 'Cards' },
            { mode: 'calendar' as ViewMode, icon: CalendarIcon, label: 'Calendar' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2 bg-transparent"
          >
            <Settings2 className="h-4 w-4" />
            Setup
          </Button>
          {isAdmin && (
            <Button onClick={createEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Kingdom Mode Indicator */}
      <KingdomModeBar settings={settings} />

      {/* Day 55 Warning */}
      {earlyKingdomDay55Passed && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Kingdom Day 55 has passed</p>
              <p className="text-xs text-muted-foreground">
                Your kingdom may be ready to switch to the mature calendar. Update your settings to select a season.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              onClick={() => setShowSettings(true)}
            >
              Switch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Event Editor Inline */}
      {showEditor && editing && (
        <EventEditor
          event={editing}
          onSave={saveEvent}
          onCancel={() => { setEditing(null); setShowEditor(false) }}
        />
      )}

      {/* Views */}
      {allEvents.length === 0 && !showEditor ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No events to display</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure your kingdom settings to auto-generate events, or add events manually.
            </p>
            <Button onClick={() => setShowSettings(true)} variant="outline" className="gap-2 bg-transparent">
              <Settings2 className="h-4 w-4" />
              Open Setup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'timeline' && (
            <TimelineView
              events={allEvents}
              settings={settings}
              onEdit={isAdmin ? (e => { if (!e.isGenerated) { setEditing(e); setShowEditor(true) } }) : undefined}
              onDelete={isAdmin ? (id => { if (!manualEvents.find(e => e.id === id)?.isGenerated) deleteEvent(id) }) : undefined}
            />
          )}
          {viewMode === 'cards' && (
            <CardsView
              events={allEvents}
              settings={settings}
              onEdit={isAdmin ? (e => { if (!e.isGenerated) { setEditing(e); setShowEditor(true) } }) : undefined}
              onDelete={isAdmin ? (id => { if (!manualEvents.find(e => e.id === id)?.isGenerated) deleteEvent(id) }) : undefined}
            />
          )}
          {viewMode === 'calendar' && (
            <MonthCalendarView
              events={allEvents}
              settings={settings}
              currentDate={calendarMonth}
              onDateChange={setCalendarMonth}
              onEdit={isAdmin ? (e => { if (!e.isGenerated) { setEditing(e); setShowEditor(true) } }) : undefined}
              onDelete={isAdmin ? (id => deleteEvent(id)) : undefined}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ================================================================== */
/*  KINGDOM MODE BAR                                                   */
/* ================================================================== */

function KingdomModeBar({ settings }: { settings: CalendarSettings }) {
  const isEarly = settings.mode === 'early' || settings.matureSeason === 'preparation'
  const seasonKey = isEarly ? 'preparation' : settings.matureSeason
  const SeasonIcon = SEASON_ICONS[seasonKey]
  const label = isEarly ? 'Early Kingdom (Preparation Season)' : SEASON_LABELS[settings.matureSeason]

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const kingdomDay = isEarly ? getKingdomDay(settings.kingdomStartDate, todayStr) : null
  // kingdomDay may be null if kingdomStartDate is not set yet

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <SeasonIcon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {isEarly && kingdomDay !== null
            ? `Kingdom Day ${kingdomDay} / 55`
            : isEarly
              ? 'Set a kingdom start date in Setup to track your day'
              : 'Events auto-generated based on repeating schedules'}
        </p>
      </div>
      {isEarly && kingdomDay !== null && (
        <div className="flex-shrink-0">
          <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (kingdomDay / 55) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  SETTINGS PANEL                                                     */
/* ================================================================== */

function SettingsPanel({
  settings,
  onUpdate,
  onClose,
}: {
  settings: CalendarSettings
  onUpdate: (s: CalendarSettings) => void
  onClose: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">Kingdom Calendar Setup</span>
          <Button variant="outline" size="sm" onClick={onClose} className="bg-transparent">
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kingdom Mode */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Kingdom Type</Label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ ...settings, mode: 'early' })}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                settings.mode === 'early'
                  ? 'bg-primary/15 border-primary/50 text-primary'
                  : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
              }`}
            >
              <Crown className="h-4 w-4 mx-auto mb-1" />
              Early Kingdom
            </button>
            <button
              onClick={() => onUpdate({ ...settings, mode: 'mature' })}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                settings.mode === 'mature'
                  ? 'bg-primary/15 border-primary/50 text-primary'
                  : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
              }`}
            >
              <Swords className="h-4 w-4 mx-auto mb-1" />
              Mature Kingdom
            </button>
          </div>
        </div>

        {/* Early Kingdom Setup */}
        {settings.mode === 'early' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kingdom Start Date</Label>
              <Input
                type="date"
                value={settings.kingdomStartDate}
                onChange={e => onUpdate({ ...settings, kingdomStartDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">This becomes Day 1 of your kingdom</p>
            </div>
            <div className="space-y-2">
              <Label>First Cao Cao Wheel of Fortune Date (optional)</Label>
              <Input
                type="date"
                value={settings.firstWheelDate}
                onChange={e => onUpdate({ ...settings, firstWheelDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if unknown. Once set, Wheel events repeat every 2 weeks (3-day duration).
              </p>
            </div>
          </div>
        )}

        {/* Mature Kingdom Setup */}
        {settings.mode === 'mature' && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Select Season</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {(Object.keys(SEASON_LABELS) as MatureSeason[]).map(season => {
                const Icon = SEASON_ICONS[season]
                const isActive = settings.matureSeason === season
                return (
                  <button
                    key={season}
                    onClick={() => onUpdate({ ...settings, matureSeason: season })}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/15 border-primary/50 text-primary'
                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">{SEASON_LABELS[season].replace(' (Early Kingdom)', '')}</span>
                  </button>
                )
              })}
            </div>

            {/* Show early kingdom fields if Preparation season is selected */}
            {settings.matureSeason === 'preparation' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="space-y-2">
                  <Label>Kingdom Start Date</Label>
                  <Input
                    type="date"
                    value={settings.kingdomStartDate}
                    onChange={e => onUpdate({ ...settings, kingdomStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>First Cao Cao Wheel of Fortune Date (optional)</Label>
                  <Input
                    type="date"
                    value={settings.firstWheelDate}
                    onChange={e => onUpdate({ ...settings, firstWheelDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank if unknown. Wheel events only appear once this is set.
                  </p>
                </div>
              </div>
            )}

            {/* Info note for seasons without auto events */}
            {(settings.matureSeason === 'season1' || settings.matureSeason === 'season2') && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <p className="text-sm text-muted-foreground">
                  {SEASON_LABELS[settings.matureSeason]} does not have automatic global event schedules.
                  Admins can manually create events using the Add Event button above.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  EVENT EDITOR                                                       */
/* ================================================================== */

function EventEditor({ event, onSave, onCancel }: {
  event: CalendarEvent
  onSave: (e: CalendarEvent) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [startDate, setStartDate] = useState(event.startDate)
  const [endDate, setEndDate] = useState(event.endDate)
  const [category, setCategory] = useState(event.category)
  const [color, setColor] = useState(event.color)

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name" />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => { setCategory(cat.label); setColor(cat.color) }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    category === cat.label
                      ? 'text-primary-foreground border-transparent'
                      : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
                  }`}
                  style={category === cat.label ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..." rows={2} />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="bg-transparent">Cancel</Button>
          <Button onClick={() => onSave({ ...event, title, description, startDate, endDate, category, color })}>
            Save Event
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  TIMELINE VIEW                                                      */
/* ================================================================== */

function TimelineView({ events, settings, onEdit, onDelete }: {
  events: CalendarEvent[]
  settings: CalendarSettings
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  const isEarly = settings.mode === 'early' || settings.matureSeason === 'preparation'

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const days = daysRemaining(event.endDate)
        const startDays = daysUntilStart(event.startDate)
        const isActive = days >= 0 && startDays <= 0
        const isPast = days < 0

        return (
          <div
            key={event.id}
            className={`flex items-stretch gap-4 rounded-xl border bg-card p-4 transition-all duration-300 ${
              isActive
                ? 'border-primary/50 shadow-[0_0_20px_-6px_hsl(var(--glow)/0.2)]'
                : isPast
                ? 'border-border opacity-60'
                : 'border-border hover:border-primary/30'
            }`}
          >
            {/* Color stripe */}
            <div
              className="w-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.category}
                    </span>
                    {event.isGenerated && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        Auto
                      </span>
                    )}
                    {isEarly && !event.isGenerated && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        Manual
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                </div>

                {!event.isGenerated && (onEdit || onDelete) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {onEdit && (
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-transparent" onClick={() => onEdit(event)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent" onClick={() => onDelete(event.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(event.startDate)}{' - '}{formatDate(event.endDate)}</span>
                {isEarly && getKingdomDay(settings.kingdomStartDate, event.startDate) !== null && (
                  <span className="text-xs text-muted-foreground/70">
                    Day {getKingdomDay(settings.kingdomStartDate, event.startDate)}
                    {event.startDate !== event.endDate && getKingdomDay(settings.kingdomStartDate, event.endDate) !== null && ` - ${getKingdomDay(settings.kingdomStartDate, event.endDate)}`}
                  </span>
                )}
                {isActive && (
                  <span className="text-primary font-medium">{days} day{days !== 1 ? 's' : ''} remaining</span>
                )}
                {isPast && (
                  <span className="text-destructive font-medium">Ended</span>
                )}
                {!isActive && !isPast && (
                  <span className="text-muted-foreground">Starts in {startDays} day{startDays !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  CARDS VIEW                                                         */
/* ================================================================== */

function CardsView({ events, settings, onEdit, onDelete }: {
  events: CalendarEvent[]
  settings: CalendarSettings
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  const isEarly = settings.mode === 'early' || settings.matureSeason === 'preparation'

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map(event => {
        const days = daysRemaining(event.endDate)
        const startDays = daysUntilStart(event.startDate)
        const isActive = days >= 0 && startDays <= 0
        const isPast = days < 0

        return (
          <Card
            key={event.id}
            className={`overflow-hidden transition-all duration-300 ${
              isActive
                ? 'border-primary/50 shadow-[0_0_20px_-6px_hsl(var(--glow)/0.2)]'
                : isPast
                ? 'border-border opacity-60'
                : 'border-border hover:border-primary/30'
            }`}
          >
            {/* Color bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: event.color }} />

            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.category}
                    </span>
                    {event.isGenerated && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        Auto
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">{event.title}</h3>
                </div>

                {!event.isGenerated && (onEdit || onDelete) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {onEdit && (
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-transparent" onClick={() => onEdit(event)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent" onClick={() => onDelete(event.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">
                    {formatDate(event.startDate)}{' - '}{formatDate(event.endDate)}
                  </span>
                  {isEarly && getKingdomDay(settings.kingdomStartDate, event.startDate) !== null && (
                    <span className="text-muted-foreground/70">
                      Day {getKingdomDay(settings.kingdomStartDate, event.startDate)}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="text-primary font-medium">{days}d left</span>
                )}
                {isPast && (
                  <span className="text-destructive font-medium">Ended</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  MONTH CALENDAR VIEW                                                */
/* ================================================================== */

function MonthCalendarView({ events, settings, currentDate, onDateChange, onEdit, onDelete }: {
  events: CalendarEvent[]
  settings: CalendarSettings
  currentDate: Date
  onDateChange: (d: Date) => void
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const isEarly = settings.mode === 'early' || settings.matureSeason === 'preparation'

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const prevMonth = () => onDateChange(new Date(year, month - 1, 1))
  const nextMonth = () => onDateChange(new Date(year, month + 1, 1))

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevMonth} className="bg-transparent">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-bold text-foreground">{monthLabel}</h3>
        <Button variant="outline" size="sm" onClick={nextMonth} className="bg-transparent">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-28 rounded-lg bg-secondary/20" />
          }

          const dayEvents = getEventsForDay(day)
          const today = new Date()
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const kingdomDay = isEarly ? getKingdomDay(settings.kingdomStartDate, dateStr) : null

          return (
            <div
              key={day}
              className={`h-28 rounded-lg border p-1 overflow-hidden transition-colors ${
                isToday
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day}
                </span>
                {kingdomDay !== null && kingdomDay > 0 && kingdomDay <= 55 && !Number.isNaN(kingdomDay) && (
                  <span className="text-[9px] text-muted-foreground/60 font-mono">
                    D{kingdomDay}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 overflow-hidden mt-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => !e.isGenerated && onEdit?.(e)}
                    className={`w-full text-left px-1 py-0.5 rounded text-[10px] font-medium truncate transition-colors hover:opacity-80 ${
                      e.isGenerated ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    style={{ backgroundColor: `${e.color}30`, color: e.color }}
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}