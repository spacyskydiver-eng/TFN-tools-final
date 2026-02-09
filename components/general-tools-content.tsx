'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Zap,
  Award,
  Star,
  Crown,
  Building2,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { expandBuildingsForCH } from '@/lib/game/buildings'
import { economyTree } from '@/lib/tech-tree/economy'
import { militaryTree } from '@/lib/tech-tree/military'
import { EquipmentCalculator } from '@/components/equipment-calculator'
import { MgeCalculator } from '@/components/mge-calculator'
import { Sword, Trophy } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  TOOL TABS                                                          */
/* ------------------------------------------------------------------ */
const TOOLS = [
  { id: 'action-points', label: 'Action Points', icon: Zap },
  { id: 'skill-upgrades', label: 'Skill Upgrades', icon: Award },
  { id: 'commander-exp', label: 'Commander EXP', icon: Star },
  { id: 'vip-level', label: 'VIP Level', icon: Crown },
  { id: 'buildings', label: 'Buildings', icon: Building2 },
  { id: 'technology', label: 'Technology', icon: FlaskConical },
  { id: 'equipment', label: 'Equipment', icon: Sword },
  { id: 'mge', label: 'MGE Calculator', icon: Trophy },
] as const

type ToolId = (typeof TOOLS)[number]['id']

/* ------------------------------------------------------------------ */
/*  ACTION POINT DATA                                                  */
/* ------------------------------------------------------------------ */
const AP_POTIONS = [
  { label: '10 AP', value: 10 },
  { label: '50 AP', value: 50 },
  { label: '100 AP', value: 100 },
  { label: '500 AP', value: 500 },
  { label: '1000 AP', value: 1000 },
]

/* ------------------------------------------------------------------ */
/*  SKILL UPGRADE DATA                                                 */
/* ------------------------------------------------------------------ */
const RARITY_COSTS: Record<string, number[]> = {
  Legendary: [
    0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  ],
  Epic: [
    0, 6, 12, 18, 24, 30, 36, 42, 48, 54,
    6, 12, 18, 24, 30, 36, 42, 48, 54, 60,
    6, 12, 18, 24, 30, 36, 42, 48, 54, 60,
    6, 12, 18, 24, 30, 36, 42, 48, 54, 60,
  ],
  Elite: [
    0, 3, 6, 9, 12, 15, 18, 21, 24, 27,
    3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
    3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
    3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
  ],
  Advanced: [
    0, 2, 4, 6, 8, 10, 12, 14, 16, 18,
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
  ],
}

function parseSkillLevel(s: string): number {
  const n = Number(s)
  if (!Number.isFinite(n) || n < 1111 || n > 5555) return 0
  const d = String(n).split('').map(Number)
  if (d.length !== 4) return 0
  if (d.some(x => x < 1 || x > 5)) return 0
  return (d[0] - 1) * 10 + (d[1] - 1) * 10 + (d[2] - 1) * 10 + (d[3] - 1) * 10
}

function skillIndex(s: string): number {
  const n = Number(s)
  if (!Number.isFinite(n)) return -1
  const d = String(n).split('').map(Number)
  if (d.length !== 4) return -1
  if (d.some(x => x < 1 || x > 5)) return -1
  let idx = 0
  for (let i = 0; i < 4; i++) {
    idx += (d[i] - 1) * 10
  }
  return idx
}

function calcSkillCost(rarity: string, startStr: string, endStr: string): number | string {
  const costs = RARITY_COSTS[rarity]
  if (!costs) return 'Invalid rarity'

  const startIdx = skillIndex(startStr)
  const endIdx = skillIndex(endStr)
  if (startIdx < 0 || endIdx < 0) return 'Invalid skill level format (use e.g. 1111 to 5555)'
  if (endIdx <= startIdx) return 'Desired level must be higher than starting level'

  let total = 0
  for (let i = startIdx + 1; i <= endIdx && i < costs.length; i++) {
    total += costs[i]
  }
  return total
}

/* ------------------------------------------------------------------ */
/*  COMMANDER EXP DATA                                                 */
/* ------------------------------------------------------------------ */
const COMMANDER_MAX_LEVELS: Record<string, number> = {
  Legendary: 60,
  Epic: 50,
  Elite: 40,
  Advanced: 30,
}

