'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TechTree from '@/components/tech-tree/TechTree'
import { economyTree } from '@/lib/tech-tree/economy'
import { militaryTree } from '@/lib/tech-tree/military'


/* ---------------------------- icons ---------------------------- */
const ICONS: Record<string, string> = {
  food: '/icons/food.png',
  wood: '/icons/wood.png',
  stone: '/icons/stone.png',
  gold: '/icons/gold.png',
  core: '/icons/city.png',
  hospital: '/icons/hospital.png',
  training: '/icons/sword.png',
  wall: '/icons/city.png',
  watchtower: '/icons/city.png',
}

/* ---------------------------- types ---------------------------- */

type Account = {
  id: string
  name: string
  cityHall: number
  techLevels: Record<string, number>
  buildingLevels: Record<string, number>
}

/* ---------------------------- helpers ---------------------------- */
type TimeUnit = 'minutes' | 'hours' | 'days' | 'years'
function toMinutes(value: number, unit: TimeUnit) {
  if (unit === 'minutes') return value
  if (unit === 'hours') return value * 60
  if (unit === 'days') return value * 1440
  return value * 525600
}
function inputTimeValue(mins: number, unit: TimeUnit) {
  const v = convertMinutes(mins ?? 0, unit)
  return String(Math.round(v * 100) / 100)
}


function convertMinutes(mins: number, unit: TimeUnit) {
  if (unit === 'minutes') return mins
  if (unit === 'hours') return mins / 60
  if (unit === 'days') return mins / 1440
  return mins / 525600
}

function formatTime(mins: number, unit: TimeUnit) {
  return convertMinutes(mins, unit).toFixed(2)
}

const LVL_MIN = 1
const LVL_MAX = 25

