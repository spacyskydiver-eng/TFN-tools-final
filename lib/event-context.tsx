'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  type CalendarEvent,
  generateEarlyKingdomEvents,
  generateMatureSeasonEvents,
  loadSettings,
  loadManualEvents,
} from '@/lib/calendar-engine'

type EventContextType = {
  events: CalendarEvent[]
  refreshEvents: () => void
}

const EventContext = createContext<EventContextType>({
  events: [],
  refreshEvents: () => {},
})

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const refreshEvents = () => {
    const settings = loadSettings()
    const manualEvents = loadManualEvents()

    const now = new Date()
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0)
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    let generated: CalendarEvent[] = []

    if (settings.mode === 'early') {
      generated = generateEarlyKingdomEvents(
        settings.kingdomStartDate,
        settings.firstWheelDate,
        start,
        end
      )
    } else {
      generated = generateMatureSeasonEvents(
        settings.matureSeason,
        start,
        end
      )
    }

    setEvents(
      [...generated, ...manualEvents].sort(
        (a, b) =>
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime()
      )
    )
  }

  useEffect(() => {
    refreshEvents()
  }, [])

  return (
    <EventContext.Provider value={{ events, refreshEvents }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvents() {
  return useContext(EventContext)
}
