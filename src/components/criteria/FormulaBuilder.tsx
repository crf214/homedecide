'use client'
// src/components/criteria/FormulaBuilder.tsx
import { useState } from 'react'
import type { Criterion, Formula } from '@/types'

interface Props {
  initialCriteria: Criterion[]
  initialFormula:  Formula
}

export default function FormulaBuilder({ initialCriteria, initialFormula }: Props) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [mode,     setMode]     = useState(initialFormula.mode)
  const [normalise,setNormalise]= useState(initialFormula.normalise)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  function updateWeight(id: string, w: number) {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight: w } : c))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    // Save formula settings
    await fetch('/api/formula', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, normalise }),
    })
    // Save all weights
    await Promise.all(criteria.map(c =>
      fetch(`/api/criteria/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: c.weight }),
      })
    ))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0)
  const cats = [...new Set(criteria.map(c => c.category))]

  const inputStyle = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }

  return (
    <div className="space-y-6">

      {/* Mode selector */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>Formula mode</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'weighted',  label: 'Weighted average',     desc: 'All criteria contribute, weighted by importance' },
            { value: 'category',  label: 'Category scores',      desc: 'Average within each category first, then combine' },
          ].map(m => (
            <button key={m.value} onClick={() => { setMode(m.value as any); setSaved(false) }}
              className="text-left p-4 rounded-xl transition-all"
              style={{
                border: `1.5px solid ${mode === m.value ? 'var(--ink)' : 'var(--border)'}`,
                background: mode === m.value ? 'var(--surface)' : '#fff',
              }}>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>{m.label}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Normalisation */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>Score scale</h3>
        <div className="flex gap-3">
          {[
            { value: 100, label: '0 – 100' },
            { value: 10,  label: '0 – 10'  },
            { value: 5,   label: '0 – 5'   },
          ].map(n => (
            <button key={n.value} onClick={() => { setNormalise(n.value); setSaved(false) }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: `1.5px solid ${normalise === n.value ? 'var(--ink)' : 'var(--border)'}`,
                background: normalise === n.value ? 'var(--ink)' : '#fff',
                color: normalise === n.value ? '#fff' : 'var(--muted)',
              }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weights */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Criterion weights</h3>
          <span className="text-xs font-mono px-2 py-1 rounded-lg"
            style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
            Total weight: {totalWeight.toFixed(1)}
          </span>
        </div>

        <div className="space-y-5">
          {cats.map(cat => (
            <div key={cat}>
              <div className="text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                {cat}
              </div>
              <div className="space-y-3">
                {criteria.filter(c => c.category === cat).map(c => {
                  const pct = totalWeight > 0 ? (c.weight / totalWeight * 100).toFixed(0) : 0
                  return (
                    <div key={c.id} className="flex items-center gap-4">
                      <div style={{ minWidth: 180, flex: '0 0 180px' }}>
                        <div className="text-sm" style={{ color: 'var(--ink)' }}>{c.name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>
                          {pct}% of total score
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <input type="range" min="0" max="10" step="0.5"
                          value={c.weight}
                          onChange={e => updateWeight(c.id, parseFloat(e.target.value))}
                          className="flex-1" />
                        <input type="number" min="0" max="10" step="0.5"
                          value={c.weight}
                          onChange={e => updateWeight(c.id, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center"
                          style={inputStyle} />
                      </div>
                      {/* Visual weight bar */}
                      <div className="w-24 h-2 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: 'var(--ink)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula preview */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Formula preview</h3>
        <div className="text-xs font-mono leading-relaxed" style={{ color: 'var(--muted)' }}>
          score = (
          {criteria.slice(0, 4).map((c, i) => (
            <span key={c.id}>
              <span style={{ color: 'var(--blue-text)' }}>{c.name.split(' ')[0]}</span>
              <span>×{c.weight}</span>
              {i < 3 ? ' + ' : ' + …'}
            </span>
          ))}
          ) ÷ {totalWeight.toFixed(1)} × {normalise}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-opacity"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save formula'}
        </button>
        {saved && <span className="text-sm" style={{ color: 'var(--green-text)' }}>Saved ✓</span>}
      </div>
    </div>
  )
}
