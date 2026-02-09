'use client'

import React from "react"

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sword,
  Shield,
  Search,
  X,
  Plus,
  Trash2,
  ArrowLeftRight,
  Hammer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  type Equipment,
  type EquipmentSlot,
  type Loadout,
  type StatType,
  type MaterialTier,
  EQUIPMENT_DB,
  SLOT_META,
  SLOT_ORDER,
  RARITY_COLORS,
  MATERIALS,
  STAT_LABELS,
  getLoadoutStats,
  computeCraftingTotals,
} from '@/lib/game/equipment'

/* ================================================================== */
/*  SUB-TAB NAVIGATION                                                 */
/* ================================================================== */

type EquipmentTab = 'crafting' | 'compare'

/* ================================================================== */
/*  EQUIPMENT SLOT (Diamond shape)                                     */
/* ================================================================== */

function EquipmentSlotDiamond({
  slot,
  equipped,
  onClick,
  isActive,
}: {
  slot: EquipmentSlot
  equipped?: Equipment
  onClick: () => void
  isActive: boolean
}) {
  const meta = SLOT_META[slot]
  const rarity = equipped ? RARITY_COLORS[equipped.rarity] : null

  return (
    <button
      onClick={onClick}
      className={`group relative flex h-16 w-16 items-center justify-center transition-all duration-200 ${
        isActive ? 'scale-110' : 'hover:scale-105'
      }`}
      title={equipped ? equipped.name : meta.label}
    >
      {/* Diamond shape */}
      <div
        className={`absolute inset-0 rotate-45 rounded-md border-2 transition-all duration-200 ${
          equipped
            ? `${rarity!.bg} ${rarity!.border}`
            : 'border-border/60 bg-secondary/40'
        } ${isActive ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'group-hover:border-primary/40'}`}
        style={equipped && !isActive ? { boxShadow: rarity!.glow } : undefined}
      />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {equipped ? (
          <Shield className={`h-5 w-5 ${rarity!.text}`} />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
      {/* Label underneath */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
        {meta.label}
      </span>
    </button>
  )
}

/* ================================================================== */
/*  EQUIPMENT SELECTOR MODAL                                           */
/* ================================================================== */

function EquipmentSelector({
  slot,
  onSelect,
  onClose,
  onAddToCrafting,
}: {
  slot: EquipmentSlot
  onSelect: (eq: Equipment) => void
  onClose: () => void
  onAddToCrafting?: (eq: Equipment) => void
}) {
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string>('all')

  const items = useMemo(() => {
    let filtered = EQUIPMENT_DB.filter(eq => eq.slot === slot)
    if (rarityFilter !== 'all') filtered = filtered.filter(eq => eq.rarity === rarityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(eq => eq.name.toLowerCase().includes(q))
    }
    return filtered
  }, [slot, search, rarityFilter])

  const rarities = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'] as const

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          {'Select '}{SLOT_META[slot].label}
        </h3>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search equipment..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {rarities.map(r => (
          <button
            key={r}
            onClick={() => setRarityFilter(r)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              rarityFilter === r
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No equipment found for this slot.</p>
        )}
        {items.map(eq => {
          const rc = RARITY_COLORS[eq.rarity]
          return (
            <div
              key={eq.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-md ${rc.bg} ${rc.border}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${rc.text}`}>{eq.name}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {eq.stats.map(s => (
                    <span key={s.type} className="text-xs text-foreground">
                      {STAT_LABELS[s.type]} <span className="text-green-400">{'+' + s.value + '%'}</span>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {eq.materials.map(m => {
                    const mat = MATERIALS.find(x => x.id === m.materialId)
                    const tierData = mat?.tiers.find(t => t.tier === m.tier)
                    return (
                      <span key={m.materialId + m.tier} className="text-[10px] font-medium" style={{ color: tierData?.color ?? '#888' }}>
                        {mat?.name}: {m.amount}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 ml-3 flex-shrink-0">
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onSelect(eq)}>
                  Equip
                </Button>
                {onAddToCrafting && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-transparent" onClick={() => onAddToCrafting(eq)}>
                    <Plus className="h-3 w-3" />
                    Craft
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  LOADOUT DISPLAY (diamond grid)                                     */
/* ================================================================== */

function LoadoutGrid({
  loadout,
  activeSlot,
  onSlotClick,
  label,
  onClear,
}: {
  loadout: Loadout
  activeSlot: EquipmentSlot | null
  onSlotClick: (slot: EquipmentSlot) => void
  label: string
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-bold text-foreground">{label}</h3>
        <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px] text-destructive border-destructive/30 bg-transparent hover:bg-destructive/10" onClick={onClear}>
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="flex flex-col items-center gap-8 py-2">
        {/* Row 0 - Helmet */}
        <div className="flex justify-center">
          <EquipmentSlotDiamond slot="helmet" equipped={loadout.helmet} onClick={() => onSlotClick('helmet')} isActive={activeSlot === 'helmet'} />
        </div>
        {/* Row 1 - Weapon + Chest */}
        <div className="flex gap-12 justify-center">
          <EquipmentSlotDiamond slot="weapon" equipped={loadout.weapon} onClick={() => onSlotClick('weapon')} isActive={activeSlot === 'weapon'} />
          <EquipmentSlotDiamond slot="chest" equipped={loadout.chest} onClick={() => onSlotClick('chest')} isActive={activeSlot === 'chest'} />
        </div>
        {/* Row 2 - Gloves + Legs */}
        <div className="flex gap-12 justify-center">
          <EquipmentSlotDiamond slot="gloves" equipped={loadout.gloves} onClick={() => onSlotClick('gloves')} isActive={activeSlot === 'gloves'} />
          <EquipmentSlotDiamond slot="legs" equipped={loadout.legs} onClick={() => onSlotClick('legs')} isActive={activeSlot === 'legs'} />
        </div>
        {/* Row 3 - Boots */}
        <div className="flex justify-center">
          <EquipmentSlotDiamond slot="boots" equipped={loadout.boots} onClick={() => onSlotClick('boots')} isActive={activeSlot === 'boots'} />
        </div>
        {/* Row 4 - Accessories */}
        <div className="flex gap-12 justify-center">
          <EquipmentSlotDiamond slot="accessory_1" equipped={loadout.accessory_1} onClick={() => onSlotClick('accessory_1')} isActive={activeSlot === 'accessory_1'} />
          <EquipmentSlotDiamond slot="accessory_2" equipped={loadout.accessory_2} onClick={() => onSlotClick('accessory_2')} isActive={activeSlot === 'accessory_2'} />
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  LOADOUT STATS PANEL                                                */
/* ================================================================== */

function LoadoutStatsPanel({ loadout, label }: { loadout: Loadout; label?: string }) {
  const stats = getLoadoutStats(loadout)
  const activeStats = (Object.entries(stats) as [StatType, number][]).filter(([, v]) => v > 0)

  if (activeStats.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-4 text-center text-sm text-muted-foreground">
        No items equipped. Click a slot to add equipment.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{label ?? 'Loadout Stats'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {activeStats.map(([type, value]) => (
          <div key={type} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{STAT_LABELS[type]}</span>
            <span className="font-medium text-green-400">{'+' + value + '%'}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  COMPARISON STATS TABLE                                             */
/* ================================================================== */

function ComparisonStatsTable({ loadoutA, loadoutB }: { loadoutA: Loadout; loadoutB: Loadout }) {
  const statsA = getLoadoutStats(loadoutA)
  const statsB = getLoadoutStats(loadoutB)

  const allTypes = (Object.keys(STAT_LABELS) as StatType[]).filter(t => statsA[t] > 0 || statsB[t] > 0)

  if (allTypes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
        Equip items in both loadouts to compare stats.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Loadout Stats Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground">Stats</th>
                <th className="py-2 text-center font-medium text-blue-400">Loadout A</th>
                <th className="py-2 text-center font-medium text-amber-400">Loadout B</th>
                <th className="py-2 text-center font-medium text-muted-foreground">Delta</th>
              </tr>
            </thead>
            <tbody>
              {allTypes.map(type => {
                const a = statsA[type]
                const b = statsB[type]
                const delta = a - b
                return (
                  <tr key={type} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">{STAT_LABELS[type]}</td>
                    <td className="py-2 text-center font-medium text-blue-400">{a > 0 ? a + '%' : '0%'}</td>
                    <td className="py-2 text-center font-medium text-amber-400">{b > 0 ? b + '%' : '0%'}</td>
                    <td className={`py-2 text-center font-medium ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {delta > 0 ? '+' + delta + '%' : delta < 0 ? delta + '%' : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  CRAFTING LIST PANEL                                                */
/* ================================================================== */

function CraftingListPanel({
  craftingList,
  onRemove,
  onClear,
  inventory,
}: {
  craftingList: Equipment[]
  onRemove: (idx: number) => void
  onClear: () => void
  inventory: Record<string, Record<number, number>>
}) {
  const totals = useMemo(() => computeCraftingTotals(craftingList), [craftingList])

  if (craftingList.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Add equipment from the selector to calculate crafting costs.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Crafting List ({craftingList.length})</CardTitle>
            <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px] text-destructive border-destructive/30 bg-transparent hover:bg-destructive/10" onClick={onClear}>
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {craftingList.map((eq, idx) => {
            const rc = RARITY_COLORS[eq.rarity]
            return (
              <div key={eq.id + '-' + idx} className={`flex items-center justify-between rounded-md border px-3 py-2 ${rc.bg} ${rc.border}`}>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${rc.text}`}>{eq.name}</div>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {eq.materials.map(m => {
                      const mat = MATERIALS.find(x => x.id === m.materialId)
                      const tierData = mat?.tiers.find(t => t.tier === m.tier)
                      return (
                        <span key={m.materialId + m.tier} className="text-[10px]" style={{ color: tierData?.color ?? '#888' }}>
                          {m.amount}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 w-6 p-0 bg-transparent text-muted-foreground hover:text-destructive" onClick={() => onRemove(idx)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Materials Needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MATERIALS.map(mat => {
            const needed = totals.materials[mat.id]
            if (!needed) return null
            return (
              <div key={mat.id} className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">{mat.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {mat.tiers.map(t => {
                    const qty = needed[t.tier] ?? 0
                    if (qty === 0) return null
                    const owned = inventory[mat.id]?.[t.tier] ?? 0
                    const remaining = Math.max(0, qty - owned)
                    return (
                      <div key={t.tier} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/30 px-2 py-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-xs font-medium text-foreground">
                          {remaining > 0 ? (
                            <><span className="text-destructive">{remaining}</span>{'/' + qty}</>
                          ) : (
                            <span className="text-green-400">{qty}</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gold Cost:</span>
            <span className="font-medium text-amber-400">{totals.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Craft Time:</span>
            <span className="font-medium text-foreground">
              {Math.floor(totals.time / 1440)}{'d '}{Math.floor((totals.time % 1440) / 60)}{'h'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  MATERIAL INVENTORY PANEL                                           */
/* ================================================================== */

function MaterialInventoryPanel({
  inventory,
  onChange,
  onReset,
}: {
  inventory: Record<string, Record<number, number>>
  onChange: (matId: string, tier: number, value: number) => void
  onReset: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => setExpanded(!expanded)}>
            <CardTitle className="text-sm">Material Inventory</CardTitle>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {MATERIALS.map(mat => (
            <div key={mat.id} className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{mat.name}</Label>
              <div className="flex flex-wrap gap-2">
                {mat.tiers.map(t => (
                  <div key={t.tier} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: t.color }} />
                    <Input
                      type="number"
                      min={0}
                      value={inventory[mat.id]?.[t.tier] ?? ''}
                      onChange={e => onChange(mat.id, t.tier, Number(e.target.value) || 0)}
                      className="h-7 w-14 text-center text-xs"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

/* ================================================================== */
/*  MAIN EQUIPMENT CALCULATOR                                          */
/* ================================================================== */

export function EquipmentCalculator() {
  const [activeTab, setActiveTab] = useState<EquipmentTab>('crafting')

  // Crafting mode state
  const [loadoutA, setLoadoutA] = useState<Loadout>({})
  const [activeSlotA, setActiveSlotA] = useState<EquipmentSlot | null>(null)
  const [craftingList, setCraftingList] = useState<Equipment[]>([])
  const [inventory, setInventory] = useState<Record<string, Record<number, number>>>({})

  // Compare mode state
  const [loadoutB, setLoadoutB] = useState<Loadout>({})
  const [activeSlotB, setActiveSlotB] = useState<EquipmentSlot | null>(null)
  const [activeComparePanel, setActiveComparePanel] = useState<'a' | 'b'>('a')

  const handleEquipA = useCallback((eq: Equipment) => {
    setLoadoutA(prev => ({ ...prev, [eq.slot]: eq }))
    setActiveSlotA(null)
  }, [])

  const handleEquipB = useCallback((eq: Equipment) => {
    setLoadoutB(prev => ({ ...prev, [eq.slot]: eq }))
    setActiveSlotB(null)
  }, [])

  const addToCraftingList = useCallback((eq: Equipment) => {
    setCraftingList(prev => [...prev, eq])
  }, [])

  const removeCraftingItem = useCallback((idx: number) => {
    setCraftingList(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const updateInventory = useCallback((matId: string, tier: number, value: number) => {
    setInventory(prev => ({
      ...prev,
      [matId]: { ...prev[matId], [tier]: value },
    }))
  }, [])

  const tabs: { id: EquipmentTab; label: string; icon: React.ElementType }[] = [
    { id: 'crafting', label: 'Crafting Calculator', icon: Hammer },
    { id: 'compare', label: 'Compare Sets', icon: ArrowLeftRight },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Sword className="h-7 w-7 text-primary" />
          Equipment
        </h2>
        <p className="text-muted-foreground">Build loadouts, calculate crafting costs, and compare equipment sets.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex justify-center gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                  : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* CRAFTING CALCULATOR TAB */}
      {activeTab === 'crafting' && (
        <div className="space-y-6">
          {/* Loadout + Selector side by side at larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Loadout */}
            <div className="lg:col-span-1">
              <Card className="overflow-visible">
                <CardContent className="pt-6">
                  <LoadoutGrid
                    loadout={loadoutA}
                    activeSlot={activeSlotA}
                    onSlotClick={s => setActiveSlotA(prev => prev === s ? null : s)}
                    label="Equipment Loadout"
                    onClear={() => { setLoadoutA({}); setActiveSlotA(null) }}
                  />
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="mt-4">
                <LoadoutStatsPanel loadout={loadoutA} />
              </div>
            </div>

            {/* CENTER: Equipment Selector (when slot is active) or instructions */}
            <div className="lg:col-span-1">
              {activeSlotA ? (
                <Card>
                  <CardContent className="pt-6">
                    <EquipmentSelector
                      slot={activeSlotA}
                      onSelect={handleEquipA}
                      onClose={() => setActiveSlotA(null)}
                      onAddToCrafting={addToCraftingList}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                      <Sword className="h-7 w-7 text-primary/60" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Select a Slot</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Click on an equipment slot to browse and equip items or add them to your crafting list.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Search & add to crafting directly */}
              <CraftingSearchPanel onAdd={addToCraftingList} />
            </div>

            {/* RIGHT: Crafting list + Inventory */}
            <div className="lg:col-span-1 space-y-4">
              <MaterialInventoryPanel
                inventory={inventory}
                onChange={updateInventory}
                onReset={() => setInventory({})}
              />
              <CraftingListPanel
                craftingList={craftingList}
                onRemove={removeCraftingItem}
                onClear={() => setCraftingList([])}
                inventory={inventory}
              />
            </div>
          </div>
        </div>
      )}

      {/* COMPARE SETS TAB */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loadout A */}
            <Card className="overflow-visible">
              <CardContent className="pt-6">
                <LoadoutGrid
                  loadout={loadoutA}
                  activeSlot={activeComparePanel === 'a' ? activeSlotA : null}
                  onSlotClick={s => { setActiveComparePanel('a'); setActiveSlotA(prev => prev === s ? null : s); setActiveSlotB(null) }}
                  label="Loadout A"
                  onClear={() => setLoadoutA({})}
                />
              </CardContent>
            </Card>

            {/* Center: Selector or Comparison */}
            <div className="space-y-4">
              {(activeSlotA && activeComparePanel === 'a') ? (
                <Card>
                  <CardContent className="pt-6">
                    <EquipmentSelector
                      slot={activeSlotA}
                      onSelect={handleEquipA}
                      onClose={() => setActiveSlotA(null)}
                    />
                  </CardContent>
                </Card>
              ) : (activeSlotB && activeComparePanel === 'b') ? (
                <Card>
                  <CardContent className="pt-6">
                    <EquipmentSelector
                      slot={activeSlotB}
                      onSelect={handleEquipB}
                      onClose={() => setActiveSlotB(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <ComparisonStatsTable loadoutA={loadoutA} loadoutB={loadoutB} />
              )}
            </div>

            {/* Loadout B */}
            <Card className="overflow-visible">
              <CardContent className="pt-6">
                <LoadoutGrid
                  loadout={loadoutB}
                  activeSlot={activeComparePanel === 'b' ? activeSlotB : null}
                  onSlotClick={s => { setActiveComparePanel('b'); setActiveSlotB(prev => prev === s ? null : s); setActiveSlotA(null) }}
                  label="Loadout B"
                  onClear={() => setLoadoutB({})}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  CRAFTING SEARCH PANEL (search+add without slot selection)          */
/* ================================================================== */

function CraftingSearchPanel({ onAdd }: { onAdd: (eq: Equipment) => void }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const results = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return EQUIPMENT_DB.filter(eq => eq.name.toLowerCase().includes(q)).slice(0, 8)
  }, [search])

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <button className="flex items-center gap-2" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-sm">Add to Crafting List</CardTitle>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for an item..."
              className="pl-9"
            />
          </div>
          {results.length > 0 && (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {results.map(eq => {
                const rc = RARITY_COLORS[eq.rarity]
                return (
                  <button
                    key={eq.id}
                    onClick={() => { onAdd(eq); setSearch('') }}
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-all hover:shadow-sm ${rc.bg} ${rc.border}`}
                  >
                    <Shield className={`h-4 w-4 flex-shrink-0 ${rc.text}`} />
                    <span className={`text-xs font-semibold ${rc.text}`}>{eq.name}</span>
                    <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
