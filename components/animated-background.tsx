'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

export function AnimatedBackground() {
  const { currentBackground, settings } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!settings.parallaxEnabled || !currentBackground.src) return

    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx
      const dy = (e.clientY - cy) / cy
      setOffset({ x: dx * 12, y: dy * 12 })
    }

    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [settings.parallaxEnabled, currentBackground.src])

  if (!currentBackground.src) return null

  const opacity = settings.backgroundOpacity / 100

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-[-24px] bg-cover bg-center transition-transform duration-300 ease-out"
        style={{
          backgroundImage: `url(${currentBackground.src})`,
          opacity,
          transform: settings.parallaxEnabled
            ? `translate(${offset.x}px, ${offset.y}px) scale(1.05)`
            : 'scale(1.05)',
        }}
      />
      {/* Dark overlay to keep text readable */}
      <div
        className="absolute inset-0 bg-background"
        style={{ opacity: Math.max(0.55, 1 - opacity) }}
      />
    </div>
  )
}
