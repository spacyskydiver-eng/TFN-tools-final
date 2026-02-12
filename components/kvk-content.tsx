'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Trash2,
  ChevronDown,
  Zap,
  Target,
  Trophy,
  Calendar,
  Save,
  Settings2,
  Castle,
  Crosshair,
  AlertTriangle,
  Check,
  Milestone,
  TrendingUp,
  Package,
  Lock,
  Swords,
  Crown,
  Gem,
  Dices,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  KVK_TYPES,
  type KvkTypeId,
  type KvkRun,
  type KvkTimelineEvent,
  type EventMilestone,
  type ApSplit,
  type MonumentStage,
  type GrindingStyle,
  type BarbLevelFocus,
  type KpData,
  type KpTierKey,
  type KpTierPct,
  type CommanderPrepData,
  type CommanderSkillSet,
  type HeadIncomeSource,
  EVENT_CATEGORIES,
  isSoC,
  createNewKvkRun,
  createDefaultKpData,
  createDefaultCommanderPrep,
  calcKillsFromSplit,
  calcFullHonor,
  calcEventMilestoneHonor,
  calcEventMilestoneCrystal,
  calcRequiredAp,
  calcSmartGrindSuggestion,
  calcKpFromKills,
  calcKillsForKpGoal,
  calcMixedKpPlan,
  calcHeadsNeeded,
  calcWofEstimate,
  chainMonumentStages,
  isStageAutoCompleted,
  getCurrentKvkDay,
  getApSplitFromStyle,
  getBarbDistFromFocus,
  GRINDING_STYLES,
  BARB_LEVEL_KEYS,
  FORT_LEVEL_KEYS,
  BARB_HONOR_PER_KILL,
  FORT_HONOR_PER_KILL,
  KP_TIER_KEYS,
  KP_TIER_LABELS,
  KP_PER_KILL,
  HEADS_PER_SKILL_LEVEL_LEGENDARY,
  HEADS_PER_SKILL_LEVEL_EPIC,
  VIP_HEADS_PER_DAY,
  WOF_AVG_HEADS_PER_SPIN,
  WOF_GEMS_PER_SPIN,
  DEFAULT_HEAD_INCOME_SOURCES,
} from '@/lib/kvk-engine'

/* ================================================================ */
/*  CONSTANTS                                                        */
/* ================================================================ */