function expForLevel(rarity: string, level: number): number {
  const base = rarity === 'Legendary' ? 1000 : rarity === 'Epic' ? 800 : rarity === 'Elite' ? 600 : 400
  return Math.round(base * Math.pow(1.12, level - 1))
}

function totalExpBetween(rarity: string, from: number, to: number): number {
  let sum = 0
  for (let l = from; l < to; l++) {
    sum += expForLevel(rarity, l)
  }
  return sum
}

const EXP_TOMES = [
  { label: '1K EXP', value: 1000 },
  { label: '5K EXP', value: 5000 },
  { label: '10K EXP', value: 10000 },
  { label: '50K EXP', value: 50000 },
  { label: '100K EXP', value: 100000 },
  { label: '500K EXP', value: 500000 },
]

/* ------------------------------------------------------------------ */
/*  VIP LEVEL DATA                                                     */
/* ------------------------------------------------------------------ */
const VIP_LEVELS = [
  { level: 'VIP 0', points: 0 },
  { level: 'VIP 1', points: 200 },
  { level: 'VIP 2', points: 1000 },
  { level: 'VIP 3', points: 4000 },
  { level: 'VIP 4', points: 12000 },
  { level: 'VIP 5', points: 40000 },
  { level: 'VIP 6', points: 100000 },
  { level: 'VIP 7', points: 200000 },
  { level: 'VIP 8', points: 500000 },
  { level: 'VIP 9', points: 900000 },
  { level: 'VIP 10', points: 1500000 },
  { level: 'VIP 11', points: 2500000 },
  { level: 'VIP 12', points: 5000000 },
  { level: 'VIP 13', points: 9000000 },
  { level: 'VIP 14', points: 15000000 },
  { level: 'VIP 15', points: 30000000 },
  { level: 'VIP 16', points: 60000000 },
  { level: 'VIP 17', points: 120000000 },
  { level: 'VIP 18', points: 200000000 },
  { level: 'SVIP', points: 400000000 },
]

const VIP_TOKENS = [
  { label: '100 VIP', value: 100 },
  { label: '1K VIP', value: 1000 },
  { label: '10K VIP', value: 10000 },
  { label: '50K VIP', value: 50000 },
  { label: '100K VIP', value: 100000 },
]

/* ------------------------------------------------------------------ */
/*  BUILDING DATA (reusing user's rules)                               */
/* ------------------------------------------------------------------ */
const BUILDING_DEFS = [
  { id: 'city_hall', name: 'City Hall' },
  { id: 'wall', name: 'Wall' },
  { id: 'watchtower', name: 'Watchtower' },
  { id: 'castle', name: 'Castle' },
  { id: 'academy', name: 'Academy' },
  { id: 'hospital', name: 'Hospital' },
  { id: 'barracks', name: 'Barracks' },
  { id: 'archery_range', name: 'Archery Range' },
  { id: 'stable', name: 'Stable' },
  { id: 'siege_workshop', name: 'Siege Workshop' },
  { id: 'storehouse', name: 'Storehouse' },
  { id: 'tavern', name: 'Tavern' },
  { id: 'scout_camp', name: 'Scout Camp' },
  { id: 'alliance_center', name: 'Alliance Center' },
  { id: 'trading_post', name: 'Trading Post' },
  { id: 'farm', name: 'Farm' },
  { id: 'lumber_mill', name: 'Lumber Mill' },
  { id: 'quarry', name: 'Quarry' },
  { id: 'goldmine', name: 'Gold Mine' },
]

function buildingCostPerLevel(level: number) {
  return {
    food: Math.round(1000 * Math.pow(1.25, level - 1)),
    wood: Math.round(1000 * Math.pow(1.25, level - 1)),
    stone: Math.round(800 * Math.pow(1.25, level - 1)),
    gold: Math.round(500 * Math.pow(1.25, level - 1)),
    time: Math.round(60 * Math.pow(1.15, level - 1)),
  }
}

