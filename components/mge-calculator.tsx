'use client'

import React, { useCallback, useEffect } from "react"

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Swords,
  Target,
  Pickaxe,
  TrendingUp,
  Crosshair,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  TreePine,
  Mountain,
  Coins,
  Zap,
  Shield,
  Save,
  Check,
} from 'lucide-react'
import {
  type Tier,
  type TroopType,
  TROOP_TYPES,
  TIERS,
  getPathsForTier,
  calcTraining,
  calcUpgrade,
  calcFromSpeedups,
  calcFromMgePoints,
  formatTime,
  type TrainingResult,
} from '@/lib/game/troops'
import { EventStatsPanel, type EventStats, type StagePoints } from '@/components/event-stats-panel'

/* ================================================================== */
/*  STAGE DEFINITIONS                                                  */
/* ================================================================== */

const STAGES = [
  { id: 'training', num: 'I', label: 'Troop Training', icon: Swords, color: 'hsl(210, 80%, 60%)' },
  { id: 'barbarians', num: 'II', label: 'Barbarian Killing', icon: Target, color: 'hsl(0, 75%, 60%)' },
  { id: 'gathering', num: 'III', label: 'Resource Gathering', icon: Pickaxe, color: 'hsl(145, 70%, 50%)' },
  { id: 'power', num: 'IV', label: 'Power Gain', icon: TrendingUp, color: 'hsl(35, 90%, 55%)' },
  { id: 'elimination', num: 'V', label: 'Enemy Elimination', icon: Crosshair, color: 'hsl(280, 65%, 60%)' },
] as const

type StageId = (typeof STAGES)[number]['id']

/* ================================================================== */
/*  PERSISTED STATE TYPES                                              */
/* ================================================================== */

type TierInputs = Record<string, Record<TroopType, number>>

interface TrainingStageState {
  mode: CalcMode
  speedBonus: string
  mainInputs: TierInputs
  mainExpandedTiers: Tier[]
  speedupsDays: string
  speedupsHours: string
  speedupsMinutes: string
  speedupsFood: string
  speedupsWood: string
  speedupsStone: string
  speedupsGold: string
  speedupsTroopType: TroopType
  speedupsTier: Tier
  speedupsFromTier: string
  mgeTargetPoints: string
  mgeTroopType: TroopType
  mgeTier: Tier
  mgeFromTier: string
}

interface PlaceholderStageState {
  points: string
}

interface AllStageData {
  training: TrainingStageState
  barbarians: PlaceholderStageState
  gathering: PlaceholderStageState
  power: PlaceholderStageState
  elimination: PlaceholderStageState
}

const DEFAULT_TRAINING_STATE: TrainingStageState = {
  mode: 'main',
  speedBonus: '',
  mainInputs: {},
  mainExpandedTiers: [5],
  speedupsDays: '',
  speedupsHours: '',
  speedupsMinutes: '',
  speedupsFood: '',
  speedupsWood: '',
  speedupsStone: '',
  speedupsGold: '',
  speedupsTroopType: 'infantry',
  speedupsTier: 4,
  speedupsFromTier: 'scratch',
  mgeTargetPoints: '',
  mgeTroopType: 'infantry',
  mgeTier: 4,
  mgeFromTier: 'scratch',
}

const DEFAULT_PLACEHOLDER_STATE: PlaceholderStageState = { points: '' }

const DEFAULT_ALL_STAGE_DATA: AllStageData = {
  training: { ...DEFAULT_TRAINING_STATE },
  barbarians: { ...DEFAULT_PLACEHOLDER_STATE },
  gathering: { ...DEFAULT_PLACEHOLDER_STATE },
  power: { ...DEFAULT_PLACEHOLDER_STATE },
  elimination: { ...DEFAULT_PLACEHOLDER_STATE },
}

const STORAGE_KEY = 'mge_calculator_data'

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */

