'use client'
// src/components/criteria/CriteriaManager.tsx
import { useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Criterion } from '@/types'

const STANDARD_CATS = ['Layout & space', 'Condition & fabric', 'Location', 'Lifestyle fit', 'Financials']

interface Props { initialCriteria: Criterion[] }

export default function CriteriaManager({ initialCriteria }: Props) {
  const [criteria,   setCriteria]   = useState<Criterion[]>(initialCriteria)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [adding,     setAdding]     = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const categories = [...new Set(criteria.map(c => c.category))]
  const editingCriterion = criteria.find(c => c.id === editingId) ?? null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = criteria.findIndex(c => c.id === active.id)
    const newIdx = criteria.findIndex(c => c.id === over.id)
    const reordered = arrayMove(criteria, oldIdx, newIdx).map((c, i) => ({ ...c, position: i }))
    setCriteria(reordered)

    await fetch('/api/criteria/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map(c => ({ id: c.id, position: c.position })) }),
    })
  }

  async function saveCriterion(data: Partial<Criterion> & { name: string; category: string }) {
    setSaving(true); setError('')
    try {
      if (editingId) {
        const res = await fetch(`/api/criteria/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
        const { data: updated } = await res.json()
        setCriteria(prev => prev.map(c => c.id === editingId ? updated : c))
        setEditingId(null)
      } else {
        const res = await fetch('/api/criteria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, position: criteria.length }),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
        const { data: created } = await res.json()
        setCriteria(prev => [...prev, created])
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteCriterion(id: string) {
    if (!confirm('Delete this criterion? Existing ratings for it will also be removed.')) return
    await fetch(`/api/criteria/${id}`, { method: 'DELETE' })
    setCriteria(prev => prev.filter(c => c.id !== id))
    setEditingId(null)
  }

  function handleEdit(id: string) {
    setEditingId(prev => prev === id ? null : id)
    setAdding(false)
    setError('')
  }

  function handleCancel() {
    setEditingId(null)
    setAdding(false)
    setError('')
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={criteria.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {categories.map(cat => (
            <div key={cat} className="mb-6">
              <div className="text-xs font-medium uppercase tracking-wider mb-2 pb-2"
                style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {cat}
              </div>
              <div className="space-y-2">
                {criteria.filter(c => c.category === cat).map(c => (
                  <SortableRow
                    key={c.id}
                    criterion={c}
                    isEditing={editingId === c.id}
                    onEdit={() => handleEdit(c.id)}
                    formProps={{
                      initial: editingCriterion ?? undefined,
                      saving,
                      error,
                      onSave: saveCriterion,
                      onDelete: () => deleteCriterion(c.id),
                      onCancel: handleCancel,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </SortableContext>
      </DndContext>

      {/* Add button */}
      {!adding && (
        <button onClick={() => { setAdding(true); setEditingId(null); setError('') }}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ border: '1.5px dashed var(--border)', color: 'var(--muted)', background: 'transparent', width: '100%' }}>
          + Add criterion
        </button>
      )}

      {/* Add form at the bottom */}
      {adding && (
        <div className="mt-4">
          <CriterionForm
            saving={saving}
            error={error}
            onSave={saveCriterion}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  )
}

// ── Sortable row ──────────────────────────────────────────────────────────────
interface SortableRowProps {
  criterion: Criterion
  isEditing: boolean
  onEdit: () => void
  formProps: FormProps
}

function SortableRow({ criterion: c, isEditing, onEdit, formProps }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Criterion row */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
        style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 12 }}>
        {/* Drag handle */}
        <button {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing text-lg flex-shrink-0"
          style={{ color: 'var(--border)', touchAction: 'none' }} aria-label="Drag to reorder">
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              {c.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: c.ratingType === 'star' ? 'var(--amber-soft)' : 'var(--blue-soft)',
                       color: c.ratingType === 'star' ? 'var(--amber-text)' : 'var(--blue-text)' }}>
              {c.ratingType === 'star' ? '★ Stars' : '# 1–10'}
            </span>
            {!c.required && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>optional</span>
            )}
          </div>
          {c.description && (
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{c.description}</div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs px-2 py-1 rounded-lg font-mono"
            style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
            ×{c.weight}
          </span>
          <button onClick={onEdit} className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-stone-100"
            style={{ color: isEditing ? 'var(--ink)' : 'var(--muted)', fontWeight: isEditing ? 500 : 400 }}>
            {isEditing ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Inline accordion form */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isEditing ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.25s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="pt-2">
            <CriterionForm key={formProps.initial?.id ?? 'new'} {...formProps} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Criterion form ────────────────────────────────────────────────────────────
interface FormProps {
  initial?:  Criterion
  saving:    boolean
  error:     string
  onSave:    (data: any) => void
  onDelete?: () => void
  onCancel:  () => void
}

function CriterionForm({ initial, saving, error, onSave, onDelete, onCancel }: FormProps) {
  const [name,        setName]        = useState(initial?.name        ?? '')
  const [category,    setCategory]    = useState(initial?.category    ?? STANDARD_CATS[0])
  const [customCat,   setCustomCat]   = useState(!STANDARD_CATS.includes(initial?.category ?? '') ? initial?.category ?? '' : '')
  const [isCustomCat, setIsCustomCat] = useState(!STANDARD_CATS.includes(initial?.category ?? ''))
  const [ratingType,  setRatingType]  = useState<'num'|'star'>(initial?.ratingType ?? 'num')
  const [weight,      setWeight]      = useState(initial?.weight?.toString()  ?? '1')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [required,    setRequired]    = useState(initial?.required !== false)

  function handleCatChange(v: string) {
    if (v === '__custom__') { setIsCustomCat(true); setCategory(customCat || '') }
    else { setIsCustomCat(false); setCategory(v) }
  }

  function submit() {
    if (!name.trim()) return
    const finalCat = isCustomCat ? customCat.trim() || 'Custom' : category
    onSave({ name: name.trim(), category: finalCat, ratingType, weight: parseFloat(weight) || 1, description: description.trim() || null, required })
  }

  const inputStyle = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }

  return (
    <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <h3 className="text-sm font-medium mb-5" style={{ color: 'var(--ink)' }}>
        {initial ? 'Edit criterion' : 'Add criterion'}
      </h3>

      {error && (
        <div className="mb-4 text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}
            placeholder="e.g. Natural light" />
        </div>
        <div>
          <label className="text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>Category</label>
          <select value={isCustomCat ? '__custom__' : category}
            onChange={e => handleCatChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}>
            {STANDARD_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">Custom…</option>
          </select>
          {isCustomCat && (
            <input value={customCat} onChange={e => setCustomCat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm mt-2" style={inputStyle}
              placeholder="Custom category name" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>Rating type</label>
            <select value={ratingType} onChange={e => setRatingType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}>
              <option value="num">1–10 score</option>
              <option value="star">1–5 stars</option>
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>Weight</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              min="0.1" max="10" step="0.5"
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs block mb-1.5" style={{ color: 'var(--muted)' }}>Guidance note (shown when rating)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
          style={{ ...inputStyle, fontFamily: 'var(--font-body)' }}
          placeholder="What to look for when rating this criterion…" />
      </div>

      <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer" style={{ color: 'var(--muted)' }}>
        <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
        Required for overall score
      </label>

      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={saving || !name.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving || !name.trim() ? 0.5 : 1 }}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add criterion'}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Cancel
        </button>
        {onDelete && (
          <button onClick={onDelete}
            className="ml-auto px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