function techCostPerLevel(level: number) {
  return {
    food: Math.round(600 * Math.pow(1.2, level - 1)),
    wood: Math.round(600 * Math.pow(1.2, level - 1)),
    stone: Math.round(400 * Math.pow(1.2, level - 1)),
    gold: Math.round(300 * Math.pow(1.2, level - 1)),
    time: Math.round(90 * Math.pow(1.15, level - 1)),
  }
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function GeneralToolsContent() {
  const [activeTool, setActiveTool] = useState<ToolId>('action-points')
  const currentIdx = TOOLS.findIndex(t => t.id === activeTool)

  const goPrev = () => {
    const idx = (currentIdx - 1 + TOOLS.length) % TOOLS.length
    setActiveTool(TOOLS[idx].id)
  }
  const goNext = () => {
    const idx = (currentIdx + 1) % TOOLS.length
    setActiveTool(TOOLS[idx].id)
  }

  return (
    <div className="space-y-6">
      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          const active = activeTool === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tool.label}
            </button>
          )
        })}
      </div>

      {/* Tool content area with navigation arrows */}
      <div className="flex items-center gap-4">
        <button
          onClick={goPrev}
          className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          aria-label="Previous tool"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex-1 min-w-0">
          {activeTool === 'action-points' && <ActionPointsCalc />}
          {activeTool === 'skill-upgrades' && <SkillUpgradesCalc />}
          {activeTool === 'commander-exp' && <CommanderExpCalc />}
          {activeTool === 'vip-level' && <VipLevelCalc />}
          {activeTool === 'buildings' && <BuildingsCalc />}
          {activeTool === 'technology' && <TechnologyCalc />}
          {activeTool === 'equipment' && <EquipmentCalculator />}
          {activeTool === 'mge' && <MgeCalculator />}
        </div>

        <button
          onClick={goNext}
          className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          aria-label="Next tool"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  ACTION POINTS CALCULATOR                                           */
/* ================================================================== */

