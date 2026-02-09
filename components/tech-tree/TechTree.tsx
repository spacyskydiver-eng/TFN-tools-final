'use client'

import React from "react"

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { TechNode } from '@/lib/tech-tree/types'

/* ---------- layout constants ---------- */
const NODE_W = 180
const NODE_H = 58
const PAD_X = 12
const PAD_Y = 8

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
function pctToLevel(clientX: number, rect: DOMRect, maxLevel: number) {
  const pct = clamp((clientX - rect.left) / rect.width, 0, 1)
  return Math.round(pct * maxLevel)
}

/* ---------- props ---------- */
type TechTreeProps = {
  title: string
  nodes: TechNode[]
  current: Record<string, number>
  editingCurrent: boolean
  onCurrentChange: (next: Record<string, number>) => void
  goals: Record<string, number>
  onGoalsChange: React.Dispatch<any>
  onNodeShiftClick?: (id: string, current: number, goal: number) => void
}

export default function TechTree({
  nodes,
  current,
  onCurrentChange,
  editingCurrent,
  goals,
  onGoalsChange,
  onNodeShiftClick,
}: TechTreeProps) {

  /* ---------- actions ---------- */
  const maxAll = () => {
    const next: Record<string, number> = {}
    nodes.forEach(n => (next[n.id] = n.maxLevel))
    if (editingCurrent) { onCurrentChange(next); onGoalsChange(next) }
    else { onGoalsChange(next) }
  }

  const resetAll = () => {
    if (editingCurrent) {
      const base: Record<string, number> = {}
      nodes.forEach(n => (base[n.id] = n.level))
      onCurrentChange(base); onGoalsChange(base)
    } else {
      const next: Record<string, number> = {}
      nodes.forEach(n => { next[n.id] = current[n.id] ?? n.level })
      onGoalsChange(next)
    }
  }

  /* ---------- auto-layout: normalise positions ---------- */
  const { layoutNodes, canvasW, canvasH } = useMemo(() => {
    if (nodes.length === 0) return { layoutNodes: [] as (TechNode & { lx: number; ly: number })[], canvasW: 400, canvasH: 200 }

    const xs = [...new Set(nodes.map(n => n.x))].sort((a, b) => a - b)
    const ys = [...new Set(nodes.map(n => n.y))].sort((a, b) => a - b)

    const COL_GAP = NODE_W + 14
    const ROW_GAP = NODE_H + 6

    const xMap = new Map<number, number>()
    xs.forEach((x, i) => xMap.set(x, PAD_X + i * COL_GAP))

    const yMap = new Map<number, number>()
    ys.forEach((y, i) => yMap.set(y, PAD_Y + i * ROW_GAP))

    const ln = nodes.map(n => ({
      ...n,
      lx: xMap.get(n.x) ?? n.x,
      ly: yMap.get(n.y) ?? n.y,
    }))

    const cw = Math.max(...ln.map(n => n.lx + NODE_W)) + PAD_X
    const ch = Math.max(...ln.map(n => n.ly + NODE_H)) + PAD_Y

    return { layoutNodes: ln, canvasW: cw, canvasH: ch }
  }, [nodes])

  /* ---------- lookup for layout positions ---------- */
  const nodeMap = useMemo(() => {
    const m = new Map<string, { lx: number; ly: number }>()
    layoutNodes.forEach(n => m.set(n.id, { lx: n.lx, ly: n.ly }))
    return m
  }, [layoutNodes])

  /* ---------- branch anchor helpers ---------- */
  const rightAnchorX = (x: number) => x + NODE_W
  const leftAnchorX = (x: number) => x
  const anchorY = (y: number) => y + NODE_H / 2

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[hsl(var(--card))]">
        <p className="text-[11px] text-muted-foreground">
          Shift-click a node to view upgrade cost.
        </p>
        <div className="flex gap-2">
          <button
            onClick={maxAll}
            className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
          >
            Max All
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-1 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold border border-destructive/30 hover:bg-destructive/30 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* scrollable canvas */}
      <div
        className="relative w-full overflow-x-auto overflow-y-auto bg-[hsl(215_40%_14%)]"
        style={{ height: Math.min(canvasH, 420) }}
      >
        <div style={{ width: canvasW, height: canvasH, position: 'relative', minWidth: canvasW }}>
          {/* ---- SVG connection lines ---- */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={canvasW}
            height={canvasH}
          >
            {layoutNodes.map(node =>
              node.parents.map(pid => {
                if (!pid) return null
                const parent = nodeMap.get(pid)
                if (!parent) return null
                return (
                  <line
                    key={`${pid}-${node.id}`}
                    x1={rightAnchorX(parent.lx)}
                    y1={anchorY(parent.ly)}
                    x2={leftAnchorX(node.lx)}
                    y2={anchorY(node.ly)}
                    stroke="hsl(200 60% 50% / 0.35)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                )
              })
            )}
          </svg>

          {/* ---- NODES ---- */}
          {layoutNodes.map(node => {
            const cur = current[node.id] ?? node.level
            const rawGoal = goals[node.id] ?? cur
            const goal = Math.max(rawGoal, cur)

            const curPct = cur / node.maxLevel
            const goalPct = goal / node.maxLevel
            const knobPct = editingCurrent ? curPct : goalPct

            const setFromClientX = (clientX: number, el: HTMLDivElement) => {
              const lvl = pctToLevel(clientX, el.getBoundingClientRect(), node.maxLevel)
              if (editingCurrent) {
                onCurrentChange({ ...current, [node.id]: lvl })
                if (goal < lvl) onGoalsChange({ ...goals, [node.id]: lvl })
              } else {
                onGoalsChange({ ...goals, [node.id]: Math.max(cur, lvl) })
              }
            }

            const hasIcon = node.icon && !node.icon.includes('placeholder')

            return (
              <div
                key={node.id}
                className="absolute select-none group cursor-pointer"
                style={{ left: node.lx, top: node.ly, width: NODE_W, height: NODE_H }}
                onClick={e => {
                  if (e.shiftKey && onNodeShiftClick) {
                    onNodeShiftClick(node.id, cur, goal)
                  }
                }}
              >
                {/* node card */}
                <div className="w-full h-full rounded-lg border-2 border-amber-500/60 bg-[hsl(205_50%_22%)] flex items-center gap-1.5 px-1 transition-all hover:border-amber-400 hover:shadow-[0_0_14px_-4px_hsl(40_80%_50%/0.35)]">
                  {/* icon */}
                  <div className="shrink-0 w-[42px] h-[42px] rounded-md border border-amber-500/50 bg-[hsl(210_40%_18%)] flex items-center justify-center overflow-hidden">
                    {hasIcon ? (
                      <img
                        src={node.icon || "/placeholder.svg"}
                        alt={node.name}
                        className="w-[36px] h-[36px] object-contain"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-[36px] h-[36px] rounded bg-amber-900/30 flex items-center justify-center text-[8px] text-amber-300/60 font-bold leading-tight text-center px-0.5">
                        {node.name.slice(0, 6)}
                      </div>
                    )}
                  </div>

                  {/* text + slider */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-foreground leading-tight truncate">
                      {node.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-tight">
                      {cur}{' / '}{node.maxLevel}
                    </div>
                    {!editingCurrent && goal > cur && (
                      <div className="text-[8px] text-muted-foreground/60 leading-tight">
                        {'Goal: '}{goal}
                      </div>
                    )}
                    {editingCurrent && (
                      <div className="text-[8px] text-amber-400 leading-tight">Set Level</div>
                    )}

                    {/* slider track */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="relative h-[8px] flex-1 rounded-full bg-[hsl(210_30%_12%)] cursor-pointer"
                        onPointerDown={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFromClientX(e.clientX, e.currentTarget)
                        }}
                      >
                        {editingCurrent ? (
                          <div
                            className="absolute inset-y-0 left-0 bg-sky-400 rounded-full transition-[width] duration-100"
                            style={{ width: `${curPct * 100}%` }}
                          />
                        ) : (
                          <>
                            <div
                              className="absolute inset-y-0 left-0 bg-sky-400/25 rounded-full"
                              style={{ width: `${curPct * 100}%` }}
                            />
                            <div
                              className="absolute inset-y-0 left-0 bg-sky-400 rounded-full transition-[width] duration-100"
                              style={{ width: `${goalPct * 100}%` }}
                            />
                          </>
                        )}

                        {/* knob */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100"
                          style={{ left: `calc(${knobPct * 100}% - 5px)` }}
                        >
                          <div
                            className={cn(
                              'w-2.5 h-2.5 rounded-full border-2 border-foreground/80 shadow',
                              editingCurrent ? 'bg-amber-400' : 'bg-sky-400',
                            )}
                          />
                        </div>
                      </div>

                      {/* MAX button */}
                      <button
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (editingCurrent) {
                            onCurrentChange({ ...current, [node.id]: node.maxLevel })
                          }
                          onGoalsChange({ ...goals, [node.id]: node.maxLevel })
                        }}
                        className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-amber-400 text-[hsl(210_40%_12%)] hover:bg-amber-300 transition-colors leading-none"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