export function MgeCalculator() {
  const [activeStage, setActiveStage] = useState<StageId>('training')
  const [stageData, setStageData] = useState<AllStageData>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_ALL_STAGE_DATA }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AllStageData
        return { ...DEFAULT_ALL_STAGE_DATA, ...parsed }
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_ALL_STAGE_DATA }
  })
  const [saveFlash, setSaveFlash] = useState<StageId | null>(null)

  const updateTrainingState = useCallback((updates: Partial<TrainingStageState>) => {
    setStageData(prev => ({
      ...prev,
      training: { ...prev.training, ...updates },
    }))
  }, [])

  const updatePlaceholderState = useCallback((stageId: 'barbarians' | 'gathering' | 'power' | 'elimination', updates: Partial<PlaceholderStageState>) => {
    setStageData(prev => ({
      ...prev,
      [stageId]: { ...prev[stageId], ...updates },
    }))
  }, [])

  const handleSaveStage = useCallback((stageId: StageId) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stageData))
      setSaveFlash(stageId)
      setTimeout(() => setSaveFlash(null), 1500)
    } catch { /* ignore */ }
  }, [stageData])

  // Compute training points from the training stage data
  const trainingResult = useMemo(() => {
    const state = stageData.training
    const speedBonus = Number(state.speedBonus) || 0
    const total: TrainingResult = { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }

    // Main mode results
    for (const tier of TIERS) {
      const paths = getPathsForTier(tier)
      for (const path of paths) {
        const pathInputs = state.mainInputs[path.key]
        if (!pathInputs) continue
        for (const tt of TROOP_TYPES) {
          const count = pathInputs[tt.id] || 0
          if (count <= 0) continue
          let result: TrainingResult | null = null
          if (path.from === null) {
            result = calcTraining(tier, count, speedBonus)
          } else {
            result = calcUpgrade(path.from, tier, count, speedBonus)
          }
          if (result) {
            total.troops += result.troops
            total.time += result.time
            total.food += result.food
            total.wood += result.wood
            total.stone += result.stone
            total.gold += result.gold
            total.power += result.power
            total.mgePoints += result.mgePoints
            total.kvkPoints += result.kvkPoints
          }
        }
      }
    }
    return total
  }, [stageData.training])

  const stagePoints: StagePoints = useMemo(() => ({
    training: trainingResult.mgePoints,
    barbarians: Number(stageData.barbarians.points) || 0,
    gathering: Number(stageData.gathering.points) || 0,
    power: Number(stageData.power.points) || 0,
    elimination: Number(stageData.elimination.points) || 0,
  }), [trainingResult.mgePoints, stageData.barbarians.points, stageData.gathering.points, stageData.power.points, stageData.elimination.points])

  const eventStats: EventStats = useMemo(() => ({
    stagePoints,
    totalPower: trainingResult.power,
    totalFood: trainingResult.food,
    totalWood: trainingResult.wood,
    totalStone: trainingResult.stone,
    totalGold: trainingResult.gold,
  }), [stagePoints, trainingResult])

  return (
    <div className="space-y-6 max-w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Swords className="h-7 w-7 text-primary" />
          MGE Calculator
        </h2>
        <p className="text-muted-foreground">Mightiest Governor Event planner and calculator</p>
      </div>

      {/* Stage Progress Bar */}
      <StageProgressBar active={activeStage} onChange={setActiveStage} />

      {/* Stage Content + Stats Panel */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 min-h-[400px]">
          {activeStage === 'training' && (
            <TrainingStage
              state={stageData.training}
              onUpdate={updateTrainingState}
              onSave={() => handleSaveStage('training')}
              saved={saveFlash === 'training'}
            />
          )}
          {activeStage === 'barbarians' && (
            <PlaceholderStage
              stage="Barbarian Killing"
              description="Calculator for barbarian kills, points per barb level, and march stamina planning."
              points={stageData.barbarians.points}
              onPointsChange={(v) => updatePlaceholderState('barbarians', { points: v })}
              onSave={() => handleSaveStage('barbarians')}
              saved={saveFlash === 'barbarians'}
            />
          )}
          {activeStage === 'gathering' && (
            <PlaceholderStage
              stage="Resource Gathering"
              description="Calculator for gathering nodes, march capacity, gathering speed bonuses, and point targets."
              points={stageData.gathering.points}
              onPointsChange={(v) => updatePlaceholderState('gathering', { points: v })}
              onSave={() => handleSaveStage('gathering')}
              saved={saveFlash === 'gathering'}
            />
          )}
          {activeStage === 'power' && (
            <PlaceholderStage
              stage="Power Gain"
              description="Calculator for power increase via buildings, technology, troops, and commander upgrades."
              points={stageData.power.points}
              onPointsChange={(v) => updatePlaceholderState('power', { points: v })}
              onSave={() => handleSaveStage('power')}
              saved={saveFlash === 'power'}
            />
          )}
          {activeStage === 'elimination' && (
            <PlaceholderStage
              stage="Enemy Elimination"
              description="Calculator for kill points, troop tier kill values, and hospital capacity planning."
              points={stageData.elimination.points}
              onPointsChange={(v) => updatePlaceholderState('elimination', { points: v })}
              onSave={() => handleSaveStage('elimination')}
              saved={saveFlash === 'elimination'}
            />
          )}
        </div>

        {/* Event Stats Side Panel */}
        <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-4">
          <EventStatsPanel stats={eventStats} />
        </div>
      </div>

      {/* Mobile Stats Panel */}
      <div className="lg:hidden">
        <EventStatsPanel stats={eventStats} />
      </div>
    </div>
  )
}

