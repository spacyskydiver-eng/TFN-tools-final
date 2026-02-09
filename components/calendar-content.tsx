'use client'

import { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type CalendarEvent = {
  id: string
  title: string
  description: string
  startDate: string // ISO date string
  endDate: string
  category: string
  color: string
}

type ViewMode = 'timeline' | 'cards' | 'calendar'

const EVENT_CATEGORIES = [
  { label: 'Mightiest Governor', color: 'hsl(var(--primary))' },
  { label: 'KvK', color: '#ef4444' },
  { label: 'Osiris League', color: '#f59e0b' },
  { label: 'Ark of Osiris', color: '#22c55e' },
  { label: 'More Than Gems', color: '#8b5cf6' },
  { label: 'Wheel of Fortune', color: '#ec4899' },
  { label: 'Other', color: '#6b7280' },
]

const LS_KEY = 'rok_calendar_events'

function loadEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(events))
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysRemaining(endDate: string) {
  const now = new Date()
  const end = new Date(endDate)
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function CalendarContent() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin ?? false
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    setEvents(loadEvents())
  }, [])

  const persist = (next: CalendarEvent[]) => {
    setEvents(next)
    saveEvents(next)
  }

  const createEvent = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: 'New Event',
      description: '',
      startDate: today,
      endDate: nextWeek,
      category: 'Other',
      color: '#6b7280',
    }
    setEditing(newEvent)
    setShowEditor(true)
  }

  const saveEvent = (event: CalendarEvent) => {
    const exists = events.find(e => e.id === event.id)
    const next = exists
      ? events.map(e => (e.id === event.id ? event : e))
      : [event, ...events]
    persist(next)
    setEditing(null)
    setShowEditor(false)
  }

  const deleteEvent = (id: string) => {
    persist(events.filter(e => e.id !== id))
  }

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events])

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {isAdmin && (
          <Button onClick={createEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        )}
      </div>

      {/* Event Editor Inline */}
      {showEditor && editing && (
        <EventEditor
          event={editing}
          onSave={saveEvent}
          onCancel={() => { setEditing(null); setShowEditor(false) }}
        />
      )}

      {/* Views */}
      {events.length === 0 && !showEditor ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">{isAdmin ? 'Add your first event to get started.' : 'Events will appear here when an admin adds them.'}</p>
            {isAdmin && (
              <Button onClick={createEvent} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'timeline' && (
            <TimelineView events={sortedEvents} onEdit={isAdmin ? (e => { setEditing(e); setShowEditor(true) }) : undefined} onDelete={isAdmin ? deleteEvent : undefined} />
          )}
          {viewMode === 'cards' && (
            <CardsView events={sortedEvents} onEdit={isAdmin ? (e => { setEditing(e); setShowEditor(true) }) : undefined} onDelete={isAdmin ? deleteEvent : undefined} />
          )}
          {viewMode === 'calendar' && (
            <MonthCalendarView events={sortedEvents} onEdit={isAdmin ? (e => { setEditing(e); setShowEditor(true) }) : undefined} onDelete={isAdmin ? deleteEvent : undefined} />
          )}
        </>
      )}
    </div>
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
/*  TIMELINE VIEW (horizontal scroll)                                  */
/* ================================================================== */

function TimelineView({ events, onEdit, onDelete }: {
  events: CalendarEvent[]
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      {events.map((event, idx) => {
        const days = daysRemaining(event.endDate)
        const isActive = days >= 0 && daysRemaining(event.startDate) <= 0
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
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${event.color}20`, color: event.color }}
                  >
                    {event.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                </div>

                {(onEdit || onDelete) && (
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
                {isActive && (
                  <span className="text-primary font-medium">{days}{' days remaining'}</span>
                )}
                {isPast && (
                  <span className="text-destructive font-medium">Ended</span>
                )}
                {!isActive && !isPast && (
                  <span className="text-muted-foreground">{'Starts in '}{Math.abs(daysRemaining(event.startDate))}{' days'}</span>
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

function CardsView({ events, onEdit, onDelete }: {
  events: CalendarEvent[]
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map(event => {
        const days = daysRemaining(event.endDate)
        const isActive = days >= 0 && daysRemaining(event.startDate) <= 0
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
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${event.color}20`, color: event.color }}
                  >
                    {event.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1">{event.title}</h3>
                </div>

                {(onEdit || onDelete) && (
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
                <span className="text-muted-foreground">
                  {formatDate(event.startDate)}{' - '}{formatDate(event.endDate)}
                </span>
                {isActive && (
                  <span className="text-primary font-medium">{days}{'d left'}</span>
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

function MonthCalendarView({ events, onEdit, onDelete }: {
  events: CalendarEvent[]
  onEdit?: (e: CalendarEvent) => void
  onDelete?: (id: string) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => {
      return e.startDate <= dateStr && e.endDate >= dateStr
    })
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
            return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-secondary/20" />
          }

          const dayEvents = getEventsForDay(day)
          const today = new Date()
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

          return (
            <div
              key={day}
              className={`h-24 rounded-lg border p-1 overflow-hidden transition-colors ${
                isToday
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/20'
              }`}
            >
              <div className={`text-xs font-medium mb-0.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => onEdit?.(e)}
                    className="w-full text-left px-1 py-0.5 rounded text-[10px] font-medium truncate transition-colors hover:opacity-80"
                    style={{ backgroundColor: `${e.color}30`, color: e.color }}
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    {'+'}{ dayEvents.length - 3}{' more'}
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
