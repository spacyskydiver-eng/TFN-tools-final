'use client'

import { Checkbox } from "@/components/ui/checkbox"
import { useEvents } from '@/lib/event-context'
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
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Trash2,
  ChevronDown,
  Crown,
  Gem,
  Dices,
  TrendingUp,
  Package,
  Save,
  Lock,
  Users,
  Settings2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  type CommanderSkillSet,
  type HeadIncomeSource,
  type WofPlanInput,
  calcHeadsNeeded,
  calcWofPlan,
  HEADS_PER_SKILL_LEVEL_LEGENDARY,
  HEADS_PER_SKILL_LEVEL_EPIC,
  VIP_HEADS_PER_DAY,
  WOF_AVG_HEADS_PER_SPIN,
  WOF_BUNDLES,
  WOF_FREE_SPINS_TOTAL,
  WOF_DISCOUNT_SINGLE_TOTAL,
  WOF_DISCOUNT_SINGLE_GEMS,
  WOF_DISCOUNT_5PACK_TOTAL,
  WOF_DISCOUNT_5PACK_SPINS,
  WOF_DISCOUNT_5PACK_GEMS,
  WOF_REGULAR_SINGLE_GEMS,
  DEFAULT_HEAD_INCOME_SOURCES,
    DEFAULT_RECURRING_GH_EVENTS,
  buildGhOccurrences,
  calcHeadsFromOccurrences,
  calcBundleHeads,
  type PlannedOutcome,
  type CustomGhEvent,
  calcHeadsFromCalendar
} from '@/lib/kvk-engine'

/* ================================================================ */
/*  TYPES                                                             */
/* ================================================================ */

type CommanderGoal = {
  id: string
  name: string
  rarity: 'legendary' | 'epic'
  currentSkills: CommanderSkillSet
  targetSkills: CommanderSkillSet
  allocationPct: number
}

type AccountProfile = {
  id: string
  name: string
  kingdom: string
  vipLevel: number
  currentGems: number
  dailyGemIncome: number
  daysUntilGoal: number
  commanders: CommanderGoal[]
  headIncomeSources: HeadIncomeSource[]
  wofTargetSpins: number
  wofBundles: Record<string, boolean>
}

/* ================================================================ */
/*  SAVE / LOAD                                                       */
/* ================================================================ */

const STORAGE_KEY = 'commander_prep_v2'

function loadProfiles(): AccountProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveProfiles(profiles: AccountProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch { /* ignore */ }
}

function createDefaultProfile(name?: string): AccountProfile {
  return {
    id: `acct-${Date.now()}`,
    name: name || 'My Account',
    kingdom: '',
    vipLevel: 10,
    currentGems: 0,
    dailyGemIncome: 0,
    daysUntilGoal: 30,
    commanders: [],
    headIncomeSources: DEFAULT_HEAD_INCOME_SOURCES.map((s) => ({ ...s })),
    wofTargetSpins: 0,
    wofBundles: {},
  }
}

function createDefaultCommander(name?: string): CommanderGoal {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name || '',
    rarity: 'legendary',
    currentSkills: [5, 1, 1, 1],
    targetSkills: [5, 5, 1, 1],
    allocationPct: 100,
  }
}

/* ================================================================ */
/*  MAIN COMPONENT                                                    */
/* ================================================================ */