/* ================================================================== */
/*  STAGE PROGRESS BAR                                                 */
/* ================================================================== */

function StageProgressBar({ active, onChange }: { active: StageId; onChange: (id: StageId) => void }) {
  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-border" />

      <div className="relative flex items-start justify-between">
        {STAGES.map((stage) => {
          const Icon = stage.icon
          const isActive = active === stage.id
          return (
            <button
              key={stage.id}
              onClick={() => onChange(stage.id)}
              className="group flex flex-col items-center gap-2 relative z-10"
              style={{ width: '18%' }}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-primary bg-primary/20 shadow-[0_0_20px_-2px_hsl(var(--primary)/0.4)]'
                    : 'border-border bg-card hover:border-muted-foreground'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={`text-lg font-bold transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {stage.num}
                </span>
                <span
                  className={`text-[10px] font-medium text-center leading-tight transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PLACEHOLDER STAGE                                                  */
/* ================================================================== */

function PlaceholderStage({
  stage,
  description,
  points,
  onPointsChange,
  onSave,
  saved,
}: {
  stage: string
  description: string
  points: string
  onPointsChange: (v: string) => void
  onSave: () => void
  saved: boolean
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Swords className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{stage}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>

        <div className="flex items-center gap-3 mb-4">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Estimated Points:</Label>
          <Input
            type="number"
            min={0}
            value={points}
            onChange={e => onPointsChange(e.target.value)}
            placeholder="0"
            className="w-32"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className={`gap-2 transition-colors ${saved ? 'border-green-500/50 text-green-400' : ''}`}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? 'Saved' : 'Save Stage'}
        </Button>

        <p className="text-xs text-muted-foreground/60 mt-4">Full calculator coming soon</p>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  TROOP TRAINING STAGE                                               */
/* ================================================================== */

type CalcMode = 'main' | 'speedups' | 'mge-points'

function TrainingStage({
  state,
  onUpdate,
  onSave,
  saved,
}: {
  state: TrainingStageState
  onUpdate: (updates: Partial<TrainingStageState>) => void
  onSave: () => void
  saved: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'main' as CalcMode, label: 'Main' },
          { id: 'speedups' as CalcMode, label: 'Based on Speedups' },
          { id: 'mge-points' as CalcMode, label: 'Based on MGE Points' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => onUpdate({ mode: m.id })}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              state.mode === m.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Speed bonus input (shared) */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Training Speed Bonus:</Label>
            <Input
              type="number"
              value={state.speedBonus}
              onChange={e => onUpdate({ speedBonus: e.target.value })}
              placeholder="0"
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      {/* Mode content */}
      {state.mode === 'main' && (
        <MainCalcMode
          speedBonus={Number(state.speedBonus) || 0}
          inputs={state.mainInputs}
          expandedTiers={state.mainExpandedTiers}
          onInputsChange={(inputs) => onUpdate({ mainInputs: inputs })}
          onExpandedChange={(tiers) => onUpdate({ mainExpandedTiers: tiers })}
        />
      )}
      {state.mode === 'speedups' && (
        <SpeedupsCalcMode
          speedBonus={Number(state.speedBonus) || 0}
          state={state}
          onUpdate={onUpdate}
        />
      )}
      {state.mode === 'mge-points' && (
        <MgePointsCalcMode
          speedBonus={Number(state.speedBonus) || 0}
          state={state}
          onUpdate={onUpdate}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className={`gap-2 transition-colors ${saved ? 'border-green-500/50 text-green-400' : ''}`}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? 'Saved' : 'Save Stage'}
        </Button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  MAIN CALC MODE - Training by troop count per tier                  */
/* ================================================================== */

function MainCalcMode({
  speedBonus,
  inputs,
  expandedTiers,
  onInputsChange,
  onExpandedChange,
}: {
  speedBonus: number
  inputs: TierInputs
  expandedTiers: Tier[]
  onInputsChange: (inputs: TierInputs) => void
  onExpandedChange: (tiers: Tier[]) => void
}) {
  const expandedSet = useMemo(() => new Set(expandedTiers), [expandedTiers])

  const toggleTier = (t: Tier) => {
    const next = new Set(expandedSet)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    onExpandedChange(Array.from(next))
  }

  const setInput = (pathKey: string, troopType: TroopType, value: number) => {
    onInputsChange({
      ...inputs,
      [pathKey]: {
        ...(inputs[pathKey] || { infantry: 0, archer: 0, cavalry: 0, siege: 0 }),
        [troopType]: value,
      },
    })
  }

  const resetPath = (pathKey: string) => {
    const next = { ...inputs }
    delete next[pathKey]
    onInputsChange(next)
  }

  // Calculate all results for a tier section
  const tierResults = useMemo(() => {
    const results: Record<Tier, TrainingResult> = {} as Record<Tier, TrainingResult>
    for (const tier of TIERS) {
      const paths = getPathsForTier(tier)
      const total: TrainingResult = { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }

      for (const path of paths) {
        const pathInputs = inputs[path.key]
        if (!pathInputs) continue

        for (const tt of TROOP_TYPES) {
          const count = pathInputs[tt.id] || 0
          if (count <= 0) continue

          let result: TrainingResult | null = null
          if (path.from === null) {
            result = calcTraining(tier, count, speedBonus)
          } else {
            result = calcUpgrade(path.from, tier, count, speedBonus)
          }
          if (result) {
            total.troops += result.troops
            total.time += result.time
            total.food += result.food
            total.wood += result.wood
            total.stone += result.stone
            total.gold += result.gold
            total.power += result.power
            total.mgePoints += result.mgePoints
            total.kvkPoints += result.kvkPoints
          }
        }
      }
      results[tier] = total
    }
    return results
  }, [inputs, speedBonus])

  const grandTotal = useMemo(() => {
    const total: TrainingResult = { troops: 0, time: 0, food: 0, wood: 0, stone: 0, gold: 0, power: 0, mgePoints: 0, kvkPoints: 0 }
    for (const tier of TIERS) {
      const t = tierResults[tier]
      total.troops += t.troops
      total.time += t.time
      total.food += t.food
      total.wood += t.wood
      total.stone += t.stone
      total.gold += t.gold
      total.power += t.power
      total.mgePoints += t.mgePoints
      total.kvkPoints += t.kvkPoints
    }
    return total
  }, [tierResults])

  return (
    <div className="space-y-3">
      {TIERS.map(tier => {
        const expanded = expandedSet.has(tier)
        const paths = getPathsForTier(tier)
        const totals = tierResults[tier]

        return (
          <div key={tier} className="space-y-2">
            {/* Tier header */}
            <button
              onClick={() => toggleTier(tier)}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/20">
                {expanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                <span className="text-sm font-bold text-primary">T{tier}</span>
              </div>
              {!expanded && totals.mgePoints > 0 && (
                <span className="text-xs text-muted-foreground">
                  {totals.mgePoints.toLocaleString()} MGE pts
                </span>
              )}
            </button>

            {/* Tier content */}
            {expanded && (
              <div className="space-y-3">
                {/* Path cards in a horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {paths.map(path => {
                    const pathInputs = inputs[path.key] || { infantry: 0, archer: 0, cavalry: 0, siege: 0 }
                    const tierColor = tier === 5 ? 'text-amber-400' : tier === 4 ? 'text-violet-400' : tier === 3 ? 'text-sky-400' : tier === 2 ? 'text-emerald-400' : 'text-zinc-400'

                    return (
                      <Card key={path.key} className="flex-shrink-0 w-[200px] border-border">
                        <CardContent className="pt-3 pb-3 px-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${tierColor}`}>{path.label}</span>
                            <button
                              onClick={() => resetPath(path.key)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </div>

                          {TROOP_TYPES.map(tt => (
                            <div key={tt.id} className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground w-14">{tt.label}</span>
                              <Input
                                type="number"
                                min={0}
                                value={pathInputs[tt.id] || ''}
                                onChange={e => setInput(path.key, tt.id, Number(e.target.value) || 0)}
                                className="h-7 text-xs"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Tier totals */}
                {totals.mgePoints > 0 && (
                  <ResultsBar result={totals} compact />
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Grand total */}
      {grandTotal.mgePoints > 0 && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-bold text-foreground mb-3">Overall Totals</div>
            <ResultsBar result={grandTotal} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ================================================================== */
/*  SPEEDUPS CALC MODE                                                 */
/* ================================================================== */

function SpeedupsCalcMode({
  speedBonus,
  state,
  onUpdate,
}: {
  speedBonus: number
  state: TrainingStageState
  onUpdate: (updates: Partial<TrainingStageState>) => void
}) {
  const result = useMemo(() => {
    const speedupSec = (Number(state.speedupsDays) || 0) * 86400 + (Number(state.speedupsHours) || 0) * 3600 + (Number(state.speedupsMinutes) || 0) * 60
    const res = {
      food: Number(state.speedupsFood) || 0,
      wood: Number(state.speedupsWood) || 0,
      stone: Number(state.speedupsStone) || 0,
      gold: Number(state.speedupsGold) || 0,
    }
    const from = state.speedupsFromTier === 'scratch' ? null : (Number(state.speedupsFromTier) as Tier)
    return calcFromSpeedups(state.speedupsTier, from, speedBonus, speedupSec, res)
  }, [state.speedupsDays, state.speedupsHours, state.speedupsMinutes, state.speedupsFood, state.speedupsWood, state.speedupsStone, state.speedupsGold, state.speedupsTier, state.speedupsFromTier, speedBonus])

  const resetSpeedups = () => { onUpdate({ speedupsDays: '', speedupsHours: '', speedupsMinutes: '' }) }
  const resetResources = () => { onUpdate({ speedupsFood: '', speedupsWood: '', speedupsStone: '', speedupsGold: '' }) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Speedups */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Speedups Available</Label>
              <button onClick={resetSpeedups} className="text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /></button>
            </div>
            {[
              { label: 'Days', value: state.speedupsDays, key: 'speedupsDays' as const },
              { label: 'Hours', value: state.speedupsHours, key: 'speedupsHours' as const },
              { label: 'Minutes', value: state.speedupsMinutes, key: 'speedupsMinutes' as const },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-14">{f.label}</span>
                <Input type="number" min={0} value={f.value} onChange={e => onUpdate({ [f.key]: e.target.value })} placeholder="0" className="h-8 text-sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Resources Available</Label>
              <button onClick={resetResources} className="text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" /></button>
            </div>
            {[
              { label: 'Food', value: state.speedupsFood, key: 'speedupsFood' as const, color: 'text-green-400' },
              { label: 'Wood', value: state.speedupsWood, key: 'speedupsWood' as const, color: 'text-amber-600' },
              { label: 'Stone', value: state.speedupsStone, key: 'speedupsStone' as const, color: 'text-zinc-400' },
              { label: 'Gold', value: state.speedupsGold, key: 'speedupsGold' as const, color: 'text-yellow-400' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <span className={`text-xs font-medium w-14 ${f.color}`}>{f.label}</span>
                <Input type="number" min={0} value={f.value} onChange={e => onUpdate({ [f.key]: e.target.value })} placeholder="0" className="h-8 text-sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Troop selection */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Label className="text-sm font-semibold text-foreground">Troop Selection</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Troops Type</Label>
              <Select value={state.speedupsTroopType} onValueChange={v => onUpdate({ speedupsTroopType: v as TroopType })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TROOP_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Training Type</Label>
              <Select value={`${state.speedupsTier}-${state.speedupsFromTier}`} onValueChange={v => {
                const [t, f] = v.split('-')
                onUpdate({ speedupsTier: Number(t) as Tier, speedupsFromTier: f })
              }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map(t => (
                    <SelectItem key={`${t}-scratch`} value={`${t}-scratch`}>T{t} From Scratch</SelectItem>
                  ))}
                  {[
                    { from: 4, to: 5 }, { from: 3, to: 5 }, { from: 2, to: 5 }, { from: 1, to: 5 },
                    { from: 3, to: 4 }, { from: 2, to: 4 }, { from: 1, to: 4 },
                    { from: 2, to: 3 }, { from: 1, to: 3 },
                    { from: 1, to: 2 },
                  ].map(p => (
                    <SelectItem key={`${p.to}-${p.from}`} value={`${p.to}-${p.from}`}>T{p.from} to T{p.to}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="border-primary/30">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="text-sm font-bold text-foreground">You can train</div>
          <div className="text-3xl font-bold text-primary">{result.troops.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">troops</span></div>

          <div className="border-t border-border pt-3">
            <div className="text-sm font-bold text-foreground mb-2">You will receive</div>
            <div className="grid grid-cols-3 gap-3">
              <StatChip icon={Zap} label="MGE Points" value={result.mgePoints.toLocaleString()} />
              <StatChip icon={Shield} label="Power" value={result.power.toLocaleString()} />
              <StatChip icon={Swords} label="KvK Points" value={result.kvkPoints.toLocaleString()} />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-sm font-bold text-foreground mb-2">You will spend</div>
            <ResourceBar result={result} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  MGE POINTS CALC MODE                                               */
/* ================================================================== */

function MgePointsCalcMode({
  speedBonus,
  state,
  onUpdate,
}: {
  speedBonus: number
  state: TrainingStageState
  onUpdate: (updates: Partial<TrainingStageState>) => void
}) {
  const result = useMemo(() => {
    const from = state.mgeFromTier === 'scratch' ? null : (Number(state.mgeFromTier) as Tier)
    return calcFromMgePoints(state.mgeTier, from, speedBonus, Number(state.mgeTargetPoints) || 0)
  }, [state.mgeTargetPoints, state.mgeTier, state.mgeFromTier, speedBonus])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MGE target */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Label className="text-sm font-semibold text-foreground">Target MGE Points</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">MGE Points:</span>
              <Input type="number" min={0} value={state.mgeTargetPoints} onChange={e => onUpdate({ mgeTargetPoints: e.target.value })} placeholder="0" className="h-8 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Troop selection */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Label className="text-sm font-semibold text-foreground">Troop Selection</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Troops Type</Label>
              <Select value={state.mgeTroopType} onValueChange={v => onUpdate({ mgeTroopType: v as TroopType })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TROOP_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Training Type</Label>
              <Select value={`${state.mgeTier}-${state.mgeFromTier}`} onValueChange={v => {
                const [t, f] = v.split('-')
                onUpdate({ mgeTier: Number(t) as Tier, mgeFromTier: f })
              }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map(t => (
                    <SelectItem key={`${t}-scratch`} value={`${t}-scratch`}>T{t} From Scratch</SelectItem>
                  ))}
                  {[
                    { from: 4, to: 5 }, { from: 3, to: 5 }, { from: 2, to: 5 }, { from: 1, to: 5 },
                    { from: 3, to: 4 }, { from: 2, to: 4 }, { from: 1, to: 4 },
                    { from: 2, to: 3 }, { from: 1, to: 3 },
                    { from: 1, to: 2 },
                  ].map(p => (
                    <SelectItem key={`${p.to}-${p.from}`} value={`${p.to}-${p.from}`}>T{p.from} to T{p.to}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="border-primary/30">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="text-sm font-bold text-foreground">You need to train</div>
          <div className="text-3xl font-bold text-primary">{result.troops.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">troops</span></div>

          <div className="border-t border-border pt-3">
            <div className="text-sm font-bold text-foreground mb-2">You will receive</div>
            <div className="grid grid-cols-3 gap-3">
              <StatChip icon={Zap} label="MGE Points" value={result.mgePoints.toLocaleString()} />
              <StatChip icon={Shield} label="Power" value={result.power.toLocaleString()} />
              <StatChip icon={Swords} label="KvK Points" value={result.kvkPoints.toLocaleString()} />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-sm font-bold text-foreground mb-2">You will spend</div>
            <ResourceBar result={result} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  SHARED UI COMPONENTS                                               */
/* ================================================================== */

function StatChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  )
}

function ResourceBar({ result }: { result: TrainingResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Time:</span>
        <span className="font-medium text-foreground">{formatTime(result.time)}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs text-green-400">{result.food.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TreePine className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs text-amber-600">{result.wood.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mountain className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">{result.stone.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-xs text-yellow-400">{result.gold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function ResultsBar({ result, compact }: { result: TrainingResult; compact?: boolean }) {
  return (
    <div className={`rounded-lg bg-secondary/30 border border-border ${compact ? 'px-3 py-2' : 'px-4 py-3'} space-y-1.5`}>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <span className="text-muted-foreground">Time: <span className="text-foreground font-medium">{formatTime(result.time)}</span></span>
        <span className="text-muted-foreground">MGE Points: <span className="text-foreground font-medium">{result.mgePoints.toLocaleString()}</span></span>
        <span className="text-muted-foreground">Power: <span className="text-foreground font-medium">{result.power.toLocaleString()}</span></span>
        <span className="text-muted-foreground">KvK Points: <span className="text-foreground font-medium">{result.kvkPoints.toLocaleString()}</span></span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <span className="text-green-400">Food: {result.food.toLocaleString()}</span>
        <span className="text-amber-600">Wood: {result.wood.toLocaleString()}</span>
        <span className="text-zinc-400">Stone: {result.stone.toLocaleString()}</span>
        <span className="text-yellow-400">Gold: {result.gold.toLocaleString()}</span>
      </div>
    </div>
  )
}
