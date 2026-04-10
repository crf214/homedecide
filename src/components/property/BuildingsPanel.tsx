'use client'
// src/components/property/BuildingsPanel.tsx
import { useState, useEffect } from 'react'

interface Building {
  id: string
  name: string | null
  yearBuilt: number | null
  condition: string | null
  totalUnits: number | null
  notes: string | null
}

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor']

const iCls = 'w-full px-3 py-2 rounded-xl text-sm'
const iSty = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }
const lSty: React.CSSProperties = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3, marginTop: 8 }

function BuildingForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Partial<Building>
  onSave: (data: Partial<Building>) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState(initial.name ?? '')
  const [yearBuilt, setYearBuilt] = useState(initial.yearBuilt?.toString() ?? '')
  const [condition, setCondition] = useState(initial.condition ?? '')
  const [totalUnits, setTotalUnits] = useState(initial.totalUnits?.toString() ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({
      name: name.trim() || null,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
      condition: condition || null,
      totalUnits: totalUnits ? parseInt(totalUnits) : null,
      notes: notes.trim() || null,
    })
  }

  return (
    <form onSubmit={submit} className="rounded-xl p-4 mt-3"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <div>
          <label style={lSty}>Building name / label</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className={iCls} style={iSty} placeholder="e.g. Main house, Barn, Cottage" />
        </div>
        <div>
          <label style={lSty}>Year built</label>
          <input type="number" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)}
            className={iCls} style={iSty} placeholder="e.g. 1920" min="1000" max="2100" />
        </div>
        <div>
          <label style={lSty}>Condition</label>
          <select value={condition} onChange={e => setCondition(e.target.value)} className={iCls} style={iSty}>
            <option value="">Select…</option>
            {CONDITIONS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lSty}>Number of units</label>
          <input type="number" value={totalUnits} onChange={e => setTotalUnits(e.target.value)}
            className={iCls} style={iSty} placeholder="Leave blank if single-use" min="1" />
        </div>
      </div>
      <div>
        <label style={lSty}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className={iCls} style={{ ...iSty, resize: 'vertical', fontFamily: 'var(--font-body)' }}
          placeholder="Additional details about this building…" />
      </div>
      <div className="flex gap-2 mt-3">
        <button type="submit" disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save building'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function BuildingsPanel({ propertyId }: { propertyId: string }) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch(`/api/properties/${propertyId}/buildings`)
    if (res.ok) {
      const j = await res.json()
      setBuildings(j.data)
    }
  }

  useEffect(() => { load() }, [propertyId])

  async function handleAdd(data: Partial<Building>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/properties/${propertyId}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error); return }
      setAdding(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string, data: Partial<Building>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/properties/${propertyId}/buildings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error); return }
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this building?')) return
    await fetch(`/api/properties/${propertyId}/buildings/${id}`, { method: 'DELETE' })
    setBuildings(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="mt-6 rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Buildings
        </div>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null) }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--ink)', color: '#fff' }}>
            + Add building
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg mt-2"
          style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      {buildings.length === 0 && !adding && (
        <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
          No buildings added yet. Add each structure that forms part of this property.
        </p>
      )}

      <div className="flex flex-col gap-3 mt-3">
        {buildings.map((b, i) => (
          <div key={b.id}>
            {editingId === b.id ? (
              <BuildingForm
                initial={b}
                onSave={data => handleUpdate(b.id, data)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {b.name || `Building ${i + 1}`}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {b.yearBuilt != null && (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>Built {b.yearBuilt}</span>
                    )}
                    {b.condition && (
                      <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{b.condition} condition</span>
                    )}
                    {b.totalUnits != null && (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{b.totalUnits} unit{b.totalUnits !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {b.notes && (
                    <div className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted)' }}>{b.notes}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={() => { setEditingId(b.id); setAdding(false) }}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: '#fff' }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(b.id)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <BuildingForm
          initial={{}}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
