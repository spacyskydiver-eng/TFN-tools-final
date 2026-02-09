'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

/* ───────── color presets ───────── */

export type ColorPreset = {
  id: string
  name: string
  hue: number
  saturation: number
  lightness: number
  /* derived CSS values */
  primary: string
  accent: string
  ring: string
  glow: string
  sidebarPrimary: string
  sidebarRing: string
  chart1: string
}

function makePreset(id: string, name: string, h: number, s: number, l: number): ColorPreset {
  return {
    id,
    name,
    hue: h,
    saturation: s,
    lightness: l,
    primary: `${h} ${s}% ${l}%`,
    accent: `${h} ${s}% ${l}%`,
    ring: `${h} ${s}% ${l}%`,
    glow: `${h} ${s}% ${l}%`,
    sidebarPrimary: `${h} ${s}% ${l}%`,
    sidebarRing: `${h} ${s}% ${l}%`,
    chart1: `${h} ${s}% ${l}%`,
  }
}

export const COLOR_PRESETS: ColorPreset[] = [
  makePreset('purple', 'Royal Purple', 262, 80, 60),
  makePreset('blue', 'Ocean Blue', 215, 80, 55),
  makePreset('red', 'Crimson Red', 0, 75, 55),
  makePreset('green', 'Forest Green', 142, 70, 45),
  makePreset('orange', 'Amber Orange', 30, 90, 55),
  makePreset('cyan', 'Arctic Cyan', 190, 80, 50),
  makePreset('gold', 'Imperial Gold', 45, 85, 50),
  makePreset('rose', 'Dusty Rose', 340, 70, 55),
]

/* ───────── background presets ───────── */

export type BackgroundPreset = {
  id: string
  name: string
  src: string | null
  thumbnail: string | null
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'none', name: 'None (Solid)', src: null, thumbnail: null },
  { id: 'medieval-castle', name: 'Medieval Castle', src: '/backgrounds/medieval-castle.jpg', thumbnail: '/backgrounds/medieval-castle.jpg' },
  { id: 'epic-battle', name: 'Epic Battle', src: '/backgrounds/epic-battle.jpg', thumbnail: '/backgrounds/epic-battle.jpg' },
  { id: 'kingdom-overview', name: 'Kingdom Overview', src: '/backgrounds/kingdom-overview.jpg', thumbnail: '/backgrounds/kingdom-overview.jpg' },
  { id: 'abstract-dark', name: 'Abstract Dark', src: '/backgrounds/abstract-dark.jpg', thumbnail: '/backgrounds/abstract-dark.jpg' },
  { id: 'abstract-waves', name: 'Abstract Waves', src: '/backgrounds/abstract-waves.jpg', thumbnail: '/backgrounds/abstract-waves.jpg' },
]

/* ───────── theme state ───────── */

export type ThemeSettings = {
  colorPresetId: string
  backgroundId: string
  backgroundOpacity: number
  parallaxEnabled: boolean
}

const DEFAULT_THEME: ThemeSettings = {
  colorPresetId: 'purple',
  backgroundId: 'none',
  backgroundOpacity: 15,
  parallaxEnabled: true,
}

type ThemeContextType = {
  settings: ThemeSettings
  setColorPreset: (id: string) => void
  setBackground: (id: string) => void
  setBackgroundOpacity: (v: number) => void
  setParallaxEnabled: (v: boolean) => void
  currentColor: ColorPreset
  currentBackground: BackgroundPreset
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/* ───────── provider ───────── */

const STORAGE_KEY = 'rok-theme-settings'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  /* load from localStorage on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ThemeSettings>
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch { /* ignore */ }
    setMounted(true)
  }, [])

  /* persist whenever settings change (only after mount) */
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, mounted])

  /* apply CSS variables whenever color preset changes */
  useEffect(() => {
    if (!mounted) return
    const preset = COLOR_PRESETS.find(p => p.id === settings.colorPresetId) ?? COLOR_PRESETS[0]
    const root = document.documentElement

    root.style.setProperty('--primary', preset.primary)
    root.style.setProperty('--accent', preset.accent)
    root.style.setProperty('--ring', preset.ring)
    root.style.setProperty('--glow', preset.glow)
    root.style.setProperty('--sidebar-primary', preset.sidebarPrimary)
    root.style.setProperty('--sidebar-ring', preset.sidebarRing)
    root.style.setProperty('--chart-1', preset.chart1)
  }, [settings.colorPresetId, mounted])

  const currentColor = COLOR_PRESETS.find(p => p.id === settings.colorPresetId) ?? COLOR_PRESETS[0]
  const currentBackground = BACKGROUND_PRESETS.find(p => p.id === settings.backgroundId) ?? BACKGROUND_PRESETS[0]

  const setColorPreset = useCallback((id: string) => {
    setSettings(prev => ({ ...prev, colorPresetId: id }))
  }, [])

  const setBackground = useCallback((id: string) => {
    setSettings(prev => ({ ...prev, backgroundId: id }))
  }, [])

  const setBackgroundOpacity = useCallback((v: number) => {
    setSettings(prev => ({ ...prev, backgroundOpacity: Math.min(100, Math.max(0, v)) }))
  }, [])

  const setParallaxEnabled = useCallback((v: boolean) => {
    setSettings(prev => ({ ...prev, parallaxEnabled: v }))
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        settings,
        setColorPreset,
        setBackground,
        setBackgroundOpacity,
        setParallaxEnabled,
        currentColor,
        currentBackground,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