function clampInt(v: unknown, min: number, max: number) {
  const n = Number(v)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function prettyName(id?: string | null) {
  if (!id || typeof id !== 'string') return 'Unknown'

  const m = id.match(/(.+)_([0-9]+)$/)

  if (m) {
    let base = m[1].toLowerCase()

    if (base.includes('gold')) base = 'goldmine'
    if (base.includes('lumber')) base = 'lumber_mill'

    const label =
      base === 'goldmine'
        ? 'Goldmine'
        : base === 'lumber_mill'
        ? 'Lumber Mill'
        : base
            .split('_')
            .map(w => w[0].toUpperCase() + w.slice(1))
            .join(' ')

    return `${label} ${m[2]}`
  }

  return id
    .split('_')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}


/* ---------------------------- REQUIREMENT ENGINE ---------------------------- */

type Requirement = { id: string; level: number }

const CITY_HALL_REQUIREMENTS: Record<number, Requirement[]> = {
  3: [{ id: 'wall', level: 2 }],
  4: [{ id: 'wall', level: 3 }],
  5: [{ id: 'wall', level: 4 }, { id: 'hospital', level: 4 }],
  6: [{ id: 'wall', level: 5 }, { id: 'scout_camp', level: 5 }],
  7: [{ id: 'wall', level: 6 }, { id: 'storehouse', level: 6 }],
  8: [{ id: 'wall', level: 7 }, { id: 'barracks', level: 7 }],
  9: [{ id: 'wall', level: 8 }, { id: 'alliance_center', level: 8 }],
  10: [{ id: 'wall', level: 9 }, { id: 'academy', level: 9 }],
  11: [{ id: 'wall', level: 10 }, { id: 'hospital', level: 10 }],
  12: [{ id: 'wall', level: 11 }, { id: 'storehouse', level: 11 }],
  13: [{ id: 'wall', level: 12 }, { id: 'archery_range', level: 12 }],
  14: [{ id: 'wall', level: 13 }, { id: 'alliance_center', level: 13 }, { id: 'trading_post', level: 13 }],
  15: [{ id: 'wall', level: 14 }, { id: 'scout_camp', level: 14 }],
  16: [{ id: 'wall', level: 15 }, { id: 'academy', level: 15 }],
  17: [{ id: 'wall', level: 16 }, { id: 'hospital', level: 16 }],
  18: [{ id: 'wall', level: 17 }, { id: 'storehouse', level: 17 }],
  19: [{ id: 'wall', level: 18 }, { id: 'stable', level: 18 }],
  20: [{ id: 'wall', level: 19 }, { id: 'alliance_center', level: 19 }],
  21: [{ id: 'wall', level: 20 }, { id: 'academy', level: 20 }],
  22: [{ id: 'wall', level: 21 }, { id: 'hospital', level: 21 }],
  23: [{ id: 'wall', level: 22 }, { id: 'storehouse', level: 22 }],
  24: [{ id: 'wall', level: 23 }, { id: 'siege_workshop', level: 23 }],
  25: [{ id: 'wall', level: 24 }, { id: 'trading_post', level: 24 }],
}

function buildingDeps(abstractId: string, lvl: number): Requirement[] {
  const req: Requirement[] = []

  if (abstractId !== 'city_hall' && lvl >= 2) {
    req.push({ id: 'city_hall', level: lvl })
  }

  if (abstractId === 'watchtower') {
    req.push({ id: 'wall', level: lvl })
    if (lvl >= 25) req.push({ id: 'storehouse', level: 25 })
  }

  if (abstractId === 'trading_post') {
    req.push({ id: 'goldmine', level: lvl })
  }

  if (abstractId === 'academy') {
    if (lvl >= 25) {
      req.push({ id: 'watchtower', level: 25 })
      req.push({ id: 'trading_post', level: 25 })
    }
  }

  if (abstractId === 'storehouse') {
    if (lvl >= 25) req.push({ id: 'hospital', level: 25 })
  }

  if (abstractId === 'tavern') {
    req.push({ id: 'quarry', level: lvl })
  }

  if (abstractId === 'barracks') req.push({ id: 'farm', level: lvl })
  if (abstractId === 'archery_range') req.push({ id: 'lumber', level: lvl })
  if (abstractId === 'stable') req.push({ id: 'quarry', level: lvl })

  if (abstractId === 'siege_workshop') {
    req.push({ id: 'barracks', level: lvl })
    req.push({ id: 'archery_range', level: lvl })
    req.push({ id: 'stable', level: lvl })
  }

  if (abstractId === 'hospital') {
    if (lvl >= 25) req.push({ id: 'castle', level: 25 })
  }

  if (abstractId === 'castle') {
    req.push({ id: 'alliance_center', level: lvl })
    if (lvl >= 25) req.push({ id: 'siege_workshop', level: 25 })
  }

  if (abstractId === 'wall') {
    if (lvl >= 5) req.push({ id: 'tavern', level: lvl })
  }

  return req
}

/* ---------- mapping: abstract resource -> specific instance ---------- */

function pickHighestByPrefix(map: Record<string, number>, prefix: string) {
  let bestId: string | null = null
  let bestLvl = -1
  for (const id in map) {
    if (!id.startsWith(prefix)) continue
    const lvl = map[id] ?? 0
    if (lvl > bestLvl) {
      bestLvl = lvl
      bestId = id
    }
  }
  return bestId
}

function resolveRequirementId(reqId: string, baseBuildings: Record<string, number>) {
  if (reqId === 'farm') return pickHighestByPrefix(baseBuildings, 'farm_') ?? 'farm_1'
  if (reqId === 'quarry') return pickHighestByPrefix(baseBuildings, 'quarry_') ?? 'quarry_1'

  if (reqId === 'lumber') {
    return (
      pickHighestByPrefix(baseBuildings, 'lumber') ??
      pickHighestByPrefix(baseBuildings, 'lumber_mill_') ??
      'lumber_mill_1'
    )
  }

  if (reqId === 'goldmine') {
    return (
      pickHighestByPrefix(baseBuildings, 'gold') ??
      pickHighestByPrefix(baseBuildings, 'goldmine_') ??
      'goldmine_1'
    )
  }

  return reqId
}

function toAbstractId(id: string) {
  if (id.startsWith('farm_')) return 'farm'
  if (id.startsWith('quarry_')) return 'quarry'
  if (id.startsWith('lumber')) return 'lumber'
  if (id.startsWith('gold')) return 'goldmine'
  return id
}

/* ---------- apply requirements recursively ---------- */

function applyReq(
  req: Requirement,
  goals: Record<string, number>,
  baseBuildings: Record<string, number>,
  visited: Set<string>
) {
  const resolvedId = resolveRequirementId(req.id, baseBuildings)
  const key = `${req.id}:${req.level}:${resolvedId}`
  if (visited.has(key)) return
  visited.add(key)

  goals[resolvedId] = Math.max(goals[resolvedId] ?? 0, req.level)

  const deps = buildingDeps(req.id, req.level)
  for (const d of deps) applyReq(d, goals, baseBuildings, visited)
}

function computeDerivedGoals(account: Account, manualOverrides: Record<string, number>) {
  const baseBuildings: Record<string, number> = {
    ...(account.buildingLevels ?? {}),
    city_hall: account.cityHall,
  }

  if (baseBuildings.wall == null) baseBuildings.wall = account.cityHall
  if (baseBuildings.watchtower == null) baseBuildings.watchtower = account.cityHall

  const goals: Record<string, number> = { ...baseBuildings }

  for (const id in manualOverrides) {
    goals[id] = clampInt(manualOverrides[id], LVL_MIN, LVL_MAX)
  }

  let changed = true
  while (changed) {
    changed = false
    const snapshot = { ...goals }
    const visited = new Set<string>()

    const targetCH = goals.city_hall ?? account.cityHall
    if (targetCH > account.cityHall) {
      for (let lvl = account.cityHall + 1; lvl <= targetCH; lvl++) {
        const reqs = CITY_HALL_REQUIREMENTS[lvl] ?? []
        for (const r of reqs) {
          applyReq(r, goals, baseBuildings, visited)
        }
      }
    }

    for (const id in snapshot) {
      const lvl = snapshot[id] ?? 1
      const abs = toAbstractId(id)

      if (abs !== 'city_hall' && lvl < 2) continue

      applyReq({ id: abs, level: lvl }, goals, baseBuildings, visited)
    }

    for (const k in goals) {
      if (goals[k] !== snapshot[k]) {
        changed = true
        break
      }
    }
  }

  return goals
}

/* ---------------------------- component ---------------------------- */

export function CalculatorContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const selectedAccount = useMemo(
    () => accounts.find(a => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  )
  const [universalAllocation, setUniversalAllocation] = useState({
    building: 0,
    research: 0,
  })
  const winEls = useRef(new Map<number, HTMLDivElement>())
  const dockLeftRef = useRef<HTMLDivElement | null>(null)
  const dockRightRef = useRef<HTMLDivElement | null>(null)

  const [manualGoals, setManualGoals] = useState<Record<string, number>>({})
  const [buildingSearch, setBuildingSearch] = useState('')
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours')
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [snapshotName, setSnapshotName] = useState('')
  const [costWindows, setCostWindows] = useState<any[]>([])
  const [zCounter, setZCounter] = useState(1000)
  const [speedupsMinutes, setSpeedupsMinutes] = useState(0)
  const [techGoals, setTechGoals] = useState<Record<string, number>>({})

  const [speedups, setSpeedups] = useState({
    universal: 0,
    building: 0,
    research: 0,
    training: 0,
  })

  const [resources, setResources] = useState({
    food: 0,
    wood: 0,
    stone: 0,
    gold: 0,
  })

  const [activeTree, setActiveTree] = useState<'economy' | 'military'>('economy')
  const nodes = activeTree === 'economy' ? economyTree : militaryTree
  const universalUsed = universalAllocation.building + universalAllocation.research
  const universalRemaining = Math.max(0, speedups.universal - universalUsed)

  function updateUniversalAllocation(type: 'building' | 'research', raw: string) {
    if (raw === '') {
      setUniversalAllocation(prev => ({ ...prev, [type]: 0 }))
      return
    }

    const value = Number(raw)
    if (!Number.isFinite(value)) return

    const mins = toMinutes(value, timeUnit)
    const other = type === 'building' ? universalAllocation.research : universalAllocation.building
    const maxAllowed = speedups.universal - other
    const safe = Math.max(0, Math.min(mins, maxAllowed))

    setUniversalAllocation(prev => ({ ...prev, [type]: safe }))
  }

  /* ---------------- LOAD ACCOUNTS ---------------- */
  useEffect(() => {
    if (!selectedAccountId) return
    const raw = localStorage.getItem(`calc_snaps_${selectedAccountId}`)
    if (raw) setSnapshots(JSON.parse(raw))
  }, [selectedAccountId])

  function saveSnapshot() {
    if (!selectedAccount) return

    const snap = {
      id: Date.now(),
      name: snapshotName.trim() || `Snapshot ${snapshots.length + 1}`,
      accountName: selectedAccount.name,
      time: Date.now(),
      minutes: totalMinutesNeeded,
      goals: derivedGoals,
      techGoals,
    }

    const next = [snap, ...snapshots]
    setSnapshots(next)
    localStorage.setItem(`calc_snaps_${selectedAccount.id}`, JSON.stringify(next))
    setSnapshotName('')
  }

  function deleteSnapshot(id: number) {
    if (!selectedAccount) return
    const next = snapshots.filter(s => s.id !== id)
    setSnapshots(next)
    localStorage.setItem(`calc_snaps_${selectedAccount.id}`, JSON.stringify(next))
  }

  useEffect(() => {
    const raw = localStorage.getItem('accounts')
    if (!raw) return

    const parsed: Account[] = JSON.parse(raw)
    const migrated = parsed.map(a => {
      const levels = { ...(a.buildingLevels ?? {}) }
      if (levels.wall == null) levels.wall = a.cityHall
      if (levels.watchtower == null) levels.watchtower = a.cityHall
      return { ...a, buildingLevels: levels }
    })

    setAccounts(migrated)
    localStorage.setItem('accounts', JSON.stringify(migrated))
    if (migrated.length > 0) setSelectedAccountId(migrated[0].id)
  }, [])

  useEffect(() => {
    setManualGoals({})
    setBuildingSearch('')
  }, [selectedAccountId])

  useEffect(() => {
    if (selectedAccount) setTechGoals(selectedAccount.techLevels)
  }, [selectedAccount])

  /* ---------------- DERIVED GOALS ---------------- */
  const derivedGoals = useMemo(() => {
    if (!selectedAccount) return {}
    return computeDerivedGoals(selectedAccount, manualGoals)
  }, [selectedAccount, manualGoals])

  /* ---------- BUILDING TIME ---------- */
  const buildingMinutesNeeded = useMemo(() => {
    if (!selectedAccount) return 0
    let minutes = 0
    for (const id in derivedGoals) {
      const cur = selectedAccount.buildingLevels[id] ?? 1
      const goal = derivedGoals[id]
      minutes += Math.max(0, goal - cur) * 60
    }
    return minutes
  }, [selectedAccount, derivedGoals])

  /* ---------- RESEARCH TIME ---------- */
  const researchMinutesNeeded = useMemo(() => {
    if (!selectedAccount) return 0
    let minutes = 0
    for (const id in techGoals) {
      const cur = selectedAccount.techLevels[id] ?? 0
      const goal = techGoals[id] ?? cur
      minutes += Math.max(0, goal - cur) * 90
    }
    return minutes
  }, [selectedAccount, techGoals])

  /* ---------- TOTAL TIME ---------- */
  const totalMinutesNeeded = buildingMinutesNeeded + researchMinutesNeeded

  const minutesAfterSpeedups = Math.max(
    0,
    buildingMinutesNeeded - (speedups.building + universalAllocation.building)
  )

  /* ---------- BUILDING RESOURCES ---------- */
  const buildingResourcesNeeded = useMemo(() => {
    if (!selectedAccount) return { food: 0, wood: 0, stone: 0, gold: 0 }
    const totals = { food: 0, wood: 0, stone: 0, gold: 0 }
    for (const id in derivedGoals) {
      const cur = selectedAccount.buildingLevels[id] ?? 1
      const goal = derivedGoals[id]
      const diff = Math.max(0, goal - cur)
      totals.food += diff * 1000
      totals.wood += diff * 1000
      totals.stone += diff * 800
      totals.gold += diff * 500
    }
    return totals
  }, [selectedAccount, derivedGoals])

  /* ---------- RESEARCH RESOURCES ---------- */
  const researchResourcesNeeded = useMemo(() => {
    if (!selectedAccount) return { food: 0, wood: 0, stone: 0, gold: 0 }
    const totals = { food: 0, wood: 0, stone: 0, gold: 0 }
    for (const id in techGoals) {
      const cur = selectedAccount.techLevels[id] ?? 0
      const goal = techGoals[id] ?? cur
      const diff = Math.max(0, goal - cur)
      totals.food += diff * 600
      totals.wood += diff * 600
      totals.stone += diff * 400
      totals.gold += diff * 300
    }
    return totals
  }, [selectedAccount, techGoals])

  /* ---------- TOTAL RESOURCES ---------- */
  const totalResourcesNeeded = {
    food: buildingResourcesNeeded.food + researchResourcesNeeded.food,
    wood: buildingResourcesNeeded.wood + researchResourcesNeeded.wood,
    stone: buildingResourcesNeeded.stone + researchResourcesNeeded.stone,
    gold: buildingResourcesNeeded.gold + researchResourcesNeeded.gold,
  }

  /* ---------------- GROUPING ---------------- */
  const grouped = useMemo(() => {
    if (!selectedAccount) return null

    const groups: Record<string, string[]> = {
      core: [],
      hospitals: [],
      training: [],
      farms: [],
      lumber: [],
      quarry: [],
      gold: [],
    }

    for (const id in derivedGoals) {
      const norm = id.toLowerCase()
      if (norm.startsWith('farm_')) groups.farms.push(id)
      else if (norm.startsWith('quarry_')) groups.quarry.push(id)
      else if (norm.startsWith('lumber')) groups.lumber.push(id)
      else if (norm.startsWith('gold')) groups.gold.push(id)
      else if (norm.startsWith('hospital')) groups.hospitals.push(id)
      else if (['barracks', 'archery_range', 'stable', 'siege_workshop'].includes(norm)) groups.training.push(id)
      else groups.core.push(id)
    }

    for (const k in groups) groups[k].sort()
    return groups
  }, [selectedAccount, derivedGoals])

  /* ---------------- update helpers ---------------- */

  const currentLevel = (id: string) => {
    if (!selectedAccount) return 1
    if (id === 'city_hall') return selectedAccount.cityHall
    return selectedAccount.buildingLevels[id] ?? 1
  }

  function openTechCostWindow(techId: string, current: number, target: number) {
    setCostWindows(prev => {
      const existing = prev.find(w => w.techId === techId)

      if (existing) {
        setZCounter(z => z + 1)
        if (existing.dock) {
          document.getElementById(`dock-${existing.dock}`)?.scrollIntoView({ behavior: 'smooth' })
        }
        return prev.map(w =>
          w.id === existing.id ? { ...w, z: zCounter + 1, pulse: true } : w
        )
      }

      setZCounter(z => z + 1)
      return [
        ...prev,
        {
          id: Date.now(),
          techId,
          title: techId,
          current,
          target,
          x: 240 + prev.length * 20,
          y: 140 + prev.length * 20,
          width: 360,
          height: 340,
          z: zCounter + 1,
          dock: null,
          collapsed: false,
          pulse: true,
          type: 'tech',
        },
      ]
    })
  }

  const updateTechLevels = (next: Record<string, number>) => {
    if (!selectedAccount) return
    setTechGoals(next)
    const updatedAccounts = accounts.map(a =>
      a.id === selectedAccount.id ? { ...a, techLevels: next } : a
    )
    setAccounts(updatedAccounts)
    localStorage.setItem('accounts', JSON.stringify(updatedAccounts))
  }

  const updateGoal = (id: string, lvl: number) => {
    const v = clampInt(lvl, LVL_MIN, LVL_MAX)
    const cur = currentLevel(id)

    setManualGoals(prev => {
      const next = { ...prev, [id]: v }
      if (v === cur) delete next[id]
      return next
    })
  }

  const matchesSearch = (id: string) => {
    const q = buildingSearch.trim().toLowerCase()
    if (!q) return true
    return prettyName(id).toLowerCase().includes(q)
  }

  /* ---------------- UI helpers ---------------- */

  const sectionTitle = (label: string, icon?: string) => (
    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
      {icon ? <Image src={icon || "/placeholder.svg"} alt="" width={18} height={18} /> : null}
      <span>{label}</span>
    </div>
  )

  const renderBuildingList = (title: string, ids: string[], icon?: string) => {
    if (!selectedAccount || !ids.length) return null
    const filtered = ids.filter(matchesSearch)
    if (!filtered.length) return null

    return (
      <div className="space-y-3">
        {sectionTitle(title, icon)}

        <div className="space-y-2">
          {filtered.map(id => {
            const cur = currentLevel(id)
            const derived = derivedGoals[id] ?? cur
            const diff = Math.max(0, derived - cur)
            const upgrading = diff > 0

            return (
              <div
                key={id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 hover:border-primary/30 transition-colors lg:flex-row lg:items-center lg:justify-between"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-48 text-sm font-medium text-foreground">{prettyName(id)}</div>
                  <div className="text-sm text-muted-foreground w-20">Lv {cur}</div>

                  {/* arrow */}
                  <div
                    className={`h-[2px] w-14 relative ${
                      upgrading ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 border-l-[10px] border-y-[7px] border-y-transparent ${
                        upgrading
                          ? 'border-l-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]'
                          : 'border-l-muted-foreground/30'
                      }`}
                    />
                  </div>

                  {/* GOAL DROPDOWN */}
                  <select
                    value={String(derivedGoals[id] ?? cur)}
                    className="h-9 rounded-lg border border-border bg-secondary px-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                    onChange={e => updateGoal(id, Number(e.target.value))}
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(l => (
                      <option key={l} value={String(l)}>
                        Lv {l}
                      </option>
                    ))}
                  </select>

                  {/* show derived */}
                  <div className="text-xs text-muted-foreground">
                    Derived:{' '}
                    <span className={derived > cur ? 'text-primary' : ''}>
                      Lv {derived}
                    </span>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="min-w-[200px] text-xs text-right space-y-2">
                  {upgrading ? (
                    <>
                      <div className="text-muted-foreground">
                        Needs +{diff} levels
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()

                          setCostWindows(prev => {
                            const existing = prev.find(w => w.buildingId === id)

                            if (existing) {
                              setZCounter(z => z + 1)
                              setTimeout(() => {
                                setCostWindows(p =>
                                  p.map(w =>
                                    w.id === existing.id ? { ...w, pulse: false } : w
                                  )
                                )
                              }, 900)
                              if (existing.dock) {
                                document
                                  .getElementById(`dock-${existing.dock}`)
                                  ?.scrollIntoView({ behavior: 'smooth' })
                              }
                              return prev
                                .map(w => (w.id === existing.id ? { ...w, z: zCounter + 1, pulse: false } : w))
                                .map(w => (w.id === existing.id ? { ...w, pulse: true } : w))
                            }

                            setZCounter(z => z + 1)
                            return [
                              ...prev,
                              {
                                id: Date.now(),
                                buildingId: id,
                                current: cur,
                                target: derived,
                                x: 200 + prev.length * 30,
                                y: 150 + prev.length * 30,
                                width: 360,
                                height: 340,
                                z: zCounter + 1,
                                dock: null,
                                collapsed: false,
                                pulse: true,
                              },
                            ]
                          })
                        }}
                      >
                        Show Cost
                      </Button>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No upgrade</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      {/* ACCOUNT */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Account</CardTitle>
        </CardHeader>

        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts found. Create one in the Accounts tab first.</p>
          ) : (
            <select
              className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              value={selectedAccountId ?? ''}
              onChange={e => setSelectedAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (CH {a.cityHall})
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* BUILDINGS */}
      {selectedAccount && grouped && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Building Goals</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="max-w-md">
              <div className="text-xs text-muted-foreground mb-1">Search buildings</div>
              <Input
                placeholder="e.g. Academy, Watchtower, Wall..."
                value={buildingSearch}
                onChange={e => setBuildingSearch(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {renderBuildingList('Core Buildings', grouped.core, ICONS.core)}
            {renderBuildingList('Hospitals', grouped.hospitals, ICONS.hospital)}
            {renderBuildingList('Training Buildings', grouped.training, ICONS.training)}
            {renderBuildingList('Farms', grouped.farms, ICONS.food)}
            {renderBuildingList('Lumber Mills', grouped.lumber, ICONS.wood)}
            {renderBuildingList('Quarries', grouped.quarry, ICONS.stone)}
            {renderBuildingList('Gold Mines', grouped.gold, ICONS.gold)}
          </CardContent>
        </Card>
      )}

      {/* TIME DISPLAY */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Time Display Unit</CardTitle>
        </CardHeader>

        <CardContent>
          <select
            value={timeUnit}
            onChange={e => setTimeUnit(e.target.value as TimeUnit)}
            className="h-10 rounded-lg border border-border bg-secondary px-3 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="years">Years</option>
          </select>
        </CardContent>
      </Card>

      {/* SPEEDUPS + RESOURCES */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Speedups & Resources</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* SPEEDUPS */}
          <div>
            <div className="text-sm font-semibold text-foreground mb-3">
              Speedups (entered in {timeUnit})
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['universal', 'Universal Speedups'],
                ['building', 'Building Speedups'],
                ['research', 'Research Speedups'],
                ['training', 'Training Speedups'],
              ].map(([key, label]) => (
                <div key={key}>
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <Input
                    className="bg-secondary border-border"
                    value={inputTimeValue(speedups[key as keyof typeof speedups], timeUnit)}
                    onChange={e =>
                      setSpeedups({
                        ...speedups,
                        [key]: toMinutes(Number(e.target.value), timeUnit),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RESOURCES */}
          <div>
            <div className="text-sm font-semibold text-foreground mb-3">Resources Owned</div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['food', 'Food'],
                ['wood', 'Wood'],
                ['stone', 'Stone'],
                ['gold', 'Gold'],
              ].map(([key, label]) => (
                <div key={key}>
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <Input
                    className="bg-secondary border-border"
                    value={resources[key as keyof typeof resources]}
                    onChange={e =>
                      setResources({
                        ...resources,
                        [key]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TECH TREE */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Research Goals</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTree('economy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTree === 'economy'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              Economy
            </button>

            <button
              onClick={() => setActiveTree('military')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTree === 'military'
                  ? 'bg-destructive/20 text-destructive border border-destructive/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              Military
            </button>
          </div>

          {selectedAccount && (
            <TechTree
              title=""
              nodes={nodes}
              current={selectedAccount.techLevels}
              editingCurrent={false}
              onCurrentChange={updateTechLevels}
              goals={techGoals}
              onGoalsChange={setTechGoals}
              onNodeShiftClick={(id: string, current: number, goal: number) => {
                openTechCostWindow(id, current, goal)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ALLOCATE UNIVERSAL SPEEDUPS */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Allocate Universal Speedups</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Universal &rarr; Buildings</div>
              <Input
                className="bg-secondary border-border"
                value={inputTimeValue(universalAllocation.building, timeUnit)}
                onChange={e => updateUniversalAllocation('building', e.target.value)}
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Universal &rarr; Research</div>
              <Input
                className="bg-secondary border-border"
                value={inputTimeValue(universalAllocation.research, timeUnit)}
                onChange={e => updateUniversalAllocation('research', e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {speedups.universal <= 0
              ? 'You have 0 universal speedups.'
              : `Universal remaining: ${formatTime(universalRemaining, timeUnit)} ${timeUnit}`}
          </div>
        </CardContent>
      </Card>

      {/* SNAPSHOTS */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Calculator Snapshots</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Snapshot name..."
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button onClick={saveSnapshot}>Save</Button>
          </div>

          <div className="space-y-2 text-sm">
            {snapshots.map(s => (
              <div
                key={s.id}
                className="border border-border rounded-lg p-3 space-y-1 bg-secondary/40"
              >
                <div className="font-semibold text-foreground">{s.name}</div>
                <div className="text-muted-foreground">Account: {s.accountName}</div>
                <div className="text-foreground">
                  Upgrade time: {formatTime(s.minutes, timeUnit)} {timeUnit}
                </div>
                <div className="text-muted-foreground text-xs">
                  {new Date(s.time).toLocaleString()}
                </div>
                <Button size="sm" variant="outline" className="bg-transparent" onClick={() => deleteSnapshot(s.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Upgrade Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* BUILDINGS */}
          <div className="pt-2 border-b border-border pb-2">
            <div className="font-semibold text-foreground mb-1">Buildings</div>
            <div className="text-foreground">
              Time needed:
              <b> {formatTime(buildingMinutesNeeded, timeUnit)} {timeUnit}</b>
            </div>
            <div className="text-muted-foreground text-xs">
              After speedups:{' '}
              {formatTime(
                Math.max(0, buildingMinutesNeeded - (speedups.building + universalAllocation.building)),
                timeUnit
              )}{' '}
              {timeUnit}
            </div>
          </div>

          {/* RESEARCH */}
          <div className="pt-2 border-b border-border pb-2">
            <div className="font-semibold text-foreground mb-1">Research</div>
            <div className="text-foreground">
              Time needed:
              <b> {formatTime(researchMinutesNeeded, timeUnit)} {timeUnit}</b>
            </div>
            <div className="text-muted-foreground text-xs">
              After speedups:{' '}
              {formatTime(
                Math.max(0, researchMinutesNeeded - (speedups.research + universalAllocation.research)),
                timeUnit
              )}{' '}
              {timeUnit}
            </div>
          </div>

          {/* TOTAL */}
          <div className="text-foreground">
            Total upgrade time:
            <b> {formatTime(totalMinutesNeeded, timeUnit)} {timeUnit}</b>
          </div>

          {/* RESOURCES */}
          <div className="pt-3 border-t border-border">
            <div className="font-semibold text-foreground mb-2">Resources Needed (Total)</div>

            {(Object.entries(totalResourcesNeeded) as [string, number][]).map(([k, v]) => {
              const owned = resources[k as keyof typeof resources] ?? 0
              const deficit = Math.max(0, v - owned)

              return (
                <div key={k} className="flex justify-between">
                  <span className="text-foreground">
                    {k.charAt(0).toUpperCase() + k.slice(1)}: {v.toLocaleString()}
                  </span>
                  <span className={deficit > 0 ? 'text-destructive' : 'text-green-400'}>
                    {deficit > 0 ? `Missing ${deficit.toLocaleString()}` : 'Enough'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* COST WINDOWS (FLOATING) */}
      {costWindows.map(win => {
        const diff = Math.max(0, win.target - win.current)
        const foodCost = diff * 1000
        const woodCost = diff * 1000
        const stoneCost = diff * 800
        const goldCost = diff * 500
        const totalCost = foodCost + woodCost + stoneCost + goldCost

        let borderClass = 'border-green-400'
        let glow = '0 0 18px 3px rgba(74,222,128,0.55)'
        if (totalCost > 200000) {
          borderClass = 'border-yellow-400'
          glow = '0 0 20px 4px rgba(250,204,21,0.60)'
        }
        if (totalCost > 600000) {
          borderClass = 'border-red-500'
          glow = '0 0 22px 5px rgba(248,113,113,0.70)'
        }

        if (win.dock) return null

        return (
          <div
            key={win.id}
            ref={el => {
              if (el) winEls.current.set(win.id, el)
              else winEls.current.delete(win.id)
            }}
            style={{
              position: 'fixed',
              left: win.x,
              top: win.y,
              width: win.width,
              height: win.height,
              zIndex: win.z,
              boxShadow: win.pulse ? glow : undefined,
            }}
            className={`rounded-xl border bg-card backdrop-blur ${borderClass} ${win.pulse ? 'costPulse' : ''}`}
          >
            {/* DRAG HEADER */}
            <div
              className="cursor-move px-3 py-2 flex justify-between items-center border-b border-border select-none"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()

                const el = winEls.current.get(win.id)
                if (!el) return

                setZCounter(z => z + 1)
                const nextZ = zCounter + 1
                setCostWindows(prev => prev.map(w => (w.id === win.id ? { ...w, z: nextZ } : w)))

                document.body.style.userSelect = 'none'

                const startX = e.clientX
                const startY = e.clientY
                const startLeft = win.x
                const startTop = win.y

                let lastDX = 0
                let lastDY = 0
                let raf = 0

                const onMove = (ev: MouseEvent) => {
                  lastDX = ev.clientX - startX
                  lastDY = ev.clientY - startY
                  if (raf) return
                  raf = requestAnimationFrame(() => {
                    raf = 0
                    el.style.transform = `translate3d(${lastDX}px, ${lastDY}px, 0)`
                  })
                }

                const onUp = (ev: MouseEvent) => {
                  if (raf) cancelAnimationFrame(raf)
                  raf = 0
                  document.body.style.userSelect = ''
                  const dx = ev.clientX - startX
                  const dy = ev.clientY - startY
                  const finalX = startLeft + dx
                  const finalY = startTop + dy
                  el.style.transform = ''

                  const vw = window.innerWidth

                  setCostWindows(prev =>
                    prev.map(w => {
                      if (w.id !== win.id) return w
                      if (finalX < 40) {
                        window.setTimeout(() => {
                          dockLeftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                          document
                            .getElementById(`dock-item-${w.id}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }, 10)
                        return { ...w, dock: 'left', collapsed: true, x: 0, y: 0, pulse: true }
                      }
                      if (finalX + w.width > vw - 40) {
                        window.setTimeout(() => {
                          dockRightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                          document
                            .getElementById(`dock-item-${w.id}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }, 10)
                        return { ...w, dock: 'right', collapsed: true, x: 0, y: 0, pulse: true }
                      }
                      return { ...w, x: finalX, y: finalY, dock: null }
                    })
                  )

                  window.removeEventListener('mousemove', onMove)
                  window.removeEventListener('mouseup', onUp)
                }

                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}
            >
              <div className="text-sm font-semibold text-foreground select-none">
                {win.buildingId ? prettyName(win.buildingId) : prettyName(win.techId)}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCostWindows(prev => prev.filter(w => w.id !== win.id))
                }}
              >
                X
              </Button>
            </div>

            {/* CONTENT */}
            <div className="p-3 space-y-2 text-sm text-foreground overflow-auto h-[calc(100%-44px)]">
              <div>Lv {win.current} &rarr; Lv {win.target}</div>
              <div>Levels needed: {diff}</div>
              <div>
                Time: {formatTime(diff * 60, timeUnit)} {timeUnit}
              </div>

              <div className="pt-2 border-t border-border">
                <div className="font-semibold mb-1">Resource Cost</div>
                <div>Food: {foodCost.toLocaleString()}</div>
                <div>Wood: {woodCost.toLocaleString()}</div>
                <div>Stone: {stoneCost.toLocaleString()}</div>
                <div>Gold: {goldCost.toLocaleString()}</div>
              </div>
            </div>

            {/* RESIZE HANDLE */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize select-none"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()

                const el = winEls.current.get(win.id)
                if (!el) return

                document.body.style.userSelect = 'none'

                const startX = e.clientX
                const startY = e.clientY
                const startW = win.width
                const startH = win.height

                let lastW = startW
                let lastH = startH
                let raf = 0

                const onMove = (ev: MouseEvent) => {
                  const dx = ev.clientX - startX
                  const dy = ev.clientY - startY
                  lastW = Math.max(360, startW + dx)
                  lastH = Math.max(340, startH + dy)
                  if (raf) return
                  raf = requestAnimationFrame(() => {
                    raf = 0
                    el.style.width = `${lastW}px`
                    el.style.height = `${lastH}px`
                  })
                }

                const onUp = () => {
                  if (raf) cancelAnimationFrame(raf)
                  raf = 0
                  document.body.style.userSelect = ''
                  setCostWindows(prev =>
                    prev.map(w => (w.id === win.id ? { ...w, width: lastW, height: lastH } : w))
                  )
                  window.removeEventListener('mousemove', onMove)
                  window.removeEventListener('mouseup', onUp)
                }

                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}
            />
          </div>
        )
      })}

      {/* ============ DOCKING STATION ============ */}
      {(() => {
        const docked = costWindows.filter(w => w.dock)
        if (!docked.length) return null

        return (
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-foreground">Docking Station</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent text-xs"
                  onClick={() => {
                    setCostWindows(prev =>
                      prev.map(w => w.dock ? { ...w, collapsed: !w.collapsed } : w)
                    )
                  }}
                >
                  Toggle All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setCostWindows(prev => prev.filter(w => !w.dock))}
                >
                  Clear Docked
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {docked.map(win => {
                  const diff = Math.max(0, win.target - win.current)
                  const foodCost = diff * 1000
                  const woodCost = diff * 1000
                  const stoneCost = diff * 800
                  const goldCost = diff * 500
                  const totalCost = foodCost + woodCost + stoneCost + goldCost

                  let borderClass = 'border-green-500/50'
                  if (totalCost > 200000) borderClass = 'border-yellow-500/50'
                  if (totalCost > 600000) borderClass = 'border-red-500/50'

                  let dotColor = 'bg-green-400'
                  if (totalCost > 200000) dotColor = 'bg-yellow-400'
                  if (totalCost > 600000) dotColor = 'bg-red-400'

                  return (
                    <div
                      id={`dock-item-${win.id}`}
                      key={win.id}
                      className={`rounded-lg border bg-secondary/40 overflow-hidden transition-all ${borderClass} ${win.pulse ? 'costPulse' : ''}`}
                    >
                      {/* header */}
                      <div
                        className="px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-secondary/60 transition-colors"
                        onClick={() =>
                          setCostWindows(prev =>
                            prev.map(w => w.id === win.id ? { ...w, collapsed: !w.collapsed } : w)
                          )
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <span className="text-sm font-medium text-foreground truncate">
                            {win.buildingId ? prettyName(win.buildingId) : prettyName(win.techId)}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            Lv {win.current} &rarr; {win.target}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={e => {
                              e.stopPropagation()
                              setCostWindows(prev =>
                                prev.map(w => w.id === win.id ? { ...w, dock: null, x: 240, y: 160 } : w)
                              )
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={e => {
                              e.stopPropagation()
                              setCostWindows(prev => prev.filter(w => w.id !== win.id))
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </Button>
                        </div>
                      </div>

                      {/* body */}
                      {!win.collapsed && (
                        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2 text-sm">
                          <div className="flex justify-between text-foreground">
                            <span>Levels needed</span>
                            <span className="font-medium">{diff}</span>
                          </div>
                          <div className="flex justify-between text-foreground">
                            <span>Time</span>
                            <span className="font-medium">{formatTime(diff * 60, timeUnit)} {timeUnit}</span>
                          </div>
                          <div className="pt-1 border-t border-border/40 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Food</span><span className="text-right text-foreground">{foodCost.toLocaleString()}</span>
                            <span>Wood</span><span className="text-right text-foreground">{woodCost.toLocaleString()}</span>
                            <span>Stone</span><span className="text-right text-foreground">{stoneCost.toLocaleString()}</span>
                            <span>Gold</span><span className="text-right text-foreground">{goldCost.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* DOCK ZONE INDICATORS (shown when floating windows exist) */}
      {costWindows.some(w => !w.dock) && (
        <>
          <div className="fixed left-0 top-0 h-full w-8 flex items-center justify-center pointer-events-none z-[998] bg-gradient-to-r from-primary/5 to-transparent">
            <div className="rotate-90 text-[10px] text-muted-foreground tracking-widest uppercase whitespace-nowrap">
              Drag here to dock
            </div>
          </div>
          <div className="fixed right-0 top-0 h-full w-8 flex items-center justify-center pointer-events-none z-[998] bg-gradient-to-l from-primary/5 to-transparent">
            <div className="-rotate-90 text-[10px] text-muted-foreground tracking-widest uppercase whitespace-nowrap">
              Drag here to dock
            </div>
          </div>
        </>
      )}

      {/* PULSE ANIMATION */}
      <style jsx global>{`
        .costPulse {
          animation: costPulse 1.1s ease-in-out 1;
        }
        @keyframes costPulse {
          0% {
            box-shadow: 0 0 0px rgba(168,85,247,0);
            filter: brightness(1);
          }
          50% {
            box-shadow: 0 0 24px rgba(168,85,247,0.85);
            filter: brightness(1.2);
          }
          100% {
            box-shadow: 0 0 0px rgba(168,85,247,0);
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  )
}