export function CommanderContent() {
  const { events } = useEvents()
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<AccountProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const p = loadProfiles()
    setProfiles(p)
    if (p.length > 0) setActiveProfileId(p[0].id)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveProfiles(profiles)
  }, [profiles, loaded])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  const updateProfile = useCallback((updated: AccountProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  const addProfile = () => {
    const p = createDefaultProfile()
    setProfiles((prev) => [...prev, p])
    setActiveProfileId(p.id)
  }

  const removeProfile = (id: string) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (activeProfileId === id) {
        setActiveProfileId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }

  if (!loaded) return null

  return (
    <div className="space-y-6">
      {/* Account Profile Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Account Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Create an account profile to start planning your commander upgrades.
              </p>
              <Button onClick={addProfile} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Account Profile
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Select
                  value={activeProfileId ?? ''}
                  onValueChange={(v) => setActiveProfileId(v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.kingdom ? ` (${p.kingdom})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addProfile} variant="outline" size="sm" className="gap-1 bg-transparent">
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>

              {activeProfile && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Account Name</Label>
                    <Input
                      value={activeProfile.name}
                      onChange={(e) => updateProfile({ ...activeProfile, name: e.target.value })}
                      placeholder="My Account"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kingdom / Server</Label>
                    <Input
                      value={activeProfile.kingdom}
                      onChange={(e) => updateProfile({ ...activeProfile, kingdom: e.target.value })}
                      placeholder="e.g. #1234"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">VIP Level</Label>
                    <Select
                      value={String(activeProfile.vipLevel)}
                      onValueChange={(v) => updateProfile({ ...activeProfile, vipLevel: Number(v) })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 18 }, (_, i) => i).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            VIP {n} ({VIP_HEADS_PER_DAY[n] ?? 0}/day)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Days Until KvK</Label>
                    <Input
                      type="number"
                      value={activeProfile.daysUntilGoal || ''}
                      onChange={(e) => updateProfile({ ...activeProfile, daysUntilGoal: Number(e.target.value) || 0 })}
                      placeholder="30"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {profiles.length > 1 && activeProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProfile(activeProfile.id)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Profile
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {activeProfile && (
        <ProfileContent profile={activeProfile} onUpdate={updateProfile} />
      )}
    </div>
  )
}

/* ================================================================ */
/*  PROFILE CONTENT                                                    */
/* ================================================================ */

function ProfileContent({
  profile,
  onUpdate,
}: {
  profile: AccountProfile
  onUpdate: (p: AccountProfile) => void
}) {
  const [activeSection, setActiveSection] = useState<'commanders' | 'wheel' | 'income' | 'overview'>('commanders')

  const TABS = [
    { id: 'commanders' as const, label: 'Commanders', icon: Crown },
    { id: 'wheel' as const, label: 'Wheel of Fortune', icon: Dices },
    { id: 'income' as const, label: 'Gold Head Income', icon: Package },
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = activeSection === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeSection === 'commanders' && <CommandersSection profile={profile} onUpdate={onUpdate} />}
      {activeSection === 'wheel' && <WheelOfFortuneSection profile={profile} onUpdate={onUpdate} />}
      {activeSection === 'income' && <IncomeSection profile={profile} onUpdate={onUpdate} />}
      {activeSection === 'overview' && <OverviewSection profile={profile} />}
    </div>
  )
}

/* ================================================================ */
/*  COMMANDERS SECTION                                                 */
/* ================================================================ */

function CommandersSection({
  profile,
  onUpdate,
}: {
  profile: AccountProfile
  onUpdate: (p: AccountProfile) => void
}) {
  const skillLabels = ['1st Skill', '2nd Skill', '3rd Skill', '4th Skill']

  const addCommander = () => {
    const cmd = createDefaultCommander()
    const cmds = [...profile.commanders, cmd]
    // Auto-balance allocation
    const pctEach = Math.floor(100 / cmds.length)
    const balanced = cmds.map((c, i) => ({
      ...c,
      allocationPct: i === cmds.length - 1 ? 100 - pctEach * (cmds.length - 1) : pctEach,
    }))
    onUpdate({ ...profile, commanders: balanced })
  }

  const removeCommander = (id: string) => {
    const cmds = profile.commanders.filter((c) => c.id !== id)
    if (cmds.length > 0) {
      const pctEach = Math.floor(100 / cmds.length)
      const balanced = cmds.map((c, i) => ({
        ...c,
        allocationPct: i === cmds.length - 1 ? 100 - pctEach * (cmds.length - 1) : pctEach,
      }))
      onUpdate({ ...profile, commanders: balanced })
    } else {
      onUpdate({ ...profile, commanders: [] })
    }
  }

  const updateCommander = (id: string, patch: Partial<CommanderGoal>) => {
    onUpdate({
      ...profile,
      commanders: profile.commanders.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const updateSkill = (id: string, type: 'current' | 'target', index: number, value: number) => {
    const cmd = profile.commanders.find((c) => c.id === id)
    if (!cmd) return
    const arr = type === 'current' ? [...cmd.currentSkills] : [...cmd.targetSkills]
    arr[index] = Math.max(1, Math.min(5, value))
    updateCommander(
      id,
      type === 'current'
        ? { currentSkills: arr as CommanderSkillSet }
        : { targetSkills: arr as CommanderSkillSet },
    )
  }

  const updateAllocation = (id: string, value: number) => {
    const others = profile.commanders.filter((c) => c.id !== id)
    const remaining = 100 - value
    const otherTotal = others.reduce((s, c) => s + c.allocationPct, 0) || 1
    const updated = profile.commanders.map((c) => {
      if (c.id === id) return { ...c, allocationPct: value }
      const ratio = c.allocationPct / otherTotal
      return { ...c, allocationPct: Math.max(0, Math.round(remaining * ratio)) }
    })
    // Fix rounding
    const total = updated.reduce((s, c) => s + c.allocationPct, 0)
    if (total !== 100 && updated.length > 1) {
      const last = updated.find((c) => c.id !== id)
      if (last) last.allocationPct += 100 - total
    }
    onUpdate({ ...profile, commanders: updated })
  }

  return (
    <div className="space-y-6">
      {profile.commanders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Crown className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No commanders added yet. Add a commander to start planning gold head investments.
            </p>
            <Button onClick={addCommander} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Commander
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {profile.commanders.map((cmd) => {
            const headsPerLevel =
              cmd.rarity === 'legendary'
                ? HEADS_PER_SKILL_LEVEL_LEGENDARY
                : HEADS_PER_SKILL_LEVEL_EPIC
            const calc = calcHeadsNeeded(headsPerLevel, cmd.currentSkills, cmd.targetSkills)
            const pct = calc.total > 0 ? Math.round((calc.invested / calc.total) * 100) : 0

            return (
              <Card key={cmd.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Crown className="h-4 w-4 text-primary" />
                      {cmd.name || 'Unnamed Commander'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCommander(cmd.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Commander Name</Label>
                      <Input
                        value={cmd.name}
                        onChange={(e) => updateCommander(cmd.id, { name: e.target.value })}
                        placeholder="e.g. YSG, Alex, Guan Yu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rarity</Label>
                      <Select
                        value={cmd.rarity}
                        onValueChange={(v) => updateCommander(cmd.id, { rarity: v as 'legendary' | 'epic' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="legendary">Legendary</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Skill levels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Current Skills</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {skillLabels.map((label, i) => (
                          <div key={`cur-${cmd.id}-${label}`} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">{label}</Label>
                            <Select
                              value={String(cmd.currentSkills[i])}
                              onValueChange={(v) => updateSkill(cmd.id, 'current', i, Number(v))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{cmd.currentSkills.join('-')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Target Skills</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {skillLabels.map((label, i) => (
                          <div key={`tgt-${cmd.id}-${label}`} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">{label}</Label>
                            <Select
                              value={String(cmd.targetSkills[i])}
                              onValueChange={(v) => updateSkill(cmd.id, 'target', i, Number(v))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{cmd.targetSkills.join('-')}</p>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Invested</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{calc.invested}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Needed</p>
                        <p className="text-sm font-bold text-primary tabular-nums">{calc.needed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{calc.total}</p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-[10px] text-muted-foreground text-center mt-1">{pct}% complete</p>
                  </div>

                  {/* Allocation */}
                  {profile.commanders.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Gold Head Allocation</Label>
                        <span className="text-xs font-semibold text-primary tabular-nums">{cmd.allocationPct}%</span>
                      </div>
                      <Slider
                        value={[cmd.allocationPct]}
                        onValueChange={([v]) => updateAllocation(cmd.id, v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          <Button onClick={addCommander} variant="outline" className="gap-2 w-full bg-transparent">
            <Plus className="h-4 w-4" />
            Add Another Commander
          </Button>
        </>
      )}
    </div>
  )
}

/* ================================================================ */
/*  WHEEL OF FORTUNE SECTION                                          */
/* ================================================================ */

function WheelOfFortuneSection({
  profile,
  onUpdate,
}: {
  profile: AccountProfile
  onUpdate: (p: AccountProfile) => void
}) {
  const wofInput: WofPlanInput = {
    targetSpins: profile.wofTargetSpins,
    useBundles: profile.wofBundles,
  }

  const plan = useMemo(() => calcWofPlan(wofInput), [profile.wofTargetSpins, profile.wofBundles])

  const toggleBundle = (id: string) => {
    onUpdate({
      ...profile,
      wofBundles: { ...profile.wofBundles, [id]: !profile.wofBundles[id] },
    })
  }

  return (
    <div className="space-y-6">
      {/* Fortune Shop Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dices className="h-4 w-4 text-primary" />
            Fortune Shop Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The Wheel of Fortune event lasts {3} days. Each day you get 1 free spin, plus discounted purchases.
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Tier</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Spins</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Cost</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Per Spin</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 py-2 text-foreground font-medium">Free Spin</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_FREE_SPINS_TOTAL}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-primary font-semibold">Free</td>
                  <td className="px-3 py-2 text-right tabular-nums text-primary">0</td>
                  <td className="px-3 py-2 text-muted-foreground">1/day</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-foreground font-medium">
                    50% Discount
                    <span className="ml-1 text-[10px] text-muted-foreground">(single)</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_SINGLE_TOTAL}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{(WOF_DISCOUNT_SINGLE_GEMS * WOF_DISCOUNT_SINGLE_TOTAL).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_SINGLE_GEMS}</td>
                  <td className="px-3 py-2 text-muted-foreground">1/day</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-foreground font-medium">
                    10% Discount
                    <span className="ml-1 text-[10px] text-muted-foreground">(5-pack)</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_5PACK_SPINS}/pack</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_5PACK_GEMS.toLocaleString()}/pack</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_5PACK_GEMS / WOF_DISCOUNT_5PACK_SPINS}</td>
                  <td className="px-3 py-2 text-muted-foreground">Full packs only</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-foreground font-medium">Regular Price</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">unlimited</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_REGULAR_SINGLE_GEMS}/spin</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_REGULAR_SINGLE_GEMS}</td>
                  <td className="px-3 py-2 text-muted-foreground">No limit</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Average expected heads per spin: ~{WOF_AVG_HEADS_PER_SPIN}
          </p>
        </CardContent>
      </Card>

      {/* Spin Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dices className="h-4 w-4 text-primary" />
            Wheel Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm">Total Spins You Plan to Do</Label>
            <Input
              type="number"
              value={profile.wofTargetSpins || ''}
              onChange={(e) => onUpdate({ ...profile, wofTargetSpins: Number(e.target.value) || 0 })}
              placeholder="e.g. 25"
              className="max-w-xs"
              min={0}
            />
          </div>

          {/* Bundle selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Purchase Bundles (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Select any bundles you plan to buy. Bundle spins are applied before gem purchases to save gems.
            </p>
            <div className="space-y-2">
              {WOF_BUNDLES.map((bundle) => {
                const checked = !!profile.wofBundles[bundle.id]
                return (
                  <div
                    key={bundle.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      checked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <Switch
                      checked={checked}
                      onCheckedChange={() => toggleBundle(bundle.id)}
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {bundle.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{bundle.label}</p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{bundle.spins} spins</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Breakdown */}
          {profile.wofTargetSpins > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Cost Breakdown</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Source</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Spins</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Gems</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Per Spin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plan.freeSpins > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">Free Spins</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.freeSpins}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-primary font-semibold">0</td>
                        <td className="px-3 py-2 text-right tabular-nums text-primary">0</td>
                      </tr>
                    )}
                    {plan.bundleSpins > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">
                          Bundles
                          <span className="text-xs text-muted-foreground ml-1">({plan.bundleNames.join(', ')})</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.bundleSpins}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground italic">real $</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">--</td>
                      </tr>
                    )}
                    {plan.discountSingleSpins > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">50% Discount Singles</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.discountSingleSpins}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.discountSingleGems.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_SINGLE_GEMS}</td>
                      </tr>
                    )}
                    {plan.discount5PackSpins > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">
                          10% Discount 5-Packs
                          <span className="text-xs text-muted-foreground ml-1">({plan.discount5PackCount}x)</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.discount5PackSpins}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.discount5PackGems.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_DISCOUNT_5PACK_GEMS / WOF_DISCOUNT_5PACK_SPINS}</td>
                      </tr>
                    )}
                    {plan.regularSpins > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-foreground">Regular Price</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.regularSpins}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.regularGems.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{WOF_REGULAR_SINGLE_GEMS}</td>
                      </tr>
                    )}
                    <tr className="bg-secondary/30 font-semibold">
                      <td className="px-3 py-2 text-foreground">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">{plan.totalSpins}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-primary">{plan.totalGemCost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {plan.totalSpins > 0 ? Math.round(plan.totalGemCost / plan.totalSpins) : 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Spins</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{plan.totalSpins}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gem Cost</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{plan.totalGemCost.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expected Heads</p>
                  <p className="text-sm font-bold text-primary tabular-nums">{plan.expectedHeads.toFixed(1)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gems/Head</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {plan.costPerHead > 0 ? plan.costPerHead.toLocaleString() : '--'}
                  </p>
                </div>
              </div>

              {plan.bundleBonusGems > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-foreground">
                    Bonus gems from bundles: <span className="font-semibold text-primary">{plan.bundleBonusGems.toLocaleString()}</span>
                    {' '} -- these are returned to your gem balance.
                  </p>
                </div>
              )}

              {plan.regularSpins > 20 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive">
                    {plan.regularSpins} spins at full price ({WOF_REGULAR_SINGLE_GEMS} gems/spin) is expensive. Consider buying bundles instead.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================ */
/*  INCOME SECTION                                                     */
/* ================================================================ */

function IncomeSection({
  profile,
  onUpdate,
}: {
  profile: AccountProfile
  onUpdate: (p: AccountProfile) => void
}) {
  const { events } = useEvents()

  // ---------- VIP ----------
  const vipHeadsPerDay = VIP_HEADS_PER_DAY[profile.vipLevel] ?? 0
  const vipHeadsTotal = vipHeadsPerDay * profile.daysUntilGoal

  // ---------- Date helpers ----------
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const goalDate = new Date(today.getTime() + profile.daysUntilGoal * 86400000)

  const inRangeToGoal = useCallback(
    (startDate: string) => new Date(startDate) <= goalDate,
    [goalDate],
  )

  // ---------- ONLY gold-head event categories ----------
  const GH_CATEGORIES = useMemo(
    () =>
      new Set([
        'Ark of Osiris',
        'Champions of Olympia',
        'More Than Gems',
        'Esmeralda Wheel',
        'Silk Road',
        'Wheel of Fortune', // for counting wheels from calendar (heads come from your wheel tracker inputs)
      ]),
    [],
  )

  const isGoldHeadEvent = useCallback(
    (category: string) => GH_CATEGORIES.has(category),
    [GH_CATEGORIES],
  )

  // ---------- Event outcomes tracking ----------
  type OccOutcome = 'default' | 'win' | 'loss' | 'complete' | 'skip' | null

  type OccRow = {
    id: string
    title: string
    category: string
    startDate: string
    endDate: string
    status: 'upcoming' | 'active' | 'past'
    defaultHeads: number
    loggedOutcome: OccOutcome
    headsCounted: number
    needsInput: boolean
  }

  const OUTCOME_KEY = `gh_outcomes_${profile.id}`
  const [outcomes, setOutcomes] = useState<Record<string, OccOutcome>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OUTCOME_KEY)
      setOutcomes(raw ? JSON.parse(raw) : {})
    } catch {
      setOutcomes({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  useEffect(() => {
    try {
      localStorage.setItem(OUTCOME_KEY, JSON.stringify(outcomes))
    } catch {}
  }, [OUTCOME_KEY, outcomes])

  const getDefaultHeads = (category: string) => {
    switch (category) {
      case 'Ark of Osiris':
        return 10 // assume win for future/past-if-not-logged
      case 'Champions of Olympia':
        return 2 // assume complete
      case 'More Than Gems':
        return 10
      case 'Esmeralda Wheel':
        return 5
      case 'Silk Road':
        return 5
      default:
        return 0
    }
  }

  const getOutcomeHeads = (category: string, outcome: OccOutcome) => {
    if (!outcome || outcome === 'default') return getDefaultHeads(category)

    if (category === 'Ark of Osiris') {
      if (outcome === 'win') return 10
      if (outcome === 'loss') return 5
      if (outcome === 'skip') return 0
      return 0
    }

    if (category === 'Champions of Olympia') {
      if (outcome === 'complete') return 2
      if (outcome === 'skip') return 0
      return 0
    }

    if (category === 'More Than Gems') return outcome === 'complete' ? 10 : 0
    if (category === 'Esmeralda Wheel') return outcome === 'complete' ? 5 : 0
    if (category === 'Silk Road') return outcome === 'complete' ? 5 : 0

    return 0
  }

  // ---------- Build occurrences for GH events (NOT wheel) ----------
  const occRows: OccRow[] = useMemo(() => {
    return events
      .filter((e) => inRangeToGoal(e.startDate))
      .filter((e) => isGoldHeadEvent(e.category))
      .filter((e) => e.category !== 'Wheel of Fortune') // wheel handled separately
      .map((e) => {
        const status: OccRow['status'] =
          e.startDate > todayStr ? 'upcoming' : e.endDate < todayStr ? 'past' : 'active'

        const key = `${e.category}_${e.startDate}_${e.endDate}`
        const loggedOutcome = outcomes[key] ?? null

        // RULE:
        // upcoming -> assume default
        // active -> counts 0 unless logged
        // past -> assume default if not logged
        const needsInput = status === 'active' && loggedOutcome === null

        const headsCounted =
          status === 'active' && loggedOutcome === null
            ? 0
            : getOutcomeHeads(e.category, loggedOutcome ?? 'default')

        return {
          id: key,
          title: e.title,
          category: e.category,
          startDate: e.startDate,
          endDate: e.endDate,
          status,
          defaultHeads: getDefaultHeads(e.category),
          loggedOutcome,
          headsCounted,
          needsInput,
        }
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [events, inRangeToGoal, isGoldHeadEvent, outcomes, todayStr])

  const activeEvents = occRows.filter((r) => r.status === 'active')
  const upcomingEvents = occRows.filter((r) => r.status === 'upcoming') // ✅ all upcoming until goal

  const eventHeads = occRows.reduce((s, r) => s + r.headsCounted, 0)

  const setOutcome = (occId: string, v: OccOutcome) => {
    setOutcomes((prev) => ({ ...prev, [occId]: v }))
  }

  // ---------- Wheel Tracker (from calendar + user inputs) ----------
  // 1) Count how many wheels occur until goal (from events calendar)
  const wheelOccurrences = useMemo(() => {
    return events
      .filter((e) => inRangeToGoal(e.startDate))
      .filter((e) => e.category === 'Wheel of Fortune')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((e) => {
        const status = e.startDate > todayStr ? 'upcoming' : e.endDate < todayStr ? 'past' : 'active'
        const key = `wof_${e.startDate}_${e.endDate}`
        return { key, title: e.title, startDate: e.startDate, endDate: e.endDate, status }
      })
  }, [events, inRangeToGoal, todayStr])

  // 2) Store spins per wheel occurrence (Income tab only)
  const WOF_SPINS_KEY = `wof_spins_${profile.id}`
  const [wofSpinsByOcc, setWofSpinsByOcc] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WOF_SPINS_KEY)
      setWofSpinsByOcc(raw ? JSON.parse(raw) : {})
    } catch {
      setWofSpinsByOcc({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  useEffect(() => {
    try {
      localStorage.setItem(WOF_SPINS_KEY, JSON.stringify(wofSpinsByOcc))
    } catch {}
  }, [WOF_SPINS_KEY, wofSpinsByOcc])

  const setWheelSpins = (key: string, spins: number) => {
    setWofSpinsByOcc((prev) => ({ ...prev, [key]: Math.max(0, Math.floor(spins || 0)) }))
  }

  const totalWheelSpinsPlanned = useMemo(() => {
    return wheelOccurrences.reduce((sum, w) => sum + (wofSpinsByOcc[w.key] ?? 0), 0)
  }, [wheelOccurrences, wofSpinsByOcc])

  const wheelExpectedHeads = useMemo(() => {
    if (totalWheelSpinsPlanned <= 0) return 0
    // Use your existing calcWofPlan logic to estimate heads (handles milestones)
    const plan = calcWofPlan({ targetSpins: totalWheelSpinsPlanned, useBundles: {} })
    return Math.floor(plan.expectedHeads)
  }, [totalWheelSpinsPlanned])

  const wheelsLeft = wheelOccurrences.filter((w) => w.status !== 'past').length

  // ---------- Totals ----------
  const totalProjectedHeads = vipHeadsTotal + eventHeads + wheelExpectedHeads

  const totalHeadsNeeded = profile.commanders.reduce((sum, cmd) => {
    const headsPerLevel =
      cmd.rarity === 'legendary' ? HEADS_PER_SKILL_LEVEL_LEGENDARY : HEADS_PER_SKILL_LEVEL_EPIC
    const calc = calcHeadsNeeded(headsPerLevel, cmd.currentSkills, cmd.targetSkills)
    return sum + calc.needed
  }, 0)

  const completionPct =
    totalHeadsNeeded > 0 ? Math.min(100, Math.round((totalProjectedHeads / totalHeadsNeeded) * 100)) : 0

  // ---------- Chart ----------
  const chartData = useMemo(() => {
    const eventByOffset = new Map<number, number>()
    for (const r of occRows) {
      const start = new Date(r.startDate)
      const offset = Math.max(0, Math.floor((start.getTime() - today.getTime()) / 86400000))
      eventByOffset.set(offset, (eventByOffset.get(offset) ?? 0) + r.headsCounted)
    }

    const wheelByOffset = new Map<number, number>()
    for (const w of wheelOccurrences) {
      const spins = wofSpinsByOcc[w.key] ?? 0
      if (spins <= 0) continue
      const start = new Date(w.startDate)
      const offset = Math.max(0, Math.floor((start.getTime() - today.getTime()) / 86400000))
      // estimate heads for this single wheel using calcWofPlan on that wheel spins only
      const h = Math.floor(calcWofPlan({ targetSpins: spins, useBundles: {} }).expectedHeads)
      wheelByOffset.set(offset, (wheelByOffset.get(offset) ?? 0) + h)
    }

    let vipCum = 0
    let eventCum = 0
    let wheelCum = 0

    const rows: { day: number; vip: number; events: number; wheel: number; total: number }[] = []
    for (let d = 0; d <= Math.max(1, profile.daysUntilGoal); d++) {
      vipCum += vipHeadsPerDay
      eventCum += eventByOffset.get(d) ?? 0
      wheelCum += wheelByOffset.get(d) ?? 0
      rows.push({ day: d, vip: vipCum, events: eventCum, wheel: wheelCum, total: vipCum + eventCum + wheelCum })
    }
    return rows
  }, [occRows, wheelOccurrences, wofSpinsByOcc, profile.daysUntilGoal, vipHeadsPerDay, today])

  const Chart = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('recharts')
    } catch {
      return null
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Active GH Events */}
      {activeEvents.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-semibold text-primary">Active Gold Head Events (log results)</p>

            {activeEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3">
                <div className="text-sm text-foreground">
                  {ev.title}{' '}
                  <span className="text-xs text-muted-foreground">
                    ({ev.startDate} → {ev.endDate})
                  </span>
                </div>

                <Select value={ev.loggedOutcome ?? ''} onValueChange={(val) => setOutcome(ev.id, val as any)}>
                  <SelectTrigger className="w-[170px] h-8">
                    <SelectValue placeholder="Log…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {ev.category === 'Ark of Osiris' ? (
                      <>
                        <SelectItem value="win">Win (10)</SelectItem>
                        <SelectItem value="loss">Loss (5)</SelectItem>
                        <SelectItem value="skip">Skip (0)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="skip">Skip</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <p className="text-xs text-muted-foreground">
              While an event is active, it counts as <span className="font-semibold">0</span> until logged.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upcoming GH Events (ALL until goal) */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Gold Head Events (until goal)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcomingEvents.map((ev) => {
              const start = new Date(ev.startDate)
              const diff = Math.ceil((start.getTime() - today.getTime()) / 86400000)
              return (
                <p key={ev.id} className="text-sm text-muted-foreground">
                  {ev.title} — in {diff} day{diff !== 1 ? 's' : ''} (+{ev.defaultHeads} assumed)
                </p>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* VIP Income */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-primary" />
            VIP Gold Head Income
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Per Day</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{vipHeadsPerDay}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Per Week</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{vipHeadsPerDay * 7}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Until Goal ({profile.daysUntilGoal}d)
              </p>
              <p className="text-sm font-bold text-primary tabular-nums">{vipHeadsTotal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wheel Tracker (NOT gem linked) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dices className="h-4 w-4 text-primary" />
            Wheel of Fortune Tracker (until goal)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Wheels Left</p>
              <p className="text-sm font-bold tabular-nums">{wheelsLeft}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Spins Planned</p>
              <p className="text-sm font-bold tabular-nums">{totalWheelSpinsPlanned}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expected Heads</p>
              <p className="text-sm font-bold text-primary tabular-nums">{wheelExpectedHeads}</p>
            </div>
          </div>

          {wheelOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Wheel of Fortune events found in your calendar before the goal date.
            </p>
          ) : (
            <div className="space-y-2">
              {wheelOccurrences.map((w) => {
                const start = new Date(w.startDate)
                const diff = Math.ceil((start.getTime() - today.getTime()) / 86400000)
                return (
                  <div key={w.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <div className="text-sm">
                      <div className="text-foreground font-medium">
                        {w.title || 'Wheel of Fortune'}{' '}
                        <span className="text-xs text-muted-foreground">
                          ({w.startDate} → {w.endDate})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {w.status === 'past'
                          ? 'Past'
                          : w.status === 'active'
                          ? 'Active now'
                          : `In ${diff} day${diff !== 1 ? 's' : ''}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Spins</Label>
                      <Input
                        type="number"
                        className="w-[110px] h-8"
                        min={0}
                        value={wofSpinsByOcc[w.key] ?? 0}
                        onChange={(e) => setWheelSpins(w.key, Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Heads Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" />
            Gold Head Projection Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Events</p>
              <p className="text-sm font-bold tabular-nums">{eventHeads}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Wheel</p>
              <p className="text-sm font-bold tabular-nums">{wheelExpectedHeads}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Expected</p>
              <p className="text-sm font-bold text-primary tabular-nums">{totalProjectedHeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Progress Graph
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!Chart ? (
            <p className="text-sm text-muted-foreground">
              Chart library not found. Install <span className="font-semibold">recharts</span> to show graphs.
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <Chart.ResponsiveContainer width="100%" height="100%">
                <Chart.LineChart data={chartData}>
                  <Chart.CartesianGrid strokeDasharray="3 3" />
                  <Chart.XAxis dataKey="day" />
                  <Chart.YAxis />
                  <Chart.Tooltip />
                  <Chart.Legend />
                  <Chart.Line type="monotone" dataKey="vip" dot={false} />
                  <Chart.Line type="monotone" dataKey="events" dot={false} />
                  <Chart.Line type="monotone" dataKey="wheel" dot={false} />
                  <Chart.Line type="monotone" dataKey="total" dot={false} />
                </Chart.LineChart>
              </Chart.ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            <Progress value={completionPct} className="h-3" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Start</span>
              <span>Goal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



/* ================================================================ */
/*  OVERVIEW SECTION                                                   */
/* ================================================================ */

function OverviewSection({ profile }: { profile: AccountProfile }) {
  const { events } = useEvents()

  const vipHeadsPerDay = VIP_HEADS_PER_DAY[profile.vipLevel] ?? 0
  const vipHeadsTotal = vipHeadsPerDay * profile.daysUntilGoal

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const goalDate = new Date(today.getTime() + profile.daysUntilGoal * 86400000)

  const inRangeToGoal = useCallback(
    (startDate: string) => new Date(startDate) <= goalDate,
    [goalDate],
  )

  const GH_CATEGORIES = useMemo(
    () =>
      new Set([
        'Ark of Osiris',
        'Champions of Olympia',
        'More Than Gems',
        'Esmeralda Wheel',
        'Silk Road',
        'Wheel of Fortune',
      ]),
    [],
  )

  const OUTCOME_KEY = `gh_outcomes_${profile.id}`
  const WOF_SPINS_KEY = `wof_spins_${profile.id}`

  const [outcomes, setOutcomes] = useState<Record<string, any>>({})
  const [wofSpinsByOcc, setWofSpinsByOcc] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      setOutcomes(JSON.parse(localStorage.getItem(OUTCOME_KEY) || '{}'))
    } catch {
      setOutcomes({})
    }
    try {
      setWofSpinsByOcc(JSON.parse(localStorage.getItem(WOF_SPINS_KEY) || '{}'))
    } catch {
      setWofSpinsByOcc({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const getDefaultHeads = (category: string) => {
    switch (category) {
      case 'Ark of Osiris': return 10
      case 'Champions of Olympia': return 2
      case 'More Than Gems': return 10
      case 'Esmeralda Wheel': return 5
      case 'Silk Road': return 5
      default: return 0
    }
  }

  const getOutcomeHeads = (category: string, outcome: any) => {
    if (!outcome || outcome === 'default') return getDefaultHeads(category)

    if (category === 'Ark of Osiris') {
      if (outcome === 'win') return 10
      if (outcome === 'loss') return 5
      if (outcome === 'skip') return 0
      return 0
    }

    if (category === 'Champions of Olympia') {
      if (outcome === 'complete') return 2
      if (outcome === 'skip') return 0
      return 0
    }

    if (category === 'More Than Gems') return outcome === 'complete' ? 10 : 0
    if (category === 'Esmeralda Wheel') return outcome === 'complete' ? 5 : 0
    if (category === 'Silk Road') return outcome === 'complete' ? 5 : 0

    return 0
  }

  // Events (exclude wheel)
  const eventHeads = useMemo(() => {
    const rows = events
      .filter((e) => inRangeToGoal(e.startDate))
      .filter((e) => GH_CATEGORIES.has(e.category))
      .filter((e) => e.category !== 'Wheel of Fortune')

    let total = 0
    for (const e of rows) {
      const status = e.startDate > todayStr ? 'upcoming' : e.endDate < todayStr ? 'past' : 'active'
      const key = `${e.category}_${e.startDate}_${e.endDate}`
      const logged = outcomes[key] ?? null

      if (status === 'active' && logged === null) {
        total += 0
      } else {
        total += getOutcomeHeads(e.category, logged ?? 'default')
      }
    }
    return total
  }, [events, inRangeToGoal, GH_CATEGORIES, outcomes, todayStr])

  // Wheel expected heads (from spins per occurrence)
  const wheelOccurrences = useMemo(() => {
    return events
      .filter((e) => inRangeToGoal(e.startDate))
      .filter((e) => e.category === 'Wheel of Fortune')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((e) => ({ key: `wof_${e.startDate}_${e.endDate}`, startDate: e.startDate, endDate: e.endDate }))
  }, [events, inRangeToGoal])

  const totalWheelSpinsPlanned = useMemo(() => {
    return wheelOccurrences.reduce((sum, w) => sum + (wofSpinsByOcc[w.key] ?? 0), 0)
  }, [wheelOccurrences, wofSpinsByOcc])

  const wofHeads = useMemo(() => {
    if (totalWheelSpinsPlanned <= 0) return 0
    return Math.floor(calcWofPlan({ targetSpins: totalWheelSpinsPlanned, useBundles: {} }).expectedHeads)
  }, [totalWheelSpinsPlanned])

  const totalHeadsExpected = vipHeadsTotal + eventHeads + wofHeads

  // Commander needs
  const commanderCalcs = profile.commanders.map((cmd) => {
    const headsPerLevel =
      cmd.rarity === 'legendary' ? HEADS_PER_SKILL_LEVEL_LEGENDARY : HEADS_PER_SKILL_LEVEL_EPIC
    const calc = calcHeadsNeeded(headsPerLevel, cmd.currentSkills, cmd.targetSkills)
    return { ...cmd, calc }
  })

  const totalHeadsNeeded = commanderCalcs.reduce((s, c) => s + c.calc.needed, 0)
  const headsMissing = Math.max(0, totalHeadsNeeded - totalHeadsExpected)
  const headProgressPct =
    totalHeadsNeeded > 0 ? Math.min(100, Math.round((totalHeadsExpected / totalHeadsNeeded) * 100)) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Overall Gold Head Projection
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">VIP Income</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{vipHeadsTotal}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Events</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{eventHeads}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Wheel (planned)</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{wofHeads}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Expected</p>
                <p className="text-sm font-bold text-primary tabular-nums">{totalHeadsExpected}</p>
              </div>
            </div>
          </div>

          {totalHeadsNeeded > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Gold Head Coverage</span>
                <span className="text-sm font-bold text-primary tabular-nums">{headProgressPct}%</span>
              </div>
              <Progress value={headProgressPct} className="h-3" />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Needed</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{totalHeadsNeeded}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expected</p>
                  <p className="text-sm font-bold text-primary tabular-nums">{totalHeadsExpected}</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Deficit</p>
                  <p className={`text-sm font-bold tabular-nums ${headsMissing > 0 ? 'text-destructive' : 'text-primary'}`}>
                    {headsMissing > 0 ? headsMissing : 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {headsMissing <= 0 && totalHeadsNeeded > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-sm font-medium text-primary">Your gold head sources cover all commander goals!</p>
            </div>
          )}

          {headsMissing > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-destructive">
                You need {headsMissing} more gold heads. Add more event completions, win Ark, or plan more wheel spins.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-commander breakdown (same as your current, but uses totalHeadsExpected) */}
      {commanderCalcs.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary" />
              Commander Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {commanderCalcs.map((cmd) => {
              const allocated = Math.floor(totalHeadsExpected * (cmd.allocationPct / 100))
              const remaining = Math.max(0, cmd.calc.needed - allocated)
              const pct = cmd.calc.needed > 0 ? Math.min(100, Math.round((allocated / cmd.calc.needed) * 100)) : 100

              return (
                <div key={cmd.id} className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {cmd.name || 'Unnamed'}{' '}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({cmd.currentSkills.join('-')} to {cmd.targetSkills.join('-')})
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{cmd.allocationPct}% allocation</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {allocated} / {cmd.calc.needed} heads allocated
                      {remaining > 0 && <span className="text-destructive ml-1">({remaining} short)</span>}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Add commanders in the Commanders tab to see gold head allocation and completion estimates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
