'use client'

import Image from 'next/image'
import clsx from 'clsx'
import type { TechNode } from '@/lib/tech-tree/types'

/* ---------- layout tuning ---------- */
const NODE_WIDTH = 360
const NODE_HEIGHT = 150

const OFFSET_X = 40
const OFFSET_Y = 60
const SCALE = 0.65

const PAD_RIGHT = 160
const PAD_BOTTOM = 180

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

function pctToLevel(clientX: number, rect: DOMRect, maxLevel: number) {
  const pct = clamp((clientX - rect.left) / rect.width, 0, 1)
  return Math.round(pct * maxLevel)
}

type TechTreeProps = {
  title: string
  nodes: TechNode[]
  current: Record<string, number>
  editingCurrent: boolean
  onCurrentChange: (next: Record<string, number>) => void
  goals: Record<string, number>
  onGoalsChange: (next: Record<string, number>) => void
  onNodeShiftClick?: (id: string, current: number, goal: number) => void
}

export default function TechTree({
  title,
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
    if (editingCurrent) onCurrentChange(next)
    onGoalsChange(next)
  }

  const resetAll = () => {
    const next: Record<string, number> = {}
    nodes.forEach(n => (next[n.id] = current[n.id] ?? n.level))
    if (editingCurrent) onCurrentChange(next)
    onGoalsChange(next)
  }

  /* ---------- canvas bounds ---------- */
  const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH), 0)
  const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT), 0)

  const canvasWidth = (OFFSET_X + maxX + PAD_RIGHT) * SCALE
  const canvasHeight = (OFFSET_Y + maxY + PAD_BOTTOM) * SCALE

  const parentAnchorX = (x: number) => x + NODE_WIDTH
  const anchorY = (y: number) => y + NODE_HEIGHT / 2

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0b4e87] to-[#08345d] p-4 shadow-2xl">

      {title && (
        <div className="mb-4 text-white text-xl font-bold">
          {title}
        </div>
      )}

      {/* controls */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-white/70">
          Shift-click a node to view upgrade cost.
        </p>

        <div className="flex gap-2">
          <button
            onClick={maxAll}
            className="px-3 py-1 rounded-lg bg-yellow-300/20 text-yellow-100 text-xs font-semibold border border-yellow-300/30 hover:bg-yellow-300/30 transition-colors"
          >
            Max All
          </button>

          <button
            onClick={resetAll}
            className="px-3 py-1 rounded-lg bg-red-500/20 text-red-100 text-xs font-semibold border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* scroll viewport */}
      <div className="relative w-full h-[520px] overflow-x-auto overflow-y-hidden">
        <div
  className="relative"
  style={{
    width: '100%',
    height: canvasHeight,
  }}
>
<div
  className="absolute top-0 left-0 origin-top-left"
  style={{
    width: maxX + PAD_RIGHT,
    height: maxY + PAD_BOTTOM,
    transform: `scale(${SCALE}) translate(${OFFSET_X}px, ${OFFSET_Y}px)`,
  }}
>


            {/* ---------- CONNECTION LINES ---------- */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={maxX + PAD_RIGHT + 300}
              height={maxY + PAD_BOTTOM + 300}
            >
              {nodes.map(node =>
                (node.parents ?? []).map(pid => {
                  if (!pid) return null
                  const parent = nodes.find(n => n.id === pid)
                  if (!parent) return null

                  return (
                    <line
                      key={`${pid}-${node.id}`}
                      x1={parentAnchorX(parent.x)}
                      y1={anchorY(parent.y)}
                      x2={node.x}
                      y2={anchorY(node.y)}
                      stroke="#2c7ec7"
                      strokeWidth={3}
                      strokeDasharray="8 6"
                    />
                  )
                })
              )}
            </svg>

            {/* ---------- NODES ---------- */}
            {nodes.map(node => {
              const currentLevel = current[node.id] ?? node.level
              const rawGoal = goals[node.id] ?? currentLevel
              const goalLevel = Math.max(rawGoal, currentLevel)

              const curPct = currentLevel / node.maxLevel
              const goalPct = goalLevel / node.maxLevel
              const knobPct = editingCurrent ? curPct : goalPct

              const setFromClientX = (clientX: number, el: HTMLDivElement) => {
                const lvl = pctToLevel(clientX, el.getBoundingClientRect(), node.maxLevel)

                if (editingCurrent) {
                  onCurrentChange({ ...current, [node.id]: lvl })
                  if ((goals[node.id] ?? lvl) < lvl)
                    onGoalsChange({ ...goals, [node.id]: lvl })
                } else {
                  const safeGoal = Math.max(currentLevel, lvl)
                  onGoalsChange({ ...goals, [node.id]: safeGoal })
                }
              }

              return (
                <div
                  key={node.id}
                  className="absolute select-none w-[360px] h-[150px] rounded-xl bg-[#1b6fa8] border border-white/20 transition-all duration-200 hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(0,200,255,0.6)] shadow-[0_0_30px_rgba(0,160,255,0.25)]"
                  style={{ left: node.x, top: node.y }}
                  onClick={e => {
                    if (e.shiftKey && onNodeShiftClick) {
                      onNodeShiftClick(node.id, currentLevel, goalLevel)
                    }
                  }}
                >
                  {/* ICON */}
                  <div className="absolute -left-8 top-4 w-[110px] h-[110px] rounded-xl bg-gradient-to-br from-[#ffe28a] via-[#d6a93b] to-[#9c6b12] flex items-center justify-center">
                    <div className="w-[100px] h-[100px] rounded-lg bg-[#0e4f7c] flex items-center justify-center overflow-hidden">
                      <Image
                        src={node.icon || '/placeholder.svg'}
                        alt={node.name}
                        width={90}
                        height={90}
                      />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="pl-24 pr-5 py-6 text-white">
                    <div className="text-2xl font-extrabold">{node.name}</div>

                    <div className="text-xl text-white/80 mb-2">
                      {currentLevel} / {node.maxLevel}
                      {!editingCurrent && goalLevel > currentLevel && (
                        <div className="text-sm text-white/60">
                          Goal: {goalLevel}
                        </div>
                      )}
                    </div>

                    {/* ---------- LEVEL BAR ---------- */}
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="relative h-[8px] w-[170px] rounded-full bg-[#0b3556] cursor-pointer"
                        onPointerDown={e => {
                          e.preventDefault()
                          setFromClientX(e.clientX, e.currentTarget)
                        }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-sky-400/25 rounded-full"
                          style={{ width: `${curPct * 100}%` }}
                        />

                        {!editingCurrent && (
                          <div
                            className="absolute inset-y-0 left-0 bg-sky-400 rounded-full"
                            style={{ width: `${goalPct * 100}%` }}
                          />
                        )}

                        {editingCurrent && (
                          <div
                            className="absolute inset-y-0 left-0 bg-sky-400 rounded-full"
                            style={{ width: `${curPct * 100}%` }}
                          />
                        )}

                        {/* knob */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2"
                          style={{ left: `calc(${knobPct * 100}% - 5px)` }}
                        >
                          <div
                            className={clsx(
                              'w-2.5 h-2.5 rounded-full border-2 border-white shadow',
                              editingCurrent
                                ? 'bg-amber-400'
                                : 'bg-sky-400'
                            )}
                          />
                        </div>
                      </div>

                      {/* MAX button */}
                      <button
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()

                          const next = {
                            ...goals,
                            [node.id]: node.maxLevel,
                          }

                          onGoalsChange(next)

                          if (editingCurrent) {
                            onCurrentChange({
                              ...current,
                              [node.id]: node.maxLevel,
                            })
                          }
                        }}
                        className="px-2 py-[2px] text-[10px] font-bold rounded bg-amber-400 text-black hover:bg-amber-300 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