const SECTIONS = [
  { id: 'honor', label: 'Honor Calculator', icon: Trophy },
  { id: 'kp', label: 'Kill Points', icon: Swords },
  { id: 'timeline', label: 'Event Timeline', icon: Calendar },
  { id: 'monument', label: 'Monument', icon: Milestone },
  { id: 'ruins', label: 'Ruins & Altar', icon: Castle },
  { id: 'extras', label: 'More', icon: Settings2 },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

/* ================================================================ */
/*  SAVE/LOAD                                                        */
/* ================================================================ */

function loadSavedRuns(): KvkRun[] {
  try {
    const raw = localStorage.getItem('kvk_runs_v3')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRunsToStorage(runs: KvkRun[]) {
  localStorage.setItem('kvk_runs_v3', JSON.stringify(runs))
}

/* ================================================================ */
/*  MAIN EXPORT                                                      */
/* ================================================================ */

export function KvkContent() {
  const [runs, setRuns] = useState<KvkRun[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const saved = loadSavedRuns()
    setRuns(saved)
    if (saved.length > 0) setActiveRunId(saved[0].id)
  }, [])

  const activeRun = useMemo(
    () => runs.find((r) => r.id === activeRunId) ?? null,
    [runs, activeRunId],
  )

  const updateRun = useCallback((updated: KvkRun) => {
    setRuns((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r))
      saveRunsToStorage(next)
      return next
    })
  }, [])

  const createRun = (kvkType: KvkTypeId, startDate: string, name: string) => {
    const run = createNewKvkRun(kvkType, startDate, name || undefined)
    const next = [run, ...runs]
    setRuns(next)
    saveRunsToStorage(next)
    setActiveRunId(run.id)
    setShowCreate(false)
  }

  const deleteRun = (id: string) => {
    const next = runs.filter((r) => r.id !== id)
    setRuns(next)
    saveRunsToStorage(next)
    if (activeRunId === id) setActiveRunId(next[0]?.id ?? null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {runs.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <Select value={activeRunId ?? ''} onValueChange={setActiveRunId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved KvK run" />
              </SelectTrigger>
              <SelectContent>
                {runs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          onClick={() => setShowCreate(!showCreate)}
          variant={showCreate ? 'secondary' : 'default'}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New KvK
        </Button>
        {activeRun && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteRun(activeRun.id)}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      {showCreate && <CreateKvkForm onCreate={createRun} onCancel={() => setShowCreate(false)} />}

      {activeRun ? (
        <KvkRunView run={activeRun} onUpdate={updateRun} />
      ) : !showCreate ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Crosshair className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No KvK Runs Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Create your first KvK tracker to plan timelines, calculate honor points, and manage your KvK strategy.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First KvK
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

/* ================================================================ */
/*  CREATE FORM                                                      */
/* ================================================================ */

function CreateKvkForm({
  onCreate,
  onCancel,
}: {
  onCreate: (kvkType: KvkTypeId, startDate: string, name: string) => void
  onCancel: () => void
}) {
  const [kvkType, setKvkType] = useState<KvkTypeId>('kvk1')
  const [startDate, setStartDate] = useState('')
  const [name, setName] = useState('')

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>KvK Type</Label>
            <Select value={kvkType} onValueChange={(v) => setKvkType(v as KvkTypeId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KVK_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} ({t.shortLabel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Registration Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <p className="text-xs text-muted-foreground">Fill in the day your Registration period started</p>
          </div>
          <div className="space-y-2">
            <Label>Name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kingdom 1234 KvK 2"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => startDate && onCreate(kvkType, startDate, name)}
            disabled={!startDate}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Create
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================ */
/*  KVK RUN VIEW                                                     */
/* ================================================================ */

function KvkRunView({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const [activeSection, setActiveSection] = useState<SectionId>('honor')
  const showSoC = isSoC(run.kvkType)
  const currentDay = getCurrentKvkDay(run.startDate)
  const remainingDays = Math.max(0, run.kvkDurationDays - currentDay)

  return (
    <div className="space-y-4">
      {/* Run info bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{run.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {KVK_TYPES.find((t) => t.id === run.kvkType)?.label}
        </span>
        <span className="text-xs text-muted-foreground">Start: {run.startDate}</span>
        {currentDay > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
            Day {currentDay}
          </span>
        )}
        {remainingDays > 0 && currentDay > 0 && (
          <span className="text-xs text-muted-foreground">{remainingDays}d remaining</span>
        )}
        {showSoC && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            SoC
          </span>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const active = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          )
        })}
      </div>

      {activeSection === 'honor' && <HonorSection run={run} onUpdate={onUpdate} />}
      {activeSection === 'kp' && <KpSection run={run} onUpdate={onUpdate} />}
      {activeSection === 'timeline' && <TimelineSection run={run} onUpdate={onUpdate} />}
      {activeSection === 'monument' && <MonumentSection run={run} onUpdate={onUpdate} />}
      {activeSection === 'ruins' && <RuinsAltarSection run={run} onUpdate={onUpdate} />}
      {activeSection === 'extras' && <ExtrasSection run={run} onUpdate={onUpdate} />}
    </div>
  )
}

/* ================================================================ */
/*  HONOR CALCULATOR SECTION                                         */
/* ================================================================ */

function HonorSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const showSoC = isSoC(run.kvkType)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Ensure grindingStyle and barbLevelFocus exist (backward compat for old saved runs)
  const grindingStyle: GrindingStyle = run.grindingStyle ?? 'balanced'
  const barbLevelFocus: BarbLevelFocus = run.barbLevelFocus ?? '41-45'

  // Derived calculations
  const kills = useMemo(
    () => calcKillsFromSplit(run.totalAp, run.apSplit, run.apConfig, run.kvkType),
    [run.totalAp, run.apSplit, run.apConfig, run.kvkType],
  )

  const ruinsHonor = run.ruinsAttended * run.ruinsAltarConfig.ruinsHonorPerAttend
  const altarHonor = run.altarAttended * run.ruinsAltarConfig.altarHonorPerAttend
  const eventMilestoneHonor = useMemo(() => calcEventMilestoneHonor(run.timelineEvents), [run.timelineEvents])
  const eventMilestoneCrystal = useMemo(() => calcEventMilestoneCrystal(run.timelineEvents), [run.timelineEvents])

  const honor = useMemo(
    () =>
      calcFullHonor(
        kills.barbs, kills.forts, kills.kahar,
        run.barbDist, run.fortDist,
        ruinsHonor, altarHonor, eventMilestoneHonor,
        eventMilestoneCrystal, run.crystalConfig, showSoC,
      ),
    [kills, run.barbDist, run.fortDist, ruinsHonor, altarHonor, eventMilestoneHonor, eventMilestoneCrystal, run.crystalConfig, showSoC],
  )

  // Reverse AP calculator
  const requiredAp = useMemo(
    () => run.honorGoal > 0
      ? calcRequiredAp(run.honorGoal, run.apSplit, run.apConfig, run.barbDist, run.fortDist, run.kvkType)
      : 0,
    [run.honorGoal, run.apSplit, run.apConfig, run.barbDist, run.fortDist, run.kvkType],
  )

  // Smart grind suggestion
  const grindSuggestion = useMemo(
    () => run.totalAp > 0
      ? calcSmartGrindSuggestion(
        run.totalAp, run.apSplit, run.apConfig, run.barbDist, run.fortDist,
        run.kvkType, run.honorGoal, ruinsHonor, altarHonor, eventMilestoneHonor,
      )
      : null,
    [run.totalAp, run.apSplit, run.apConfig, run.barbDist, run.fortDist, run.kvkType, run.honorGoal, ruinsHonor, altarHonor, eventMilestoneHonor],
  )

  // Progress tracking
  const currentDay = getCurrentKvkDay(run.startDate)
  const remainingDays = Math.max(1, run.kvkDurationDays - currentDay)
  const progressPct = run.honorGoal > 0 ? Math.min(100, Math.round((honor.totalHonor / run.honorGoal) * 100)) : 0
  const remainingHonor = Math.max(0, run.honorGoal - honor.totalHonor)
  const dailyHonorNeeded = remainingDays > 0 ? Math.ceil(remainingHonor / remainingDays) : 0

  const barbTotalHonor = honor.barbsByLevel.reduce((s, b) => s + b.honor, 0)
  const fortTotalHonor = honor.fortsByLevel.reduce((s, f) => s + f.honor, 0)

  // Handlers
  const handleStyleChange = (style: GrindingStyle) => {
    const newSplit = getApSplitFromStyle(style, run.kvkType)
    onUpdate({ ...run, grindingStyle: style, apSplit: newSplit })
  }

  const handleLevelFocusChange = (focus: BarbLevelFocus) => {
    const newDist = getBarbDistFromFocus(focus)
    onUpdate({ ...run, barbLevelFocus: focus, barbDist: newDist })
  }

  const updateApSplit = (key: keyof ApSplit, value: number) => {
    const newSplit = { ...run.apSplit }
    const oldVal = newSplit[key]
    const diff = value - oldVal
    newSplit[key] = value
    if (showSoC) {
      const otherKeys = (['barbsPct', 'fortsPct', 'kaharPct'] as const).filter((k) => k !== key)
      const otherTotal = otherKeys.reduce((s, k) => s + newSplit[k], 0)
      if (otherTotal > 0) {
        for (const k of otherKeys) {
          const ratio = newSplit[k] / otherTotal
          newSplit[k] = Math.max(0, Math.round(newSplit[k] - diff * ratio))
        }
      } else {
        for (const k of otherKeys) {
          newSplit[k] = Math.round((100 - value) / otherKeys.length)
        }
      }
      const total = newSplit.barbsPct + newSplit.fortsPct + newSplit.kaharPct
      if (total !== 100) {
        const first = otherKeys[0]
        newSplit[first] = Math.max(0, newSplit[first] + (100 - total))
      }
    } else {
      if (key === 'barbsPct') newSplit.fortsPct = 100 - value
      else if (key === 'fortsPct') newSplit.barbsPct = 100 - value
      newSplit.kaharPct = 0
    }
    onUpdate({ ...run, apSplit: newSplit })
  }

  const BARB_FOCUS_OPTIONS: { id: BarbLevelFocus; label: string }[] = [
    { id: '26-30', label: 'Lv 26-30' },
    { id: '31-35', label: 'Lv 31-35' },
    { id: '36-40', label: 'Lv 36-40' },
    { id: '41-45', label: 'Lv 41-45' },
    { id: '46-50', label: 'Lv 46-50' },
    { id: '51-55', label: 'Lv 51-55' },
  ]

  return (
    <div className="space-y-6">
      {/* ──────── Step 1: AP Input ──────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            <span>Step 1 — Action Points</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Total AP Available</Label>
              <Input
                type="number"
                value={run.totalAp || ''}
                onChange={(e) => onUpdate({ ...run, totalAp: Number(e.target.value) || 0 })}
                placeholder="e.g. 500000"
              />
              <p className="text-xs text-muted-foreground">
                Use the AP calculator in General Tools to figure this out from potions.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Honor Goal (optional)</Label>
              <Input
                type="number"
                value={run.honorGoal || ''}
                onChange={(e) => onUpdate({ ...run, honorGoal: Number(e.target.value) || 0 })}
                placeholder="e.g. 1000000"
              />
              <p className="text-xs text-muted-foreground">
                Set a target to track progress and get suggestions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ──────── Step 2: Grinding Style ──────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            <span>Step 2 — Grinding Style</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GRINDING_STYLES.map((style) => {
              const isActive = grindingStyle === style.id
              return (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`flex flex-col items-start gap-1.5 rounded-lg border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span className="text-sm font-semibold">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </button>
              )
            })}
          </div>

          {/* AP Split visualization */}
          <div className="space-y-2">
            <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
              <div className="bg-[hsl(0,75%,60%)] transition-all" style={{ width: `${run.apSplit.barbsPct}%` }} />
              <div className="bg-[hsl(210,80%,60%)] transition-all" style={{ width: `${run.apSplit.fortsPct}%` }} />
              {showSoC && (
                <div className="bg-[hsl(35,90%,55%)] transition-all" style={{ width: `${run.apSplit.kaharPct}%` }} />
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(0,75%,60%)]" />
                Barbs {run.apSplit.barbsPct}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(210,80%,60%)]" />
                Forts {run.apSplit.fortsPct}%
              </span>
              {showSoC && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[hsl(35,90%,55%)]" />
                  Kahar {run.apSplit.kaharPct}%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ──────── Step 3: Target Level Focus ──────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="h-4 w-4 text-primary" />
            <span>Step 3 — Target Level Focus</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Barbarian Level Range</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {BARB_FOCUS_OPTIONS.map((opt) => {
                const isActive = barbLevelFocus === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleLevelFocusChange(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium text-center transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Kills are concentrated around the selected level range. Fine-tune in Advanced Settings.
            </p>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Fort Level Range</Label>
            <p className="text-xs text-muted-foreground">
              Fort kills are distributed across levels 6-15 using sensible defaults. Adjust in Advanced Settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ──────── Step 4: Result Output ──────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            <span>Estimated Honor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Large result */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Estimated Honor Gained</p>
            <p className="text-4xl font-bold text-primary tabular-nums">{honor.totalHonor.toLocaleString()}</p>
            {showSoC && honor.totalCrystal > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                + {honor.totalCrystal.toLocaleString()} crystals
              </p>
            )}
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Barbarians" value={barbTotalHonor} color="hsl(0, 75%, 60%)" />
            <StatCard label="Forts" value={fortTotalHonor} color="hsl(210, 80%, 60%)" />
            {showSoC && <StatCard label="Kahar" value={honor.kaharHonor} color="hsl(35, 90%, 55%)" />}
            <StatCard label="Ruins / Altar" value={ruinsHonor + altarHonor} color="hsl(145, 60%, 45%)" />
            <StatCard label="Events" value={eventMilestoneHonor} color="hsl(280, 55%, 55%)" />
          </div>

          {/* Pie chart */}
          {honor.totalHonor > 0 && (
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Honor Sources</h4>
              <HonorPieChart
                segments={[
                  { label: 'Barbarians', value: barbTotalHonor, color: 'hsl(0, 75%, 60%)' },
                  { label: 'Forts', value: fortTotalHonor, color: 'hsl(210, 80%, 60%)' },
                  ...(showSoC && honor.kaharHonor > 0 ? [{ label: 'Kahar', value: honor.kaharHonor, color: 'hsl(35, 90%, 55%)' }] : []),
                  ...(ruinsHonor + altarHonor > 0 ? [{ label: 'Ruins/Altar', value: ruinsHonor + altarHonor, color: 'hsl(145, 60%, 45%)' }] : []),
                  ...(eventMilestoneHonor > 0 ? [{ label: 'Events', value: eventMilestoneHonor, color: 'hsl(280, 55%, 55%)' }] : []),
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ──────── Step 5: Honor Goal Tracking ──────── */}
      {run.honorGoal > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Honor Goal Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-sm font-bold text-primary tabular-nums">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Projected</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{honor.totalHonor.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Goal</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{run.honorGoal.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                  <p className={`text-sm font-bold tabular-nums ${remainingHonor > 0 ? 'text-destructive' : 'text-primary'}`}>
                    {remainingHonor > 0 ? `-${remainingHonor.toLocaleString()}` : 'Met'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Additional AP</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {remainingHonor > 0 && requiredAp > run.totalAp
                      ? (requiredAp - run.totalAp).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">KvK Duration</Label>
                <Input
                  type="number"
                  value={run.kvkDurationDays}
                  onChange={(e) => onUpdate({ ...run, kvkDurationDays: Number(e.target.value) || 60 })}
                  className="w-20 h-8 text-xs"
                  min={1}
                />
                <span className="text-xs text-muted-foreground">days</span>
                {currentDay > 0 && dailyHonorNeeded > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ~{dailyHonorNeeded.toLocaleString()} HP/day needed ({remainingDays}d left)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────── Step 6: Smart Grind Suggestion ──────── */}
      {grindSuggestion && run.totalAp > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="h-4 w-4 text-primary" />
              <span>Suggested Grind Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-lg border p-4 ${
              run.honorGoal > 0
                ? grindSuggestion.sufficient
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-destructive/30 bg-destructive/5'
                : 'border-border bg-secondary/20'
            }`}>
              <div className="space-y-2">
                {grindSuggestion.barbKills > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Kill <strong>{grindSuggestion.barbKills.toLocaleString()}</strong> barbarians</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{grindSuggestion.barbApUsed.toLocaleString()} AP</span>
                  </div>
                )}
                {grindSuggestion.fortKills > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Kill <strong>{grindSuggestion.fortKills.toLocaleString()}</strong> forts</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{grindSuggestion.fortApUsed.toLocaleString()} AP</span>
                  </div>
                )}
                {showSoC && grindSuggestion.kaharKills > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Kill <strong>{grindSuggestion.kaharKills.toLocaleString()}</strong> kahar</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{grindSuggestion.kaharApUsed.toLocaleString()} AP</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Estimated Honor</span>
                <span className="text-sm font-bold text-primary tabular-nums">{grindSuggestion.estimatedHonor.toLocaleString()}</span>
              </div>
              {run.honorGoal > 0 && grindSuggestion.deficit > 0 && (
                <p className="text-xs text-destructive mt-2">
                  You need {grindSuggestion.deficit.toLocaleString()} more honor to reach your goal. Consider adding more AP or adjusting your distribution.
                </p>
              )}
              {run.honorGoal > 0 && grindSuggestion.sufficient && (
                <p className="text-xs text-primary mt-2">
                  Your AP is sufficient to reach your honor goal with the current setup.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────── Step 7: Advanced Settings ──────── */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <CardTitle className="flex items-center gap-2 text-base flex-1">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span>Advanced Settings</span>
            </CardTitle>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-6">
            {/* AP per kill config */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AP Cost per Kill</h5>
              <div className={`grid gap-3 ${showSoC ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="space-y-1">
                  <Label className="text-xs">AP per Barb</Label>
                  <Input
                    type="number"
                    value={run.apConfig.barbs}
                    onChange={(e) => onUpdate({ ...run, apConfig: { ...run.apConfig, barbs: Number(e.target.value) || 1 } })}
                    min={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">AP per Fort</Label>
                  <Input
                    type="number"
                    value={run.apConfig.forts}
                    onChange={(e) => onUpdate({ ...run, apConfig: { ...run.apConfig, forts: Number(e.target.value) || 1 } })}
                    min={1}
                  />
                </div>
                {showSoC && (
                  <div className="space-y-1">
                    <Label className="text-xs">AP per Kahar</Label>
                    <Input
                      type="number"
                      value={run.apConfig.kahar ?? 190}
                      onChange={(e) => onUpdate({ ...run, apConfig: { ...run.apConfig, kahar: Number(e.target.value) || 1 } })}
                      min={1}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Manual AP allocation override */}
            <div className="space-y-3 border-t border-border pt-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AP Allocation Override</h5>
              <p className="text-xs text-muted-foreground">Fine-tune the AP split with sliders. This overrides your grinding style preset.</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Barbarians</Label>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {run.apSplit.barbsPct}% ({kills.barbAp.toLocaleString()} AP = {kills.barbs.toLocaleString()} kills)
                    </span>
                  </div>
                  <Slider value={[run.apSplit.barbsPct]} onValueChange={([v]) => updateApSplit('barbsPct', v)} min={0} max={100} step={1} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Forts</Label>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {run.apSplit.fortsPct}% ({kills.fortAp.toLocaleString()} AP = {kills.forts.toLocaleString()} kills)
                    </span>
                  </div>
                  <Slider value={[run.apSplit.fortsPct]} onValueChange={([v]) => updateApSplit('fortsPct', v)} min={0} max={100} step={1} />
                </div>
                {showSoC && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Kahar</Label>
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {run.apSplit.kaharPct}% ({kills.kaharAp.toLocaleString()} AP = {kills.kahar.toLocaleString()} kills)
                      </span>
                    </div>
                    <Slider value={[run.apSplit.kaharPct]} onValueChange={([v]) => updateApSplit('kaharPct', v)} min={0} max={100} step={1} />
                  </div>
                )}
              </div>
            </div>

            {/* Barb distribution manual override */}
            <div className="space-y-3 border-t border-border pt-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Barbarian Kill Distribution ({kills.barbs.toLocaleString()} total)
              </h5>
              <p className="text-xs text-muted-foreground">Manually set relative weights for each barbarian level range.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BARB_LEVEL_KEYS.map((key) => {
                  const lvl = honor.barbsByLevel.find((b) => b.key === key)
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Barbs {key}</Label>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {lvl?.kills ?? 0} kills = {(lvl?.honor ?? 0).toLocaleString()} HP
                        </span>
                      </div>
                      <Slider
                        value={[run.barbDist[key]]}
                        onValueChange={([v]) => onUpdate({ ...run, barbDist: { ...run.barbDist, [key]: v } })}
                        min={0} max={100} step={1}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Weight: {run.barbDist[key]} (x{BARB_HONOR_PER_KILL[key]} HP/kill)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fort distribution manual override */}
            <div className="space-y-3 border-t border-border pt-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Fort Kill Distribution ({kills.forts.toLocaleString()} total)
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {FORT_LEVEL_KEYS.map((key) => {
                  const lvl = honor.fortsByLevel.find((f) => f.key === key)
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Fort Lv.{key}</Label>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {lvl?.kills ?? 0} = {(lvl?.honor ?? 0).toLocaleString()} HP
                        </span>
                      </div>
                      <Slider
                        value={[run.fortDist[key]]}
                        onValueChange={([v]) => onUpdate({ ...run, fortDist: { ...run.fortDist, [key]: v } })}
                        min={0} max={100} step={1}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Weight: {run.fortDist[key]} (x{FORT_HONOR_PER_KILL[key]} HP/kill)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Honor per kill values */}
            <div className="space-y-3 border-t border-border pt-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Honor Values per Kill (Reference)</h5>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {BARB_LEVEL_KEYS.map((key) => (
                  <div key={key} className="rounded border border-border bg-secondary/30 px-2 py-1.5 text-center">
                    <span className="text-[10px] text-muted-foreground">Barbs {key}</span>
                    <p className="text-xs font-semibold text-foreground">{BARB_HONOR_PER_KILL[key]} HP</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {FORT_LEVEL_KEYS.map((key) => (
                  <div key={key} className="rounded border border-border bg-secondary/30 px-2 py-1.5 text-center">
                    <span className="text-[10px] text-muted-foreground">Fort {key}</span>
                    <p className="text-xs font-semibold text-foreground">{FORT_HONOR_PER_KILL[key]} HP</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Crystal config (SoC only) */}
            {showSoC && (
              <div className="space-y-3 border-t border-border pt-4">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Crystal per Kill Values</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <StatCard label="From Kills" value={honor.totalCrystalFromKills} color="hsl(180, 60%, 50%)" />
                  <StatCard label="From Events" value={honor.totalCrystalFromEvents} color="hsl(280, 55%, 55%)" />
                  <StatCard label="Total Crystal" value={honor.totalCrystal} highlight />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Barb Crystal</span>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {BARB_LEVEL_KEYS.map((key) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px]">{key}</Label>
                        <Input
                          type="number"
                          value={run.crystalConfig.barbs[key] ?? 0}
                          onChange={(e) => {
                            const newBarbs = { ...run.crystalConfig.barbs, [key]: Number(e.target.value) || 0 }
                            onUpdate({ ...run, crystalConfig: { ...run.crystalConfig, barbs: newBarbs } })
                          }}
                          className="h-7 text-xs"
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Fort Crystal</span>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {FORT_LEVEL_KEYS.map((key) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-[10px]">Lv.{key}</Label>
                        <Input
                          type="number"
                          value={run.crystalConfig.forts[key] ?? 0}
                          onChange={(e) => {
                            const newForts = { ...run.crystalConfig.forts, [key]: Number(e.target.value) || 0 }
                            onUpdate({ ...run, crystalConfig: { ...run.crystalConfig, forts: newForts } })
                          }}
                          className="h-7 text-xs"
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Full level breakdown */}
            <details className="group border-t border-border pt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180 transition-transform" />
                Full Breakdown by Level
              </summary>
              <div className="mt-3 space-y-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Barbarians</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {honor.barbsByLevel.map((b) => (
                      <div key={b.key} className="rounded border border-border bg-secondary/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Barbs {b.key}</span>
                        <p className="text-sm font-semibold text-foreground">
                          {b.kills.toLocaleString()} kills = {b.honor.toLocaleString()} HP
                          {showSoC && b.crystal > 0 && <span className="text-muted-foreground font-normal"> + {b.crystal.toLocaleString()} crystal</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forts</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {honor.fortsByLevel.map((f) => (
                      <div key={f.key} className="rounded border border-border bg-secondary/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Fort Lv.{f.key}</span>
                        <p className="text-sm font-semibold text-foreground">
                          {f.kills.toLocaleString()} kills = {f.honor.toLocaleString()} HP
                          {showSoC && f.crystal > 0 && <span className="text-muted-foreground font-normal"> + {f.crystal.toLocaleString()} crystal</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

/* ================================================================ */
/*  STAT CARD                                                        */
/* ================================================================ */

function StatCard({ label, value, color, highlight }: { label: string; value: number; color?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${highlight ? 'border-primary/30 bg-primary/10' : 'border-border bg-secondary/30'}`}>
      <div className="flex items-center gap-2">
        {color && <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

/* ================================================================ */
/*  PIE CHART                                                        */
/* ================================================================ */

function HonorPieChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  let cumulative = 0
  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const pct = s.value / total
    const start = cumulative
    cumulative += pct
    return { ...s, start, pct }
  })

  const toXY = (pct: number) => {
    const a = 2 * Math.PI * pct - Math.PI / 2
    return [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)]
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-36 w-36 flex-shrink-0">
        {arcs.map((arc) => {
          if (arc.pct >= 1) return <circle key={arc.label} cx="50" cy="50" r="40" fill={arc.color} />
          const [x1, y1] = toXY(arc.start)
          const [x2, y2] = toXY(arc.start + arc.pct)
          const large = arc.pct > 0.5 ? 1 : 0
          return <path key={arc.label} d={`M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`} fill={arc.color} />
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {segments.filter((s) => s.value > 0).map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-foreground">
              {s.label}: {s.value.toLocaleString()} ({Math.round((s.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  EVENT TIMELINE SECTION (separate from monument)                  */
/* ================================================================ */

function TimelineSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const showSoC = isSoC(run.kvkType)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDay, setNewDay] = useState('')
  const [newDuration, setNewDuration] = useState('1')
  const [newCategory, setNewCategory] = useState<string>('war-of-conquest')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const addEvent = () => {
    if (!newName.trim() || !newDay) return
    const ev: KvkTimelineEvent = {
      id: `ev-${Date.now()}`,
      name: newName.trim(),
      startDay: Number(newDay) || 0,
      duration: Number(newDuration) || 1,
      category: newCategory as KvkTimelineEvent['category'],
      description: '',
      milestones: [],
    }
    onUpdate({ ...run, timelineEvents: [...run.timelineEvents, ev] })
    setNewName('')
    setNewDay('')
    setNewDuration('1')
    setShowAdd(false)
  }

  const removeEvent = (id: string) => {
    onUpdate({ ...run, timelineEvents: run.timelineEvents.filter((e) => e.id !== id) })
  }

  const updateEvent = (updated: KvkTimelineEvent) => {
    onUpdate({ ...run, timelineEvents: run.timelineEvents.map((e) => (e.id === updated.id ? updated : e)) })
  }

  const sorted = [...run.timelineEvents].sort((a, b) => a.startDay - b.startDay)
  const currentDay = getCurrentKvkDay(run.startDate)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Event Timeline</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Event
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Event Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Arms Training" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Day</Label>
                <Input type="number" value={newDay} onChange={(e) => setNewDay(e.target.value)} placeholder="e.g. 1" min={0} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (days)</Label>
                <Input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} min={1} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addEvent} disabled={!newName.trim() || !newDay}>Add</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No timeline events yet. Add War of Conquest or Chronicles events.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((ev) => {
            const endDay = ev.startDay + ev.duration - 1
            const isExpanded = expandedEvent === ev.id
            const catLabel = EVENT_CATEGORIES.find((c) => c.id === ev.category)?.label ?? ev.category
            const reachedCount = ev.milestones.filter((m) => m.reached).length
            const totalMilestoneHonor = ev.milestones.filter((m) => m.reached).reduce((s, m) => s + m.honor, 0)
            const isActive = currentDay >= ev.startDay && currentDay <= endDay
            const isPast = currentDay > endDay

            return (
              <div key={ev.id} className={`rounded-lg border overflow-hidden ${isActive ? 'border-primary/40' : 'border-border'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 ${isActive ? 'bg-primary/5' : isPast ? 'bg-secondary/40' : 'bg-card'}`}>
                  <div className={`flex items-center justify-center rounded px-2 py-1 text-xs font-bold min-w-[60px] text-center ${isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'}`}>
                    Day {ev.startDay}{ev.duration > 1 && ` - ${endDay}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isPast ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{ev.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{catLabel}</span>
                    {ev.milestones.length > 0 && (
                      <span className="ml-2 text-xs text-primary">
                        {reachedCount}/{ev.milestones.length} ({totalMilestoneHonor.toLocaleString()} HP)
                      </span>
                    )}
                    {isActive && <span className="ml-2 text-xs font-semibold text-primary">ACTIVE</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{ev.duration}d</span>
                  <button onClick={() => setExpandedEvent(isExpanded ? null : ev.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <button onClick={() => removeEvent(ev.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExpanded && <EventMilestoneEditor event={ev} onUpdate={updateEvent} showSoC={showSoC} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- Event Milestone Editor ---------- */

function EventMilestoneEditor({ event, onUpdate, showSoC }: { event: KvkTimelineEvent; onUpdate: (ev: KvkTimelineEvent) => void; showSoC: boolean }) {
  const [newHonor, setNewHonor] = useState('')
  const [newCrystal, setNewCrystal] = useState('')

  const addMilestone = () => {
    const milestone: EventMilestone = {
      id: `ms-${Date.now()}`,
      level: event.milestones.length + 1,
      honor: Number(newHonor) || 0,
      crystal: Number(newCrystal) || 0,
      reached: false,
    }
    onUpdate({ ...event, milestones: [...event.milestones, milestone] })
    setNewHonor('')
    setNewCrystal('')
  }

  const removeMilestone = (id: string) => {
    const updated = event.milestones.filter((m) => m.id !== id).map((m, i) => ({ ...m, level: i + 1 }))
    onUpdate({ ...event, milestones: updated })
  }

  const toggleReached = (id: string) => {
    onUpdate({ ...event, milestones: event.milestones.map((m) => (m.id === id ? { ...m, reached: !m.reached } : m)) })
  }

  const updateMilestoneField = (id: string, field: 'honor' | 'crystal', value: number) => {
    onUpdate({ ...event, milestones: event.milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)) })
  }

  return (
    <div className="border-t border-border bg-secondary/10 px-4 py-4 space-y-3">
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Milestone Rewards</h5>
      {event.milestones.length > 0 && (
        <div className="space-y-2">
          {event.milestones.map((ms) => (
            <div key={ms.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${ms.reached ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
              <button
                onClick={() => toggleReached(ms.id)}
                className={`flex items-center justify-center h-5 w-5 rounded border transition-colors flex-shrink-0 ${ms.reached ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card text-transparent hover:border-primary/50'}`}
              >
                <Check className="h-3 w-3" />
              </button>
              <span className="text-xs font-medium text-muted-foreground min-w-[32px]">Lv.{ms.level}</span>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-[10px] text-muted-foreground">HP:</span>
                <Input type="number" value={ms.honor || ''} onChange={(e) => updateMilestoneField(ms.id, 'honor', Number(e.target.value) || 0)} className="h-7 text-xs w-24" min={0} />
              </div>
              {showSoC && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Crystal:</span>
                  <Input type="number" value={ms.crystal || ''} onChange={(e) => updateMilestoneField(ms.id, 'crystal', Number(e.target.value) || 0)} className="h-7 text-xs w-24" min={0} />
                </div>
              )}
              <button onClick={() => removeMilestone(ms.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Honor</Label>
          <Input type="number" value={newHonor} onChange={(e) => setNewHonor(e.target.value)} placeholder="HP" className="h-8 text-xs w-28" min={0} />
        </div>
        {showSoC && (
          <div className="space-y-1">
            <Label className="text-xs">Crystal</Label>
            <Input type="number" value={newCrystal} onChange={(e) => setNewCrystal(e.target.value)} placeholder="Crystal" className="h-8 text-xs w-28" min={0} />
          </div>
        )}
        <Button size="sm" onClick={addMilestone} className="h-8 gap-1">
          <Plus className="h-3 w-3" />
          Add Level
        </Button>
      </div>
    </div>
  )
}

/* ================================================================ */
/*  MONUMENT SECTION (separate from event timeline)                  */
/*  Uses chained formula: stage[n].start = stage[n-1].start + dur    */
/* ================================================================ */

function MonumentSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDuration, setNewDuration] = useState('3')
  const [newDesc, setNewDesc] = useState('')
  const [newObjectives, setNewObjectives] = useState('')
  const [newRewards, setNewRewards] = useState('')

  const currentDay = getCurrentKvkDay(run.startDate)
  const chainedStages = useMemo(
    () => chainMonumentStages(run.monumentStages, run.monumentAnchorDay),
    [run.monumentStages, run.monumentAnchorDay],
  )

  const addStage = () => {
    if (!newName.trim()) return
    const stage: MonumentStage = {
      id: `mon-${Date.now()}`,
      name: newName.trim(),
      duration: Number(newDuration) || 3,
      description: newDesc.trim(),
      objectives: newObjectives.trim(),
      rewards: newRewards.trim(),
      completed: false,
    }
    onUpdate({ ...run, monumentStages: [...run.monumentStages, stage] })
    setNewName('')
    setNewDuration('3')
    setNewDesc('')
    setNewObjectives('')
    setNewRewards('')
    setShowAdd(false)
  }

  const removeStage = (id: string) => {
    onUpdate({ ...run, monumentStages: run.monumentStages.filter((s) => s.id !== id) })
  }

  const toggleComplete = (id: string) => {
    onUpdate({
      ...run,
      monumentStages: run.monumentStages.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    })
  }

  const updateStageDuration = (id: string, duration: number) => {
    onUpdate({
      ...run,
      monumentStages: run.monumentStages.map((s) => (s.id === id ? { ...s, duration } : s)),
    })
  }

  const updateStageName = (id: string, name: string) => {
    onUpdate({
      ...run,
      monumentStages: run.monumentStages.map((s) => (s.id === id ? { ...s, name } : s)),
    })
  }

  // Find current active stage
  const activeStageIdx = chainedStages.findIndex(
    (cs) => currentDay >= cs.startDay && currentDay <= cs.endDay
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Monument / Chronicles Timeline</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Stage
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Stages are chained: each stage starts immediately after the previous one ends. Changing a duration shifts all subsequent stages.
      </p>

      {/* Anchor day config */}
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Anchor Day (first stage starts on)</Label>
        <Input
          type="number"
          value={run.monumentAnchorDay}
          onChange={(e) => onUpdate({ ...run, monumentAnchorDay: Number(e.target.value) || 1 })}
          className="w-20"
          min={1}
        />
        <span className="text-xs text-muted-foreground">
          Day offset from registration start date
        </span>
      </div>

      {showAdd && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Stage Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Chapter 1: Gathering" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (days)</Label>
                <Input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} min={1} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Objectives</Label>
                <Input value={newObjectives} onChange={(e) => setNewObjectives(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Rewards</Label>
                <Input value={newRewards} onChange={(e) => setNewRewards(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addStage} disabled={!newName.trim()}>Add</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chainedStages.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Milestone className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No monument stages defined yet. Add stages to build your Chronicles timeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {chainedStages.map((cs, idx) => {
            const autoComplete = currentDay > 0 && isStageAutoCompleted(currentDay, cs.endDay)
            const isComplete = cs.stage.completed || autoComplete
            const isActive = idx === activeStageIdx
            const isUpcoming = currentDay > 0 && currentDay < cs.startDay

            return (
              <div
                key={cs.stage.id}
                className={`rounded-lg border overflow-hidden ${
                  isActive ? 'border-primary/40 bg-primary/5' : isComplete ? 'border-border bg-secondary/30' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleComplete(cs.stage.id)}
                    className={`flex items-center justify-center h-5 w-5 rounded border transition-colors flex-shrink-0 ${
                      isComplete ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card text-transparent hover:border-primary/50'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </button>

                  <div className={`rounded px-2 py-1 text-xs font-bold min-w-[80px] text-center ${
                    isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                  }`}>
                    Day {cs.startDay} - {cs.endDay}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Input
                      value={cs.stage.name}
                      onChange={(e) => updateStageName(cs.stage.id, e.target.value)}
                      className={`h-7 text-sm font-medium border-none bg-transparent px-0 focus-visible:ring-0 ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    />
                    {cs.stage.objectives && (
                      <p className="text-xs text-muted-foreground mt-0.5">{cs.stage.objectives}</p>
                    )}
                    {cs.stage.rewards && (
                      <p className="text-xs text-primary/70 mt-0.5">Rewards: {cs.stage.rewards}</p>
                    )}
                  </div>

                  {isActive && <span className="text-xs font-semibold text-primary">ACTIVE</span>}
                  {isUpcoming && <span className="text-xs text-muted-foreground">Upcoming</span>}

                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={cs.stage.duration}
                      onChange={(e) => updateStageDuration(cs.stage.id, Number(e.target.value) || 1)}
                      className="h-7 w-14 text-xs text-center"
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground">d</span>
                  </div>

                  <button onClick={() => removeStage(cs.stage.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {cs.stage.description && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground">{cs.stage.description}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================================================================ */
/*  RUINS & ALTAR SECTION                                            */
/* ================================================================ */

function RuinsAltarSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const cfg = run.ruinsAltarConfig
  const [desiredRuinsHonor, setDesiredRuinsHonor] = useState(0)
  const [desiredAltarHonor, setDesiredAltarHonor] = useState(0)

  const ruinsHonor = run.ruinsAttended * cfg.ruinsHonorPerAttend
  const altarHonor = run.altarAttended * cfg.altarHonorPerAttend
  const totalHonor = ruinsHonor + altarHonor

  const ruinsToAttend = cfg.ruinsHonorPerAttend > 0 ? Math.ceil(desiredRuinsHonor / cfg.ruinsHonorPerAttend) : 0
  const altarToAttend = cfg.altarHonorPerAttend > 0 ? Math.ceil(desiredAltarHonor / cfg.altarHonorPerAttend) : 0

  const [showConfig, setShowConfig] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Ancient Ruins & Altar of Darkness HP</h3>

      {cfg.ruinsHonorPerAttend === 0 && cfg.altarHonorPerAttend === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            Honor-per-attendance values not set yet. Click <strong>Configure</strong> below to define honor values.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance to Honor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Ruins # Attended</Label>
                <span className="text-xs text-muted-foreground">{ruinsHonor.toLocaleString()} HP</span>
              </div>
              <Input
                type="number"
                value={run.ruinsAttended || ''}
                onChange={(e) => onUpdate({ ...run, ruinsAttended: Number(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Altar # Attended</Label>
                <span className="text-xs text-muted-foreground">{altarHonor.toLocaleString()} HP</span>
              </div>
              <Input
                type="number"
                value={run.altarAttended || ''}
                onChange={(e) => onUpdate({ ...run, altarAttended: Number(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center">
              <span className="text-xs text-muted-foreground">Total Honor</span>
              <p className="text-lg font-bold text-primary">{totalHonor.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Honor to Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Desired Ruins Honor</Label>
                <span className="text-xs text-muted-foreground">{ruinsToAttend} needed</span>
              </div>
              <Input type="number" value={desiredRuinsHonor || ''} onChange={(e) => setDesiredRuinsHonor(Number(e.target.value) || 0)} min={0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Desired Altar Honor</Label>
                <span className="text-xs text-muted-foreground">{altarToAttend} needed</span>
              </div>
              <Input type="number" value={desiredAltarHonor || ''} onChange={(e) => setDesiredAltarHonor(Number(e.target.value) || 0)} min={0} />
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-center">
              <span className="text-xs text-muted-foreground">Total Attendance Needed</span>
              <p className="text-lg font-bold text-foreground">{ruinsToAttend + altarToAttend}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings2 className="h-3 w-3" />
        {showConfig ? 'Hide' : 'Configure'} honor formulas
      </button>

      {showConfig && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Honor per Ruins Attendance</Label>
                <Input
                  type="number"
                  value={cfg.ruinsHonorPerAttend || ''}
                  onChange={(e) => onUpdate({ ...run, ruinsAltarConfig: { ...cfg, ruinsHonorPerAttend: Number(e.target.value) || 0 } })}
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Honor per Altar Attendance</Label>
                <Input
                  type="number"
                  value={cfg.altarHonorPerAttend || ''}
                  onChange={(e) => onUpdate({ ...run, ruinsAltarConfig: { ...cfg, altarHonorPerAttend: Number(e.target.value) || 0 } })}
                  min={0}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Set to 0 if unknown. Admin can update later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ================================================================ */
/*  KILL POINTS (KP) SECTION                                         */
/* ================================================================ */

function KpSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  // Backward compat: old runs may not have kpData
  const kp: KpData = run.kpData ?? createDefaultKpData()

  const updateKp = (patch: Partial<KpData>) => {
    onUpdate({ ...run, kpData: { ...kp, ...patch } })
  }

  const kpResult = useMemo(() => calcKpFromKills(kp.tierKills), [kp.tierKills])
  const killsPerTier = useMemo(() => kp.kpGoal > 0 ? calcKillsForKpGoal(kp.kpGoal) : null, [kp.kpGoal])
  const mixedPlan = useMemo(() => kp.kpGoal > 0 ? calcMixedKpPlan(kp.kpGoal, kp.mixedPlan) : null, [kp.kpGoal, kp.mixedPlan])

  const remainingKp = Math.max(0, kp.kpGoal - kp.currentKp)
  const dailyKpNeeded = kp.daysRemaining > 0 ? Math.ceil(remainingKp / kp.daysRemaining) : 0
  const progressPct = kp.kpGoal > 0 ? Math.min(100, Math.round((kp.currentKp / kp.kpGoal) * 100)) : 0

  const mixedPctTotal = Object.values(kp.mixedPlan).reduce((s, v) => s + v, 0)

  const updateMixedPct = (key: KpTierKey, value: number) => {
    const newPlan = { ...kp.mixedPlan, [key]: value }
    updateKp({ mixedPlan: newPlan })
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Kills -> KP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="h-4 w-4 text-primary" />
            Kills to Kill Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Enter your kills per tier to calculate total KP.</p>
          <div className="grid grid-cols-5 gap-3">
            {KP_TIER_KEYS.map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{KP_TIER_LABELS[key]} Kills</Label>
                <Input
                  type="number"
                  value={kp.tierKills[key] || ''}
                  onChange={(e) => updateKp({ tierKills: { ...kp.tierKills, [key]: Number(e.target.value) || 0 } })}
                  placeholder="0"
                  min={0}
                />
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  = {kpResult.perTier[key].toLocaleString()} KP
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total Kill Points</p>
            <p className="text-3xl font-bold text-primary tabular-nums">{kpResult.total.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: KP Goal -> kills needed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            KP Goal to Kills Needed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Target KP</Label>
            <Input
              type="number"
              value={kp.kpGoal || ''}
              onChange={(e) => updateKp({ kpGoal: Number(e.target.value) || 0 })}
              placeholder="e.g. 50000000"
              className="max-w-xs"
            />
          </div>
          {killsPerTier && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Kills needed if using only one tier:</p>
              <div className="grid grid-cols-5 gap-3">
                {KP_TIER_KEYS.map((key) => (
                  <div key={key} className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
                    <span className="text-xs text-muted-foreground">{KP_TIER_LABELS[key]} only</span>
                    <p className="text-sm font-bold text-foreground tabular-nums">{killsPerTier[key].toLocaleString()}</p>
                    <span className="text-[10px] text-muted-foreground">x{KP_PER_KILL[key]} KP/kill</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Mixed tier planning */}
      {kp.kpGoal > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dices className="h-4 w-4 text-primary" />
              Mixed Tier Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Distribute your KP goal across tiers using the sliders.
              {mixedPctTotal !== 100 && (
                <span className="text-destructive font-medium ml-1">
                  Total is {mixedPctTotal}% (should be 100%).
                </span>
              )}
            </p>
            <div className="space-y-3">
              {KP_TIER_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{KP_TIER_LABELS[key]}</Label>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {kp.mixedPlan[key]}%
                      {mixedPlan && (
                        <span className="text-muted-foreground font-normal">
                          {' '}= {mixedPlan[key].killsNeeded.toLocaleString()} kills ({Math.round(mixedPlan[key].kpShare).toLocaleString()} KP)
                        </span>
                      )}
                    </span>
                  </div>
                  <Slider
                    value={[kp.mixedPlan[key]]}
                    onValueChange={([v]) => updateMixedPct(key, v)}
                    min={0} max={100} step={1}
                  />
                </div>
              ))}
            </div>
            {/* Visual distribution bar */}
            <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
              {KP_TIER_KEYS.map((key, i) => {
                const colors = ['hsl(0,75%,65%)', 'hsl(30,80%,55%)', 'hsl(55,75%,50%)', 'hsl(145,60%,45%)', 'hsl(210,80%,55%)']
                return (
                  <div key={key} className="transition-all" style={{ width: `${kp.mixedPlan[key]}%`, backgroundColor: colors[i] }} />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {KP_TIER_KEYS.map((key, i) => {
                const colors = ['hsl(0,75%,65%)', 'hsl(30,80%,55%)', 'hsl(55,75%,50%)', 'hsl(145,60%,45%)', 'hsl(210,80%,55%)']
                return (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[i] }} />
                    {KP_TIER_LABELS[key]} {kp.mixedPlan[key]}%
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Progress Tracker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            KP Progress Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Target KP</Label>
              <Input
                type="number"
                value={kp.kpGoal || ''}
                onChange={(e) => updateKp({ kpGoal: Number(e.target.value) || 0 })}
                placeholder="Target"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Current KP</Label>
              <Input
                type="number"
                value={kp.currentKp || ''}
                onChange={(e) => updateKp({ currentKp: Number(e.target.value) || 0 })}
                placeholder="Current"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Days Remaining</Label>
              <Input
                type="number"
                value={kp.daysRemaining || ''}
                onChange={(e) => updateKp({ daysRemaining: Number(e.target.value) || 0 })}
                placeholder="Days"
                min={0}
              />
            </div>
          </div>

          {kp.kpGoal > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-sm font-bold text-primary tabular-nums">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{remainingKp.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Daily KP Needed</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{dailyKpNeeded.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current</p>
                  <p className="text-sm font-bold text-primary tabular-nums">{kp.currentKp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================ */
/*  COMMANDER PREPARATION SECTION — REMOVED                          */
/*  Commander Prep is now a standalone top-level tab.                 */
/*  See components/commander-content.tsx                              */
/* ================================================================ */



/* ================================================================ */
/*  EXTRAS SECTION                                                    */
/* ================================================================ */

function ExtrasSection({ run, onUpdate }: { run: KvkRun; onUpdate: (r: KvkRun) => void }) {
  const showSoC = isSoC(run.kvkType)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Additional Sections</h3>

      {/* Bundle Planner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Bundle Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Track bundles available during this KvK. Admins can configure bundle AP rewards, crystal rewards, and purchase limits.
            Estimated additional AP, honor potential, and crystal gains will show here.
          </p>
          <div className="rounded-lg border border-border bg-secondary/20 p-6 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Bundle configuration coming soon. Admins will define bundle data here.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save prompt for non-authenticated */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Save KvK Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in to save your KvK progress. Non-signed-in users can use all calculators, but data is only
            stored in your browser. Signed-in users can save multiple KvK trackers and reopen them later.
          </p>
          <Button disabled className="gap-2">
            <Save className="h-4 w-4" />
            Sign in to save your KvK progress
          </Button>
        </CardContent>
      </Card>

      {/* Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: 'Pre-KvK Checklist', description: 'Preparation checklist and event planning.' },
          ...(showSoC ? [{ title: 'Crystal Technology Tree', description: 'Crystal tech planning and resources.' }] : []),
        ].map((p) => (
          <Card key={p.title}>
            <CardContent className="py-8 text-center">
              <h4 className="text-sm font-semibold text-foreground mb-1">{p.title}</h4>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-3">Coming soon</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}