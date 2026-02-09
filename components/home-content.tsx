'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays,
  BookOpen,
  Wrench,
  Users,
  Calculator,
  TrendingUp,
  Swords,
  Shield,
  Crown,
  Target,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  GripVertical,
  Map,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type TemplateCard = {
  id: string
  title: string
  description: string
  icon: string
  color: string
  bg: string
}

const ICON_OPTIONS = [
  { id: 'swords', label: 'Swords', Icon: Swords, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'shield', label: 'Shield', Icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'crown', label: 'Crown', Icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'target', label: 'Target', Icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { id: 'book', label: 'Book', Icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { id: 'wrench', label: 'Wrench', Icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'trending', label: 'Trending', Icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
]

const DEFAULT_TEMPLATES: TemplateCard[] = [
  {
    id: '1',
    title: 'KvK Preparation',
    description: 'Key steps and goals to prepare for Kingdom vs Kingdom events. Customize this card with your own checklist.',
    icon: 'swords',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    id: '2',
    title: 'Daily Routine',
    description: 'Your optimal daily activity list - gathering, training, building, and research tasks to maximize growth.',
    icon: 'shield',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: '3',
    title: 'Commander Priorities',
    description: 'Track which commanders to invest in next. Sculptures, starlight, and universal heads allocation plan.',
    icon: 'crown',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    id: '4',
    title: 'Current Goals',
    description: 'Your short-term and long-term goals. Edit this card to track power milestones, tech targets, and more.',
    icon: 'target',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
]

const LS_KEY = 'rok_home_templates'

function loadTemplates(): TemplateCard[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES
  } catch {
    return DEFAULT_TEMPLATES
  }
}

function saveTemplates(templates: TemplateCard[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates))
}

function getIconComponent(iconId: string) {
  return ICON_OPTIONS.find(o => o.id === iconId) ?? ICON_OPTIONS[0]
}

const quickLinks = [
  { id: 'calendar', icon: CalendarDays, label: 'Calendar', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { id: 'guides', icon: BookOpen, label: 'Guides', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'general-tools', icon: Wrench, label: 'General Tools', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'accounts', icon: Users, label: 'Accounts', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { id: 'calculator', icon: Calculator, label: 'Calculator', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'progression-plans', icon: TrendingUp, label: 'Progression Plans', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 'territory-planner', icon: Map, label: 'Territory Planner', color: 'text-teal-400', bg: 'bg-teal-400/10' },
]

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function HomeContent({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin ?? false
  const [templates, setTemplates] = useState<TemplateCard[]>([])
  const [editing, setEditing] = useState<TemplateCard | null>(null)

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  const persist = (next: TemplateCard[]) => {
    setTemplates(next)
    saveTemplates(next)
  }

  const addTemplate = () => {
    const newCard: TemplateCard = {
      id: Date.now().toString(),
      title: 'New Card',
      description: 'Click the edit button to customize this card with your own content.',
      icon: 'target',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    }
    setEditing(newCard)
  }

  const saveCard = (card: TemplateCard) => {
    const exists = templates.find(t => t.id === card.id)
    const next = exists
      ? templates.map(t => t.id === card.id ? card : t)
      : [...templates, card]
    persist(next)
    setEditing(null)
  }

  const deleteCard = (id: string) => {
    persist(templates.filter(t => t.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight text-balance">
          Welcome to RoK Toolkit
        </h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Your all-in-one dashboard for Rise of Kingdoms. Track accounts, plan upgrades,
          calculate costs, and stay on top of events. Use the sidebar to navigate between tools.
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map(link => {
            const Icon = link.icon
            return (
              <button
                key={link.label}
                onClick={() => onTabChange?.(link.id)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 py-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.bg}`}>
                  <Icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{link.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Template cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboard Cards
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Customizable cards for your notes, checklists, and goals.
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={addTemplate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          )}
        </div>

        {/* Card Editor */}
        {editing && (
          <TemplateEditor
            card={editing}
            onSave={saveCard}
            onCancel={() => setEditing(null)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map(card => {
            const iconOpt = getIconComponent(card.icon)
            const IconComp = iconOpt.Icon
            return (
              <Card key={card.id} className="border-border bg-card/60 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconOpt.bg}`}>
                        <IconComp className={`h-5 w-5 ${iconOpt.color}`} />
                      </div>
                      <CardTitle className="text-foreground text-base">{card.title}</CardTitle>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 bg-transparent"
                          onClick={() => setEditing(card)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent"
                          onClick={() => deleteCard(card.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {templates.length === 0 && !editing && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <GripVertical className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">{isAdmin ? 'No dashboard cards yet.' : 'Dashboard cards will appear here when an admin adds them.'}</p>
            {isAdmin && (
              <Button size="sm" onClick={addTemplate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  TEMPLATE EDITOR                                                    */
/* ================================================================== */

function TemplateEditor({
  card,
  onSave,
  onCancel,
}: {
  card: TemplateCard
  onSave: (c: TemplateCard) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [icon, setIcon] = useState(card.icon)

  const selectedIcon = getIconComponent(icon)

  return (
    <Card className="mb-4 border-primary/30">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Card title" />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Card content..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(opt => {
              const OptIcon = opt.Icon
              return (
                <button
                  key={opt.id}
                  onClick={() => setIcon(opt.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    icon === opt.id
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <OptIcon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="gap-1 bg-transparent">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={() => onSave({
              ...card,
              title,
              description,
              icon,
              color: selectedIcon.color,
              bg: selectedIcon.bg,
            })}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save Card
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
