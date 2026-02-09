'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Link as LinkIcon,
  ImagePlus,
  Type,
  Eye,
  Pencil,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type GuideBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'text'; html: string }
  | { type: 'image'; src: string; caption: string }
  | { type: 'embed'; url: string }
  | { type: 'divider' }

type Guide = {
  id: string
  title: string
  description: string
  coverImage: string
  category: string
  blocks: GuideBlock[]
  createdAt: number
  updatedAt: number
}

const CATEGORIES = [
  'Commander Guides',
  'Strategy',
  'KvK',
  'Events',
  'Tips & Tricks',
  'Other',
]

const LS_KEY = 'rok_guides'

function loadGuides(): Guide[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveGuides(guides: Guide[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(guides))
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function GuidesContent() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin ?? false
  const [guides, setGuides] = useState<Guide[]>([])
  const [editing, setEditing] = useState<Guide | null>(null)
  const [viewing, setViewing] = useState<Guide | null>(null)

  useEffect(() => {
    setGuides(loadGuides())
  }, [])

  const persist = (next: Guide[]) => {
    setGuides(next)
    saveGuides(next)
  }

  const createGuide = () => {
    const newGuide: Guide = {
      id: Date.now().toString(),
      title: 'New Guide',
      description: '',
      coverImage: '',
      category: 'Other',
      blocks: [{ type: 'text', html: '<p>Start writing your guide here...</p>' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setEditing(newGuide)
  }

  const saveGuide = (guide: Guide) => {
    const updated = { ...guide, updatedAt: Date.now() }
    const exists = guides.find(g => g.id === updated.id)
    const next = exists
      ? guides.map(g => (g.id === updated.id ? updated : g))
      : [updated, ...guides]
    persist(next)
    setEditing(null)
  }

  const deleteGuide = (id: string) => {
    persist(guides.filter(g => g.id !== id))
    if (editing?.id === id) setEditing(null)
    if (viewing?.id === id) setViewing(null)
  }

  // Viewing a guide
  if (viewing) {
    return <GuideViewer guide={viewing} onBack={() => setViewing(null)} onEdit={isAdmin ? () => { setViewing(null); setEditing(viewing) } : undefined} />
  }

  // Editing a guide
  if (editing) {
    return <GuideEditor guide={editing} onSave={saveGuide} onCancel={() => setEditing(null)} />
  }

  // Guide list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Guides</h2>
          <p className="text-sm text-muted-foreground">Create and manage your Rise of Kingdoms guides.</p>
        </div>
        {isAdmin && (
          <Button onClick={createGuide} className="gap-2">
            <Plus className="h-4 w-4" />
            New Guide
          </Button>
        )}
      </div>

      {guides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Edit3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No guides yet</h3>
            <p className="text-sm text-muted-foreground mb-4">{isAdmin ? 'Create your first guide to get started.' : 'Guides will appear here when an admin creates them.'}</p>
            {isAdmin && (
              <Button onClick={createGuide} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Guide
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {guides.map(guide => (
            <Card
              key={guide.id}
              className="group cursor-pointer overflow-hidden border-border hover:border-primary/40 hover:shadow-[0_0_40px_-8px_hsl(var(--glow)/0.25)] transition-all duration-300"
              onClick={() => setViewing(guide)}
            >
              {guide.coverImage && (
                <div className="h-36 w-full overflow-hidden bg-secondary">
                  <img
                    src={guide.coverImage || "/placeholder.svg"}
                    alt={guide.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <CardContent className={`space-y-2 ${guide.coverImage ? 'pt-4' : 'pt-6'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-primary">{guide.category}</span>
                    <h3 className="text-base font-bold text-foreground truncate">{guide.title}</h3>
                    {guide.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{guide.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={e => { e.stopPropagation(); setEditing(guide) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive bg-transparent"
                        onClick={e => { e.stopPropagation(); deleteGuide(guide.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {'Updated '}{new Date(guide.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  GUIDE VIEWER                                                       */
/* ================================================================== */

function GuideViewer({ guide, onBack, onEdit }: { guide: Guide; onBack: () => void; onEdit?: () => void }) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1 bg-transparent">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {guide.coverImage && (
        <div className="rounded-xl overflow-hidden h-52 w-full bg-secondary">
          <img
            src={guide.coverImage || "/placeholder.svg"}
            alt={guide.title}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}

      <div>
        <span className="text-xs font-medium text-primary">{guide.category}</span>
        <h1 className="text-3xl font-bold text-foreground">{guide.title}</h1>
        {guide.description && (
          <p className="text-muted-foreground mt-1">{guide.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {guide.blocks.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </div>
    </div>
  )
}

function RenderBlock({ block }: { block: GuideBlock }) {
  if (block.type === 'heading') {
    const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
    const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' }
    return <Tag className={`${sizes[block.level]} font-bold text-foreground`}>{block.text}</Tag>
  }

  if (block.type === 'text') {
    return (
      <div
        className="prose prose-invert prose-sm max-w-none text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_a]:text-primary [&_blockquote]:border-l-primary [&_blockquote]:text-muted-foreground [&_code]:bg-secondary [&_code]:text-primary [&_ul]:list-disc [&_ol]:list-decimal"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    )
  }

  if (block.type === 'image') {
    return (
      <figure className="space-y-2">
        <div className="rounded-lg overflow-hidden bg-secondary">
          <img src={block.src || "/placeholder.svg"} alt={block.caption || ''} className="w-full" crossOrigin="anonymous" />
        </div>
        {block.caption && (
          <figcaption className="text-xs text-muted-foreground text-center">{block.caption}</figcaption>
        )}
      </figure>
    )
  }

  if (block.type === 'embed') {
    return (
      <div className="rounded-lg overflow-hidden border border-border aspect-video">
        <iframe src={block.url} className="w-full h-full" allowFullScreen title="Embedded content" />
      </div>
    )
  }

  if (block.type === 'divider') {
    return <hr className="border-border" />
  }

  return null
}

/* ================================================================== */
/*  GUIDE EDITOR                                                       */
/* ================================================================== */

function GuideEditor({ guide, onSave, onCancel }: { guide: Guide; onSave: (g: Guide) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(guide.title)
  const [description, setDescription] = useState(guide.description)
  const [coverImage, setCoverImage] = useState(guide.coverImage)
  const [category, setCategory] = useState(guide.category)
  const [blocks, setBlocks] = useState<GuideBlock[]>(guide.blocks)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSave = () => {
    onSave({
      ...guide,
      title,
      description,
      coverImage,
      category,
      blocks,
    })
  }

  const addBlock = (type: GuideBlock['type']) => {
    let newBlock: GuideBlock
    switch (type) {
      case 'heading':
        newBlock = { type: 'heading', level: 2, text: 'New Heading' }
        break
      case 'text':
        newBlock = { type: 'text', html: '<p>New text block</p>' }
        break
      case 'image':
        newBlock = { type: 'image', src: '', caption: '' }
        break
      case 'embed':
        newBlock = { type: 'embed', url: '' }
        break
      case 'divider':
        newBlock = { type: 'divider' }
        break
      default:
        return
    }
    setBlocks(prev => [...prev, newBlock])
  }

  const updateBlock = (idx: number, updated: GuideBlock) => {
    setBlocks(prev => prev.map((b, i) => (i === idx ? updated : b)))
  }

  const removeBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx))
  }

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= blocks.length) return
    const next = [...blocks]
    const tmp = next[idx]
    next[idx] = next[newIdx]
    next[newIdx] = tmp
    setBlocks(next)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-1 bg-transparent"
          >
            {previewMode ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Guide
          </Button>
        </div>
      </div>

      {previewMode ? (
        <GuideViewer
          guide={{ ...guide, title, description, coverImage, category, blocks }}
          onBack={() => setPreviewMode(false)}
          onEdit={() => setPreviewMode(false)}
        />
      ) : (
        <>
          {/* Meta fields */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Guide title" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..." rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        category === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content blocks */}
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <BlockEditor
                key={idx}
                block={block}
                index={idx}
                totalBlocks={blocks.length}
                onChange={b => updateBlock(idx, b)}
                onRemove={() => removeBlock(idx)}
                onMove={dir => moveBlock(idx, dir)}
              />
            ))}
          </div>

          {/* Add block buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Add block:</span>
            {([
              ['heading', Heading1, 'Heading'],
              ['text', Type, 'Text'],
              ['image', ImagePlus, 'Image'],
              ['embed', LinkIcon, 'Embed'],
              ['divider', Quote, 'Divider'],
            ] as const).map(([type, Icon, label]) => (
              <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type as GuideBlock['type'])} className="gap-1 bg-transparent">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ================================================================== */
/*  BLOCK EDITOR                                                       */
/* ================================================================== */

function BlockEditor({
  block,
  index,
  totalBlocks,
  onChange,
  onRemove,
  onMove,
}: {
  block: GuideBlock
  index: number
  totalBlocks: number
  onChange: (b: GuideBlock) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    // Sync back to state
    if (editorRef.current && block.type === 'text') {
      onChange({ ...block, html: editorRef.current.innerHTML })
    }
  }, [block, onChange])

  return (
    <Card className="border-border">
      <CardContent className="space-y-3 pt-4">
        {/* Block controls */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium capitalize">{block.type} block</span>
          <div className="flex gap-1">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={() => onMove(-1)} className="h-7 w-7 p-0 bg-transparent">
                <span className="sr-only">Move up</span>
                <span className="text-xs">{'<'}</span>
              </Button>
            )}
            {index < totalBlocks - 1 && (
              <Button variant="outline" size="sm" onClick={() => onMove(1)} className="h-7 w-7 p-0 bg-transparent">
                <span className="sr-only">Move down</span>
                <span className="text-xs">{'>'}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onRemove} className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Block content editor */}
        {block.type === 'heading' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => onChange({ ...block, level: lvl })}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    block.level === lvl
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-foreground border-border'
                  }`}
                >
                  H{lvl}
                </button>
              ))}
            </div>
            <Input
              value={block.text}
              onChange={e => onChange({ ...block, text: e.target.value })}
              placeholder="Heading text..."
            />
          </div>
        )}

        {block.type === 'text' && (
          <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 border-b border-border pb-2">
              {[
                { cmd: 'bold', Icon: Bold, label: 'Bold' },
                { cmd: 'italic', Icon: Italic, label: 'Italic' },
                { cmd: 'underline', Icon: UnderlineIcon, label: 'Underline' },
                { cmd: 'insertUnorderedList', Icon: List, label: 'Bullet list' },
                { cmd: 'insertOrderedList', Icon: ListOrdered, label: 'Number list' },
                { cmd: 'formatBlock:blockquote', Icon: Quote, label: 'Quote' },
              ].map(({ cmd, Icon, label }) => (
                <button
                  key={cmd}
                  onClick={() => {
                    if (cmd.startsWith('formatBlock:')) {
                      execCommand('formatBlock', cmd.split(':')[1])
                    } else {
                      execCommand(cmd)
                    }
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
              <button
                onClick={() => {
                  const url = prompt('Enter link URL:')
                  if (url) execCommand('createLink', url)
                }}
                className="h-7 w-7 flex items-center justify-center rounded border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                title="Insert Link"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ContentEditable */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[100px] rounded-lg border border-border bg-secondary/30 p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: block.html }}
              onBlur={() => {
                if (editorRef.current) {
                  onChange({ ...block, html: editorRef.current.innerHTML })
                }
              }}
            />
          </div>
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <Input
              value={block.src}
              onChange={e => onChange({ ...block, src: e.target.value })}
              placeholder="Image URL..."
            />
            <Input
              value={block.caption}
              onChange={e => onChange({ ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
            {block.src && (
              <div className="rounded-lg overflow-hidden bg-secondary max-h-48">
                <img src={block.src || "/placeholder.svg"} alt={block.caption} className="w-full object-contain max-h-48" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        )}

        {block.type === 'embed' && (
          <div className="space-y-2">
            <Input
              value={block.url}
              onChange={e => onChange({ ...block, url: e.target.value })}
              placeholder="Embed URL (YouTube, etc.)..."
            />
            {block.url && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe src={block.url} className="w-full h-full" allowFullScreen title="Embed preview" />
              </div>
            )}
          </div>
        )}

        {block.type === 'divider' && (
          <hr className="border-border" />
        )}
      </CardContent>
    </Card>
  )
}
