'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import {
  Swords,
  Target,
  Pickaxe,
  TrendingUp,
  Crosshair,
  Zap,
  Shield,
  Flame,
  TreePine,
  Mountain,
  Coins,
} from 'lucide-react'

export interface StagePoints {
  training: number
  barbarians: number
  gathering: number
  power: number
  elimination: number
}

export interface EventStats {
  stagePoints: StagePoints
  totalPower: number
  totalFood: number
  totalWood: number
  totalStone: number
  totalGold: number
}

const STAGE_CONFIG = [
  { id: 'training', label: 'Troop Training', icon: Swords, color: 'hsl(210, 80%, 60%)' },
  { id: 'barbarians', label: 'Barbarian Killing', icon: Target, color: 'hsl(0, 75%, 60%)' },
  { id: 'gathering', label: 'Resource Gathering', icon: Pickaxe, color: 'hsl(145, 70%, 50%)' },
  { id: 'power', label: 'Power Gain', icon: TrendingUp, color: 'hsl(35, 90%, 55%)' },
  { id: 'elimination', label: 'Enemy Elimination', icon: Crosshair, color: 'hsl(280, 65%, 60%)' },
] as const

const chartConfig = {
  training: { label: 'Troop Training', color: 'hsl(210, 80%, 60%)' },
  barbarians: { label: 'Barbarian Killing', color: 'hsl(0, 75%, 60%)' },
  gathering: { label: 'Resource Gathering', color: 'hsl(145, 70%, 50%)' },
  power: { label: 'Power Gain', color: 'hsl(35, 90%, 55%)' },
  elimination: { label: 'Enemy Elimination', color: 'hsl(280, 65%, 60%)' },
}

interface EventStatsPanelProps {
  stats: EventStats
}

export function EventStatsPanel({ stats }: EventStatsPanelProps) {
  const totalPoints = useMemo(() => {
    return Object.values(stats.stagePoints).reduce((sum, v) => sum + v, 0)
  }, [stats.stagePoints])

  const pieData = useMemo(() => {
    return STAGE_CONFIG.map(stage => ({
      name: stage.label,
      value: stats.stagePoints[stage.id],
      fill: stage.color,
      id: stage.id,
    })).filter(d => d.value > 0)
  }, [stats.stagePoints])

  const hasData = totalPoints > 0

  return (
    <Card className="border-border">
      <CardContent className="pt-5 pb-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Event Stats</h3>
        </div>

        {/* Total Points */}
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Projected Points</div>
          <div className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</div>
        </div>

        {/* Pie Chart */}
        {hasData ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-muted-foreground">Enter data in stages to see distribution</p>
          </div>
        )}

        {/* Stage Breakdown */}
        <div className="space-y-2">
          {STAGE_CONFIG.map(stage => {
            const Icon = stage.icon
            const pts = stats.stagePoints[stage.id]
            const pct = totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0
            return (
              <div key={stage.id} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: stage.color }} />
                <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground flex-1 truncate">{stage.label}</span>
                <span className="font-medium text-foreground tabular-nums">{pts.toLocaleString()}</span>
                {totalPoints > 0 && (
                  <span className="text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Power & Resources */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Est. Power Gain</span>
            <span className="text-xs font-medium text-foreground ml-auto tabular-nums">{stats.totalPower.toLocaleString()}</span>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Resource Usage</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400 tabular-nums">{stats.totalFood.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TreePine className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600 tabular-nums">{stats.totalWood.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mountain className="h-3 w-3 text-zinc-400" />
                <span className="text-xs text-zinc-400 tabular-nums">{stats.totalStone.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 tabular-nums">{stats.totalGold.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
