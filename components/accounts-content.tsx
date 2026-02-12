'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

import TechTree from '@/components/tech-tree/TechTree'
import { economyTree } from '@/lib/tech-tree/economy'
import { militaryTree } from '@/lib/tech-tree/military'

import { expandBuildingsForCH } from '@/lib/game/buildings'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Save, X } from 'lucide-react'

type Account = {
  id: string
  name: string
  cityHall: number
  techLevels: Record<string, number>
  buildingLevels: Record<string, number>
}

/* ---------------------------- helpers ---------------------------- */

const CH_MIN = 2
const CH_MAX = 25

function clampInt(n: unknown, min: number, max: number) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.min(max, Math.max(min, Math.trunc(x)))
}

function range(min: number, max: number) {
  const out: number[] = []
  for (let i = min; i <= max; i++) out.push(i)
  return out
}

/** stable: farm_1 -> 1, farm_2 -> 2, etc */
function sortNumericSuffix(a: string, b: string) {
  const na = Number(a.split('_').at(-1))
  const nb = Number(b.split('_').at(-1))
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return a.localeCompare(b)
}

/* ---------------------------- building defs ---------------------------- */
const DECORATION_IDS = new Set([
  'lyceum_of_wisdom',
  'builders_hut',
  'builder_hut',
  'courier_station',
  'shop',
  'notice_board',
  'blacksmith',
  'monument',
])

const CORE_BUILDINGS = [
  { id: 'academy', name: 'Academy', unlockCH: 6 },
  { id: 'alliance_center', name: 'Alliance Center', unlockCH: 5 },
  { id: 'trading_post', name: 'Trading Post', unlockCH: 12 },
  { id: 'castle', name: 'Castle', unlockCH: 7 },
  { id: 'storehouse', name: 'Storehouse', unlockCH: 2 },
  { id: 'tavern', name: 'Tavern', unlockCH: 2 },
  { id: 'scout_camp', name: 'Scout Camp', unlockCH: 2 },
  { id: 'wall', name: 'Wall', unlockCH: 2 },
  { id: 'watchtower', name: 'Watchtower', unlockCH: 2 },
]

const TRAINING_BUILDINGS = [
  { id: 'barracks', name: 'Barracks', unlockCH: 2 },
  { id: 'archery_range', name: 'Archery Range', unlockCH: 2 },
  { id: 'stable', name: 'Stable', unlockCH: 2 },
  { id: 'siege_workshop', name: 'Siege Workshop', unlockCH: 4 },
]

function coreBuildingsForCH(ch: number) {
  const out: Record<string, number> = {}
  for (const b of CORE_BUILDINGS) if (ch >= b.unlockCH) out[b.id] = 1
  for (const b of TRAINING_BUILDINGS) if (ch >= b.unlockCH) out[b.id] = 1

  if (ch >= 2) {
    out['wall'] = out['wall'] ?? ch
    out['watchtower'] = out['watchtower'] ?? ch
  }

  return out
}