function ActionPointsCalc() {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(AP_POTIONS.map(p => [p.value, 0]))
  )
  const [result, setResult] = useState<number | null>(null)

  const calculate = () => {
    let total = 0
    for (const p of AP_POTIONS) {
      total += (quantities[p.value] || 0) * p.value
    }
    setResult(total)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Zap className="h-7 w-7 text-primary" />
          Action Points
        </h2>
        <p className="text-muted-foreground">Calculate the total Action Points available in your inventory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action Point Potions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {AP_POTIONS.map(p => (
              <div key={p.value} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-secondary/30 p-4">
                <span className="text-sm font-medium text-foreground">{p.label}</span>
                <Input
                  type="number"
                  min={0}
                  value={quantities[p.value] || ''}
                  onChange={e => setQuantities(prev => ({
                    ...prev,
                    [p.value]: Number(e.target.value) || 0,
                  }))}
                  className="w-24 text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <Button onClick={calculate} className="w-full">
            Calculate
          </Button>

          {result !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
              <span className="text-lg font-bold text-foreground">
                {'Total: '}{result.toLocaleString()}{' Action Points'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  SKILL UPGRADES CALCULATOR                                          */
/* ================================================================== */

function SkillUpgradesCalc() {
  const [startLevel, setStartLevel] = useState('')
  const [desiredLevel, setDesiredLevel] = useState('')
  const [rarity, setRarity] = useState('Legendary')
  const [result, setResult] = useState<string | number | null>(null)

  const calculate = () => {
    const r = calcSkillCost(rarity, startLevel, desiredLevel)
    setResult(r)
  }

  const rarities = ['Legendary', 'Epic', 'Elite', 'Advanced']

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Award className="h-7 w-7 text-primary" />
          Skill Upgrades
        </h2>
        <p className="text-muted-foreground">{"Calculate the total number of sculptures required to upgrade a commander's skills."}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Starting Skill Level</Label>
            <Input
              value={startLevel}
              onChange={e => setStartLevel(e.target.value)}
              placeholder="Example: 1111"
            />
          </div>

          <div className="space-y-2">
            <Label>Desired Skill Level</Label>
            <Input
              value={desiredLevel}
              onChange={e => setDesiredLevel(e.target.value)}
              placeholder="Example: 5555"
            />
          </div>

          <div className="space-y-2">
            <Label>Commander Rarity</Label>
            <div className="grid grid-cols-2 gap-3">
              {rarities.map(r => (
                <button
                  key={r}
                  onClick={() => setRarity(r)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-4 text-sm font-medium transition-colors ${
                    rarity === r
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Award className="h-5 w-5" />
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={calculate} className="w-full">
            Calculate
          </Button>

          {result !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
              <span className="text-lg font-bold text-foreground">
                {typeof result === 'number'
                  ? `${result.toLocaleString()} Sculptures Needed`
                  : result}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  COMMANDER EXP CALCULATOR                                           */
/* ================================================================== */

function CommanderExpCalc() {
  const [currentLevel, setCurrentLevel] = useState('')
  const [currentExp, setCurrentExp] = useState('')
  const [rarity, setRarity] = useState('Legendary')
  const [useTomes, setUseTomes] = useState(false)
  const [tomeQuantities, setTomeQuantities] = useState<Record<number, number>>(
    Object.fromEntries(EXP_TOMES.map(t => [t.value, 0]))
  )
  const [result, setResult] = useState<{ expNeeded: number; tomeExp: number } | null>(null)

  const calculate = () => {
    const maxLvl = COMMANDER_MAX_LEVELS[rarity] ?? 60
    const curLvl = Number(currentLevel) || 1
    const curExp = Number(currentExp) || 0

    if (curLvl >= maxLvl) {
      setResult({ expNeeded: 0, tomeExp: 0 })
      return
    }

    const totalNeeded = totalExpBetween(rarity, curLvl, maxLvl) - curExp
    let tomeExp = 0
    if (useTomes) {
      for (const t of EXP_TOMES) {
        tomeExp += (tomeQuantities[t.value] || 0) * t.value
      }
    }
    setResult({ expNeeded: Math.max(0, totalNeeded), tomeExp })
  }

  const rarities = ['Legendary', 'Epic', 'Elite', 'Advanced']

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Star className="h-7 w-7 text-primary" />
          Commander EXP
        </h2>
        <p className="text-muted-foreground">{"Calculate the total experience needed to max out your commander's level."}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Current Level</Label>
            <Input
              value={currentLevel}
              onChange={e => setCurrentLevel(e.target.value)}
              placeholder="Example: 45"
              type="number"
            />
          </div>

          <div className="space-y-2">
            <Label>Current EXP on Level</Label>
            <Input
              value={currentExp}
              onChange={e => setCurrentExp(e.target.value)}
              placeholder="Example: 500,000"
              type="number"
            />
            <p className="text-xs text-muted-foreground">You can leave level info blank to only calculate EXP from tomes.</p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={useTomes} onCheckedChange={setUseTomes} id="calc-tomes" />
            <Label htmlFor="calc-tomes">Calculate Experience Tomes</Label>
          </div>

          {useTomes && (
            <div className="grid grid-cols-2 gap-3">
              {EXP_TOMES.map(t => (
                <div key={t.value} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={tomeQuantities[t.value] || ''}
                    onChange={e => setTomeQuantities(prev => ({
                      ...prev,
                      [t.value]: Number(e.target.value) || 0,
                    }))}
                    className="w-20 text-center"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Commander Rarity</Label>
            <div className="grid grid-cols-2 gap-3">
              {rarities.map(r => (
                <button
                  key={r}
                  onClick={() => setRarity(r)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-4 text-sm font-medium transition-colors ${
                    rarity === r
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Star className="h-5 w-5" />
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={calculate} className="w-full">
            Calculate
          </Button>

          {result !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 space-y-2 text-center">
              <div className="text-lg font-bold text-foreground">
                {'EXP Needed: '}{result.expNeeded.toLocaleString()}
              </div>
              {useTomes && result.tomeExp > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {'Tomes provide: '}{result.tomeExp.toLocaleString()}{' EXP'}
                  </div>
                  <div className={`text-sm font-semibold ${result.expNeeded - result.tomeExp > 0 ? 'text-destructive' : 'text-green-400'}`}>
                    {result.expNeeded - result.tomeExp > 0
                      ? `Still need ${(result.expNeeded - result.tomeExp).toLocaleString()} EXP`
                      : 'You have enough EXP!'}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  VIP LEVEL CALCULATOR                                               */
/* ================================================================== */

function VipLevelCalc() {
  const [currentPoints, setCurrentPoints] = useState('')
  const [desiredLevel, setDesiredLevel] = useState('SVIP')
  const [useTokens, setUseTokens] = useState(false)
  const [tokenQuantities, setTokenQuantities] = useState<Record<number, number>>(
    Object.fromEntries(VIP_TOKENS.map(t => [t.value, 0]))
  )
  const [result, setResult] = useState<{ pointsNeeded: number; tokenPoints: number } | null>(null)

  const calculate = () => {
    const target = VIP_LEVELS.find(v => v.level === desiredLevel)
    if (!target) return

    const cur = Number(currentPoints) || 0
    const needed = Math.max(0, target.points - cur)

    let tokenPts = 0
    if (useTokens) {
      for (const t of VIP_TOKENS) {
        tokenPts += (tokenQuantities[t.value] || 0) * t.value
      }
    }

    setResult({ pointsNeeded: needed, tokenPoints: tokenPts })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Crown className="h-7 w-7 text-primary" />
          VIP Level
        </h2>
        <p className="text-muted-foreground">Calculate the VIP points needed to reach your desired VIP level.</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Current VIP Points</Label>
            <Input
              value={currentPoints}
              onChange={e => setCurrentPoints(e.target.value)}
              placeholder="Example: 1,500,000"
              type="number"
            />
            <p className="text-xs text-muted-foreground">You can leave VIP points blank to only calculate VIP from tokens.</p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={useTokens} onCheckedChange={setUseTokens} id="vip-tokens" />
            <Label htmlFor="vip-tokens">Calculate VIP Tokens</Label>
          </div>

          {useTokens && (
            <div className="grid grid-cols-2 gap-3">
              {VIP_TOKENS.map(t => (
                <div key={t.value} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={tokenQuantities[t.value] || ''}
                    onChange={e => setTokenQuantities(prev => ({
                      ...prev,
                      [t.value]: Number(e.target.value) || 0,
                    }))}
                    className="w-20 text-center"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Desired VIP Level</Label>
            <Select value={desiredLevel} onValueChange={setDesiredLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIP_LEVELS.map(v => (
                  <SelectItem key={v.level} value={v.level}>
                    {v.level}{' ('}{v.points.toLocaleString()}{' pts)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={calculate} className="w-full">
            Calculate
          </Button>

          {result !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 space-y-2 text-center">
              <div className="text-lg font-bold text-foreground">
                {'Points Needed: '}{result.pointsNeeded.toLocaleString()}
              </div>
              {useTokens && result.tokenPoints > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {'Tokens provide: '}{result.tokenPoints.toLocaleString()}{' points'}
                  </div>
                  <div className={`text-sm font-semibold ${result.pointsNeeded - result.tokenPoints > 0 ? 'text-destructive' : 'text-green-400'}`}>
                    {result.pointsNeeded - result.tokenPoints > 0
                      ? `Still need ${(result.pointsNeeded - result.tokenPoints).toLocaleString()} points`
                      : 'You have enough points!'}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ================================================================== */
/*  BUILDING REQUIREMENT HELPERS                                       */
/* ================================================================== */

const BUILDING_REQUIREMENTS: Record<string, (level: number) => { id: string; level: number }[]> = {
  city_hall: (level) => {
    const reqs: { id: string; level: number }[] = [{ id: 'wall', level: level - 1 }]
    if (level >= 10) reqs.push({ id: 'academy', level: level - 1 })
    return reqs
  },
  academy: (level) => {
    const reqs: { id: string; level: number }[] = [{ id: 'city_hall', level }]
    if (level >= 25) reqs.push({ id: 'watchtower', level: 25 }, { id: 'trading_post', level: 25 })
    return reqs
  },
  castle: (level) => [{ id: 'alliance_center', level }],
  watchtower: (level) => [{ id: 'wall', level }],
  wall: (level) => level >= 5 ? [{ id: 'tavern', level }] : [],
  siege_workshop: (level) => [{ id: 'barracks', level }, { id: 'archery_range', level }, { id: 'stable', level }],
}

function getBuildingRequirements(buildingId: string, targetLevel: number, currentLevel: number): { id: string; name: string; currentLevel: number; requiredLevel: number }[] {
  const reqFn = BUILDING_REQUIREMENTS[buildingId]
  if (!reqFn) return []

  const results: { id: string; name: string; currentLevel: number; requiredLevel: number }[] = []
  for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
    const deps = reqFn(lvl)
    for (const dep of deps) {
      const existing = results.find(r => r.id === dep.id)
      if (existing) {
        existing.requiredLevel = Math.max(existing.requiredLevel, dep.level)
      } else {
        const def = BUILDING_DEFS.find(b => b.id === dep.id)
        results.push({ id: dep.id, name: def?.name ?? dep.id, currentLevel: 1, requiredLevel: dep.level })
      }
    }
  }
  return results
}

/* ================================================================== */
/*  BUILDINGS CALCULATOR (multi-upgrade)                               */
/* ================================================================== */

type BuildingUpgrade = {
  id: string
  buildingId: string
  buildingName: string
  currentLevel: number
  desiredLevel: number
}

function BuildingsCalc() {
  const [search, setSearch] = useState('')
  const [upgrades, setUpgrades] = useState<BuildingUpgrade[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState('')
  const [desiredLevel, setDesiredLevel] = useState('')
  const [calculated, setCalculated] = useState(false)

  const filteredBuildings = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return BUILDING_DEFS
    return BUILDING_DEFS.filter(b => b.name.toLowerCase().includes(q))
  }, [search])

  const addUpgrade = () => {
    if (!selectedBuilding) return
    const def = BUILDING_DEFS.find(b => b.id === selectedBuilding)
    if (!def) return
    const cur = Math.max(1, Number(currentLevel) || 1)
    const des = Math.min(25, Number(desiredLevel) || 25)
    if (des <= cur) return

    setUpgrades(prev => [...prev, {
      id: Date.now().toString(),
      buildingId: selectedBuilding,
      buildingName: def.name,
      currentLevel: cur,
      desiredLevel: des,
    }])
    setSelectedBuilding(null)
    setCurrentLevel('')
    setDesiredLevel('')
  }

  const removeUpgrade = (id: string) => {
    setUpgrades(prev => prev.filter(u => u.id !== id))
    setCalculated(false)
  }

  const addRequirement = (req: { id: string; name: string; currentLevel: number; requiredLevel: number }) => {
    setUpgrades(prev => {
      const exists = prev.find(u => u.buildingId === req.id)
      if (exists) {
        return prev.map(u => u.buildingId === req.id
          ? { ...u, desiredLevel: Math.max(u.desiredLevel, req.requiredLevel), currentLevel: req.currentLevel }
          : u
        )
      }
      return [...prev, {
        id: Date.now().toString() + req.id,
        buildingId: req.id,
        buildingName: req.name,
        currentLevel: req.currentLevel,
        desiredLevel: req.requiredLevel,
      }]
    })
  }

  const upgradeResults = useMemo(() => {
    if (!calculated) return null
    return upgrades.map(u => {
      const totals = { food: 0, wood: 0, stone: 0, gold: 0, time: 0 }
      for (let l = u.currentLevel + 1; l <= u.desiredLevel; l++) {
        const c = buildingCostPerLevel(l)
        totals.food += c.food
        totals.wood += c.wood
        totals.stone += c.stone
        totals.gold += c.gold
        totals.time += c.time
      }
      const requirements = getBuildingRequirements(u.buildingId, u.desiredLevel, u.currentLevel)
      return { ...u, cost: totals, requirements }
    })
  }, [upgrades, calculated])

  const grandTotal = useMemo(() => {
    if (!upgradeResults) return null
    const totals = { food: 0, wood: 0, stone: 0, gold: 0, time: 0 }
    for (const r of upgradeResults) {
      totals.food += r.cost.food
      totals.wood += r.cost.wood
      totals.stone += r.cost.stone
      totals.gold += r.cost.gold
      totals.time += r.cost.time
    }
    return totals
  }, [upgradeResults])

  return (
    <div className="space-y-6 max-w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          Buildings
        </h2>
        <p className="text-muted-foreground">Calculate resource costs for one or more building upgrades.</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Search Building</Label>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a building..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredBuildings.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBuilding(b.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${
                  selectedBuilding === b.id
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <Building2 className="h-5 w-5" />
                {b.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Current Level</Label>
              <Input
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                placeholder="1"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Desired Level</Label>
              <Input
                value={desiredLevel}
                onChange={e => setDesiredLevel(e.target.value)}
                placeholder="25"
                type="number"
              />
            </div>
          </div>

          <Button onClick={addUpgrade} className="w-full gap-2" disabled={!selectedBuilding}>
            <Plus className="h-4 w-4" />
            Add Upgrade
          </Button>
        </CardContent>
      </Card>

      {/* Queued upgrades */}
      {upgrades.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base">Upgrade Queue ({upgrades.length})</Label>
              <Button variant="outline" size="sm" className="bg-transparent text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setUpgrades([]); setCalculated(false) }}>
                Clear All
              </Button>
            </div>

            <div className="space-y-2">
              {upgrades.map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{u.buildingName}</span>
                    <span className="text-xs text-muted-foreground">Lv {u.currentLevel} &rarr; Lv {u.desiredLevel}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent" onClick={() => removeUpgrade(u.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={() => setCalculated(true)} className="w-full">
              Calculate All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {upgradeResults && upgradeResults.length > 0 && (
        <div className="space-y-3">
          {upgradeResults.map(r => (
            <Card key={r.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{r.buildingName}</span>
                  <span className="text-xs text-muted-foreground">Lv {r.currentLevel} &rarr; Lv {r.desiredLevel}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Food:</span><span className="text-foreground font-medium">{r.cost.food.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Wood:</span><span className="text-foreground font-medium">{r.cost.wood.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Stone:</span><span className="text-foreground font-medium">{r.cost.stone.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Gold:</span><span className="text-foreground font-medium">{r.cost.gold.toLocaleString()}</span></div>
                </div>
                <div className="text-xs text-muted-foreground">{'Time: '}{Math.round(r.cost.time / 60)}{' hours'}</div>

                {/* Requirements */}
                {r.requirements.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Required Buildings
                    </div>
                    {r.requirements.map(req => {
                      const alreadyQueued = upgrades.some(u => u.buildingId === req.id && u.desiredLevel >= req.requiredLevel)
                      return (
                        <div key={req.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{req.name} Lv {req.requiredLevel}</span>
                          {!alreadyQueued ? (
                            <Button size="sm" variant="outline" className="h-7 gap-1 bg-transparent text-xs" onClick={() => addRequirement(req)}>
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          ) : (
                            <span className="text-xs text-green-400">In queue</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Grand total */}
          {grandTotal && upgrades.length > 1 && (
            <Card className="border-primary/30">
              <CardContent className="space-y-2 pt-4">
                <div className="text-center font-bold text-foreground">Total Cost (All Upgrades)</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Food:</span><span className="text-foreground font-medium">{grandTotal.food.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Wood:</span><span className="text-foreground font-medium">{grandTotal.wood.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Stone:</span><span className="text-foreground font-medium">{grandTotal.stone.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Gold:</span><span className="text-foreground font-medium">{grandTotal.gold.toLocaleString()}</span></div>
                </div>
                <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
                  {'Total Time: '}{Math.round(grandTotal.time / 60)}{' hours'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  TECHNOLOGY CALCULATOR (multi-upgrade)                              */
/* ================================================================== */

type TechUpgrade = {
  id: string
  techId: string
  techName: string
  currentLevel: number
  desiredLevel: number
  maxLevel: number
}

function TechnologyCalc() {
  const allTech = useMemo(() => [...economyTree, ...militaryTree], [])
  const [search, setSearch] = useState('')
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState('')
  const [desiredLevel, setDesiredLevel] = useState('')
  const [upgrades, setUpgrades] = useState<TechUpgrade[]>([])
  const [calculated, setCalculated] = useState(false)

  const filteredTech = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allTech
    return allTech.filter(t => t.name.toLowerCase().includes(q))
  }, [search, allTech])

  const selectedNode = allTech.find(t => t.id === selectedTech)

  const addUpgrade = () => {
    if (!selectedTech || !selectedNode) return
    const cur = Math.max(0, Number(currentLevel) || 0)
    const des = Math.min(selectedNode.maxLevel, Number(desiredLevel) || selectedNode.maxLevel)
    if (des <= cur) return

    setUpgrades(prev => [...prev, {
      id: Date.now().toString(),
      techId: selectedTech,
      techName: selectedNode.name,
      currentLevel: cur,
      desiredLevel: des,
      maxLevel: selectedNode.maxLevel,
    }])
    setSelectedTech(null)
    setCurrentLevel('')
    setDesiredLevel('')
    setCalculated(false)
  }

  const removeUpgrade = (id: string) => {
    setUpgrades(prev => prev.filter(u => u.id !== id))
    setCalculated(false)
  }

  const upgradeResults = useMemo(() => {
    if (!calculated) return null
    return upgrades.map(u => {
      const totals = { food: 0, wood: 0, stone: 0, gold: 0, time: 0 }
      for (let l = u.currentLevel + 1; l <= u.desiredLevel; l++) {
        const c = techCostPerLevel(l)
        totals.food += c.food
        totals.wood += c.wood
        totals.stone += c.stone
        totals.gold += c.gold
        totals.time += c.time
      }
      return { ...u, cost: totals }
    })
  }, [upgrades, calculated])

  const grandTotal = useMemo(() => {
    if (!upgradeResults) return null
    const totals = { food: 0, wood: 0, stone: 0, gold: 0, time: 0 }
    for (const r of upgradeResults) {
      totals.food += r.cost.food
      totals.wood += r.cost.wood
      totals.stone += r.cost.stone
      totals.gold += r.cost.gold
      totals.time += r.cost.time
    }
    return totals
  }, [upgradeResults])

  return (
    <div className="space-y-6 max-w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
          <FlaskConical className="h-7 w-7 text-primary" />
          Technology
        </h2>
        <p className="text-muted-foreground">Calculate resource costs for one or more technology researches.</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Search Technology</Label>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a technology..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredTech.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTech(t.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${
                  selectedTech === t.id
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <FlaskConical className="h-4 w-4" />
                {t.name}
              </button>
            ))}
          </div>

          {selectedNode && (
            <p className="text-xs text-muted-foreground text-center">
              {'Max Level: '}{selectedNode.maxLevel}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Current Level</Label>
              <Input
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                placeholder="0"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Desired Level</Label>
              <Input
                value={desiredLevel}
                onChange={e => setDesiredLevel(e.target.value)}
                placeholder={selectedNode ? String(selectedNode.maxLevel) : '10'}
                type="number"
              />
            </div>
          </div>

          <Button onClick={addUpgrade} className="w-full gap-2" disabled={!selectedTech}>
            <Plus className="h-4 w-4" />
            Add Research
          </Button>
        </CardContent>
      </Card>

      {/* Queued upgrades */}
      {upgrades.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base">Research Queue ({upgrades.length})</Label>
              <Button variant="outline" size="sm" className="bg-transparent text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setUpgrades([]); setCalculated(false) }}>
                Clear All
              </Button>
            </div>

            <div className="space-y-2">
              {upgrades.map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{u.techName}</span>
                    <span className="text-xs text-muted-foreground">Lv {u.currentLevel} &rarr; Lv {u.desiredLevel}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent" onClick={() => removeUpgrade(u.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={() => setCalculated(true)} className="w-full">
              Calculate All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {upgradeResults && upgradeResults.length > 0 && (
        <div className="space-y-3">
          {upgradeResults.map(r => (
            <Card key={r.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{r.techName}</span>
                  <span className="text-xs text-muted-foreground">Lv {r.currentLevel} &rarr; Lv {r.desiredLevel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Food:</span><span className="text-foreground font-medium">{r.cost.food.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Wood:</span><span className="text-foreground font-medium">{r.cost.wood.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Stone:</span><span className="text-foreground font-medium">{r.cost.stone.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Gold:</span><span className="text-foreground font-medium">{r.cost.gold.toLocaleString()}</span></div>
                </div>
                <div className="text-xs text-muted-foreground">{'Time: '}{Math.round(r.cost.time / 60)}{' hours'}</div>
              </CardContent>
            </Card>
          ))}

          {grandTotal && upgrades.length > 1 && (
            <Card className="border-primary/30">
              <CardContent className="space-y-2 pt-4">
                <div className="text-center font-bold text-foreground">Total Research Cost</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Food:</span><span className="text-foreground font-medium">{grandTotal.food.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Wood:</span><span className="text-foreground font-medium">{grandTotal.wood.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Stone:</span><span className="text-foreground font-medium">{grandTotal.stone.toLocaleString()}</span></div>
                  <div className="flex justify-between px-2"><span className="text-muted-foreground">Gold:</span><span className="text-foreground font-medium">{grandTotal.gold.toLocaleString()}</span></div>
                </div>
                <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
                  {'Total Time: '}{Math.round(grandTotal.time / 60)}{' hours'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
