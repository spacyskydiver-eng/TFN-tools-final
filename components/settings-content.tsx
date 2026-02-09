'use client'

import { useTheme, COLOR_PRESETS, BACKGROUND_PRESETS } from '@/lib/theme-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Palette, ImageIcon, Move, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsContent() {
  const {
    settings,
    setColorPreset,
    setBackground,
    setBackgroundOpacity,
    setParallaxEnabled,
    currentColor,
    currentBackground,
  } = useTheme()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Color Theme */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-foreground">Color Theme</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose a primary color for the entire interface
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLOR_PRESETS.map(preset => {
              const isActive = settings.colorPresetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setColorPreset(preset.id)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200',
                    isActive
                      ? 'border-foreground/40 bg-secondary shadow-lg'
                      : 'border-border bg-secondary/40 hover:border-border hover:bg-secondary/70'
                  )}
                >
                  {/* Color swatch */}
                  <div
                    className="h-8 w-8 shrink-0 rounded-full border-2 border-foreground/10 shadow-inner"
                    style={{
                      backgroundColor: `hsl(${preset.hue} ${preset.saturation}% ${preset.lightness}%)`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{preset.name}</div>
                  </div>
                  {isActive && (
                    <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10">
                      <Check className="h-3 w-3 text-foreground" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Preview bar */}
          <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground mb-3">Preview</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="h-10 w-10 rounded-lg"
                style={{ backgroundColor: `hsl(${currentColor.primary})` }}
              />
              <div
                className="h-10 flex-1 max-w-[200px] rounded-lg"
                style={{
                  background: `linear-gradient(90deg, hsl(${currentColor.primary}), hsl(${currentColor.primary} / 0.3))`,
                }}
              />
              <div className="flex gap-1.5">
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: `hsl(${currentColor.primary} / 0.15)` }}
                />
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: `hsl(${currentColor.primary} / 0.30)` }}
                />
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: `hsl(${currentColor.primary} / 0.50)` }}
                />
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: `hsl(${currentColor.primary})` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-foreground">Background</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Set a background image for the entire app
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BACKGROUND_PRESETS.map(bg => {
              const isActive = settings.backgroundId === bg.id
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id)}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border-2 transition-all duration-200',
                    isActive
                      ? 'border-primary shadow-lg shadow-primary/10'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video w-full bg-secondary">
                    {bg.thumbnail ? (
                      <img
                        src={bg.thumbnail || "/placeholder.svg"}
                        alt={bg.name}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-background">
                        <span className="text-xs text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div className="flex items-center justify-between px-3 py-2 bg-card">
                    <span className="text-xs font-medium text-foreground">{bg.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Opacity slider */}
          {currentBackground.src && (
            <div className="space-y-4 rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    Background Opacity
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {settings.backgroundOpacity}% visibility
                  </p>
                </div>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={settings.backgroundOpacity}
                onChange={e => setBackgroundOpacity(Number(e.target.value))}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Subtle</span>
                <span>Visible</span>
              </div>
            </div>
          )}

          {/* Parallax toggle */}
          {currentBackground.src && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <Move className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mouse Parallax Effect</p>
                  <p className="text-xs text-muted-foreground">
                    Background moves subtly with your mouse cursor
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.parallaxEnabled}
                onClick={() => setParallaxEnabled(!settings.parallaxEnabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                  settings.parallaxEnabled ? 'bg-primary' : 'bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-foreground shadow-lg transition-transform duration-200',
                    settings.parallaxEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