function prettyName(id: string) {
  const m = id.match(/(.+)_([0-9]+)$/)
  if (m) {
    const basePretty = m[1]
      .split('_')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ')
    return `${basePretty} ${m[2]}`
  }

  const core =
    CORE_BUILDINGS.find(b => b.id === id)?.name ||
    TRAINING_BUILDINGS.find(b => b.id === id)?.name

  if (core) return core

  return id
    .split('_')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

function ensureWallWatchtower(
  buildingLevels: Record<string, number>,
  cityHall: number
) {
  const next = { ...buildingLevels }

  const ch = clampInt(cityHall, CH_MIN, CH_MAX)

  const wall = clampInt(next.wall ?? ch, 1, ch)
  const watchtower = clampInt(next.watchtower ?? ch, 1, ch)

  next.wall = wall
  next.watchtower = watchtower

  for (const k of Object.keys(next)) {
    if (DECORATION_IDS.has(k)) delete next[k]
  }

  return next
}

/* ---------------------------- UI bits ---------------------------- */

function SelectNumber({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  className?: string
}) {
  const options = useMemo(() => range(min, max), [min, max])

  return (
    <select
      className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
      value={String(value)}
      onChange={e => onChange(clampInt(e.target.value, min, max))}
    >
      {options.map(n => (
        <option key={n} value={String(n)}>
          {n}
        </option>
      ))}
    </select>
  )
}

function LevelField({
  label,
  value,
  onChange,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
}) {
  return (
    <div className="w-28">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <SelectNumber value={value} onChange={onChange} min={1} max={max} />
    </div>
  )
}

function SectionHeader({
  title,
  collapsed,
  onToggle,
  iconSrc,
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
  iconSrc?: string
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 font-semibold text-foreground">
        {iconSrc ? <Image src={iconSrc || "/placeholder.svg"} alt="" width={18} height={18} /> : null}
        {title}
      </div>
      {collapsed ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

/* ---------------------------- page ---------------------------- */

export function AccountsContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editing, setEditing] = useState<Account | null>(null)

  const [creatingCH, setCreatingCH] = useState<number>(2)

  const [activeTree, setActiveTree] = useState<'economy' | 'military'>('economy')

  const [buildingSearch, setBuildingSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    core: false,
    hospitals: false,
    training: false,
    resources: false,
  })

  /* ---------- load/persist ---------- */

  useEffect(() => {
    const raw = localStorage.getItem('accounts')
    if (!raw) return

    const parsed: Account[] = JSON.parse(raw)

    const migrated = parsed.map(a => ({
      ...a,
      buildingLevels: ensureWallWatchtower(a.buildingLevels ?? {}, a.cityHall),
    }))

    setAccounts(migrated)
    localStorage.setItem('accounts', JSON.stringify(migrated))
  }, [])

  const persist = (next: Account[]) => {
    const safe = next.map(a => ({
      ...a,
      buildingLevels: ensureWallWatchtower(a.buildingLevels ?? {}, a.cityHall),
    }))
    setAccounts(safe)
    localStorage.setItem('accounts', JSON.stringify(safe))
  }

  /* ---------- create ---------- */

  const createAccountFromCH = () => {
    const ch = clampInt(creatingCH, CH_MIN, CH_MAX)

    const techDefaults: Record<string, number> = {}
    ;[...economyTree, ...militaryTree].forEach(n => (techDefaults[n.id] = n.level))

    const expanded = expandBuildingsForCH({}, ch)
    const core = coreBuildingsForCH(ch)

    const mergedRaw: Record<string, number> = { ...expanded, ...core }
    const merged = ensureWallWatchtower(mergedRaw, ch)

    setEditing({
      id: Date.now().toString(),
      name: 'New Account',
      cityHall: ch,
      techLevels: techDefaults,
      buildingLevels: merged,
    })

    setBuildingSearch('')
    setCollapsed({ core: false, hospitals: false, training: false, resources: false })
  }

  /* ---------- save/delete ---------- */

  const saveAccount = () => {
    if (!editing) return

    const safeEditing: Account = {
      ...editing,
      buildingLevels: ensureWallWatchtower(editing.buildingLevels ?? {}, editing.cityHall),
    }

    const exists = accounts.find(a => a.id === safeEditing.id)
    const next = exists
      ? accounts.map(a => (a.id === safeEditing.id ? safeEditing : a))
      : [safeEditing, ...accounts]

    persist(next)
    setEditing(null)
  }

  const deleteAccount = (id: string) => {
    persist(accounts.filter(a => a.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  /* ---------- updates ---------- */

  const updateTech = (data: Record<string, number>) => {
    if (!editing) return
    setEditing({ ...editing, techLevels: data })
  }

  const updateBuilding = (id: string, lvl: number) => {
    if (!editing) return

    const clamped = clampInt(lvl, 1, editing.cityHall)

    const nextLevels = ensureWallWatchtower(
      { ...editing.buildingLevels, [id]: clamped },
      editing.cityHall
    )

    setEditing({
      ...editing,
      buildingLevels: nextLevels,
    })
  }

  const increaseCityHall = (nextCH: number) => {
    if (!editing) return

    const clamped = clampInt(nextCH, editing.cityHall, CH_MAX)
    if (clamped <= editing.cityHall) return

    const expanded = expandBuildingsForCH({}, clamped)
    const core = coreBuildingsForCH(clamped)

    const mergedRaw: Record<string, number> = { ...expanded, ...core, ...editing.buildingLevels }
    const merged = ensureWallWatchtower(mergedRaw, clamped)

    setEditing({
      ...editing,
      cityHall: clamped,
      buildingLevels: merged,
    })
  }

  /* ---------- grouping ---------- */

  const grouped = useMemo(() => {
    if (!editing) return null

    const groups: {
      core: string[]
      training: string[]
      hospitals: string[]
      farms: string[]
      lumber: string[]
      quarry: string[]
      gold: string[]
    } = {
      core: [],
      training: [],
      hospitals: [],
      farms: [],
      lumber: [],
      quarry: [],
      gold: [],
    }

    for (const id of Object.keys(editing.buildingLevels)) {
      if (DECORATION_IDS.has(id)) continue

      const lower = id.toLowerCase()

      if (lower.includes('farm')) groups.farms.push(id)
      else if (lower.includes('lumber')) groups.lumber.push(id)
      else if (lower.includes('quarry')) groups.quarry.push(id)
      else if (lower.includes('gold')) groups.gold.push(id)
      else if (lower.includes('hospital')) groups.hospitals.push(id)
      else if (TRAINING_BUILDINGS.some(b => b.id === id)) groups.training.push(id)
      else groups.core.push(id)
    }

    groups.farms.sort(sortNumericSuffix)
    groups.lumber.sort(sortNumericSuffix)
    groups.quarry.sort(sortNumericSuffix)
    groups.gold.sort(sortNumericSuffix)
    groups.hospitals.sort(sortNumericSuffix)

    const byDefOrder = (defs: { id: string }[]) => (a: string, b: string) =>
      defs.findIndex(d => d.id === a) - defs.findIndex(d => d.id === b)

    groups.core.sort(byDefOrder(CORE_BUILDINGS))
    groups.training.sort(byDefOrder(TRAINING_BUILDINGS))

    return groups
  }, [editing])

  const matchesSearch = (id: string) => {
    const q = buildingSearch.trim().toLowerCase()
    if (!q) return true
    return prettyName(id).toLowerCase().includes(q)
  }

  /* ---------- icons (set these to your real paths) ---------- */
  const ICONS = {
    farms: '/icons/food.png',
    lumber: '/icons/wood.png',
    quarry: '/icons/stone.png',
    gold: '/icons/gold.png',
    hospitals: '/icons/hospital.png',
    training: '/icons/sword.png',
    core: '/icons/city.png',
  }

  /* ---------- render helpers ---------- */

  const renderGrid = (title: string, sectionKey: string, ids: string[], icon?: string) => {
    if (!editing || !grouped) return null
    const filtered = ids.filter(matchesSearch)
    if (filtered.length === 0) return null

    const isCollapsed = !!collapsed[sectionKey]

    return (
      <div className="space-y-2">
        <SectionHeader
          title={title}
          collapsed={isCollapsed}
          onToggle={() => setCollapsed(s => ({ ...s, [sectionKey]: !s[sectionKey] }))}
          iconSrc={icon}
        />

        {!isCollapsed && (
          <div className="grid md:grid-cols-3 gap-3 px-3">
            {filtered.map(id => (
              <div key={id} className="space-y-1">
                <div className="text-xs text-muted-foreground">{prettyName(id)} Level</div>
                <SelectNumber
                  value={editing.buildingLevels[id] ?? 1}
                  min={1}
                  max={editing.cityHall}
                  onChange={v => updateBuilding(id, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderRow = (title: string, ids: string[], icon?: string) => {
    if (!editing || !grouped) return null
    const filtered = ids.filter(matchesSearch)
    if (filtered.length === 0) return null

    return (
      <div className="space-y-2 px-3">
        {title && (
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {icon ? <Image src={icon || "/placeholder.svg"} alt="" width={18} height={18} /> : null}
            {title}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {filtered.map(id => (
            <LevelField
              key={id}
              label={prettyName(id)}
              value={editing.buildingLevels[id] ?? 1}
              max={editing.cityHall}
              onChange={v => updateBuilding(id, v)}
            />
          ))}
        </div>
      </div>
    )
  }

  const startEditing = (a: Account) => {
    const safe: Account = {
      ...a,
      buildingLevels: ensureWallWatchtower(a.buildingLevels ?? {}, a.cityHall),
    }
    setEditing(safe)
    setBuildingSearch('')
  }

  /* ---------- get current tree nodes based on activeTree ---------- */
  const nodes = activeTree === 'economy' ? economyTree : militaryTree

return (
  <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">

      {/* ACCOUNT LIST */}
      <Card className="border-border bg-card min-w-0 max-w-full overflow-hidden">        <CardHeader>
          <CardTitle className="text-foreground">Your Accounts</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {accounts.length === 0 && (
            <p className="text-muted-foreground text-sm">No accounts yet. Create one below.</p>
          )}

          {accounts.map(a => (
            <div
              key={a.id}
              className="flex justify-between items-center rounded-lg border border-border bg-secondary/40 px-4 py-3 transition-colors hover:border-primary/30"
            >
              <div className="text-foreground">
                {a.name}{' '}
                <span className="text-muted-foreground">(CH {a.cityHall})</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(a)}
                  className="bg-transparent gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteAccount(a.id)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {/* CREATE NEW */}
          {!editing && (
            <div className="flex items-end gap-3 justify-center pt-4 border-t border-border mt-4">
              <div className="w-56">
                <div className="text-xs text-muted-foreground mb-1">City Hall Level</div>
                <SelectNumber value={creatingCH} min={CH_MIN} max={CH_MAX} onChange={setCreatingCH} />
              </div>

              <Button onClick={createAccountFromCH} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDITOR */}
      {editing && grouped && (
        <>
          {/* Save/Cancel buttons at top too */}
          <div className="flex justify-center gap-3">
            <Button onClick={saveAccount} className="gap-1.5">
              <Save className="h-4 w-4" />
              Save Account
            </Button>

            <Button variant="outline" onClick={() => setEditing(null)} className="bg-transparent gap-1.5">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Account Editor</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Name</label>
                <Input
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Account name"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="w-56">
                <div className="text-xs text-muted-foreground mb-1">City Hall Level (can only increase)</div>
                <SelectNumber value={editing.cityHall} min={editing.cityHall} max={CH_MAX} onChange={increaseCityHall} />
              </div>
            </CardContent>
          </Card>

          {/* BUILDINGS */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Buildings</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* search */}
              <div className="max-w-md">
                <div className="text-xs text-muted-foreground mb-1">Search buildings</div>
                <Input
                  value={buildingSearch}
                  onChange={e => setBuildingSearch(e.target.value)}
                  placeholder="e.g. Academy, Farm 3, Hospital 2..."
                  className="bg-secondary border-border"
                />
              </div>

              {/* Core */}
              {renderGrid('Core Buildings', 'core', grouped.core, ICONS.core)}

              {/* Hospitals (row, compact) */}
              <div className="space-y-2">
                <SectionHeader
                  title="Hospitals"
                  collapsed={!!collapsed.hospitals}
                  onToggle={() => setCollapsed(s => ({ ...s, hospitals: !s.hospitals }))}
                  iconSrc={ICONS.hospitals}
                />
                {!collapsed.hospitals && renderRow('', grouped.hospitals, undefined)}
              </div>

              {/* Training */}
              {renderGrid('Training Buildings', 'training', grouped.training, ICONS.training)}

              {/* Resources */}
              <div className="space-y-2">
                <SectionHeader
                  title="Resource Buildings"
                  collapsed={!!collapsed.resources}
                  onToggle={() => setCollapsed(s => ({ ...s, resources: !s.resources }))}
                />
                {!collapsed.resources && (
                  <div className="space-y-4">
                    {renderRow('Farms', grouped.farms, ICONS.farms)}
                    {renderRow('Lumber Mills', grouped.lumber, ICONS.lumber)}
                    {renderRow('Quarries', grouped.quarry, ICONS.quarry)}
                    {renderRow('Gold Mines', grouped.gold, ICONS.gold)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TECH */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Technology</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 w-full max-w-full min-w-0 overflow-hidden">
<div className="flex gap-2">
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

{/* IMPORTANT: TechTree goes BELOW the buttons, not inside the flex row */}
<div className="w-full max-w-full min-w-0 overflow-hidden">
  <TechTree
    title=""
    nodes={nodes}
    current={editing.techLevels}
    onCurrentChange={data => updateTech(data)}
    editingCurrent={true}
    goals={editing.techLevels}
    onGoalsChange={data => updateTech(data)}
  />
</div>


            </CardContent>
          </Card>

          {/* Save/Cancel at bottom */}
          <div className="flex justify-center gap-3 pb-4">
            <Button onClick={saveAccount} className="gap-1.5">
              <Save className="h-4 w-4" />
              Save Account
            </Button>

            <Button variant="outline" onClick={() => setEditing(null)} className="bg-transparent gap-1.5">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
