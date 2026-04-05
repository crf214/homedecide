'use client'
// src/components/property/EvaluatePanel.tsx
import { useState, useCallback } from 'react'
import type { Criterion, Rating, Formula } from '@/types'
import { normalizeValue, scoreBg } from '@/lib/scoring'

interface Props {
  propertyId:     string
  criteria:       Criterion[]
  initialRatings: Rating[]
  formula:        Formula
  userId:         string
}

type RatingMap = Record<string, { value: number | null; note: string }>

export default function EvaluatePanel({ propertyId, criteria, initialRatings, formula }: Props) {
  const [ratings, setRatings] = useState<RatingMap>(() => {
    const map: RatingMap = {}
    for (const c of criteria) {
      const r = initialRatings.find(r => r.criterionId === c.id)
      map[c.id] = { value: r?.value ?? null, note: r?.note ?? '' }
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const categories = [...new Set(criteria.map(c => c.category))]

  function setVal(criterionId: string, value: number | null) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], value } }))
    setSaved(false)
  }

  function setNote(criterionId: string, note: string) {
    setRatings(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], note } }))
    setSaved(false)
  }

  async function saveRatings() {
    setSaving(true); setError('')
    try {
      const payload = criteria.map(c => ({
        criterionId: c.id,
        value: ratings[c.id]?.value ?? null,
        note:  ratings[c.id]?.note  || null,
      }))
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, ratings: payload }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Save failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  // Compute live overall score
  const liveScore = useCallback(() => {
    let weightedSum = 0, totalWeight = 0, ratedRequired = 0
    const requiredCount = criteria.filter(c => c.required).length
    for (const c of criteria) {
      const v = ratings[c.id]?.value
      if (v != null) {
        const n = normalizeValue(v, c.ratingType)
        weightedSum += n * c.weight
        totalWeight += c.weight
        if (c.required) ratedRequired++
      }
    }
    if (ratedRequired < Math.min(3, requiredCount) || totalWeight === 0) return null
    return Math.round((weightedSum / totalWeight / 100) * formula.normalise)
  }, [ratings, criteria, formula])

  const score = liveScore()

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Evaluation</h2>
        <div className="flex items-center gap-4">
          {score !== null && (
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${scoreBg(score, formula.normalise)}`}>
              Live score: {score}/{formula.normalise}
            </span>
          )}
          <button onClick={saveRatings} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save ratings'}
          </button>
          {saved  && <span className="text-sm" style={{ color: 'var(--green-text)' }}>Saved ✓</span>}
          {error  && <span className="text-sm" style={{ color: 'var(--red-text)' }}>{error}</span>}
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-6">
        {categories.map(cat => {
          const crits = criteria.filter(c => c.category === cat)
          return (
            <div key={cat}>
              <div className="text-xs font-medium uppercase tracking-wider mb-3 pb-2"
                style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {cat}
              </div>
              <div className="space-y-3">
                {crits.map(c => (
                  <CriterionRow
                    key={c.id}
                    criterion={c}
                    value={ratings[c.id]?.value ?? null}
                    note={ratings[c.id]?.note ?? ''}
                    normalise={formula.normalise}
                    onValue={v => setVal(c.id, v)}
                    onNote={n => setNote(c.id, n)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Save bar */}
      <div className="mt-6 flex items-center gap-4">
        <button onClick={saveRatings} disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-opacity"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save all ratings'}
        </button>
        {saved && <span className="text-sm" style={{ color: 'var(--green-text)' }}>All ratings saved ✓</span>}
        {error && <span className="text-sm" style={{ color: 'var(--red-text)' }}>{error}</span>}
      </div>
    </div>
  )
}

// ── Individual criterion row ──────────────────────────────────────────────────
interface RowProps {
  criterion: Criterion
  value:     number | null
  note:      string
  normalise: number
  onValue:   (v: number | null) => void
  onNote:    (n: string) => void
}

function CriterionRow({ criterion: c, value, note, normalise, onValue, onNote }: RowProps) {
  const normalised = value !== null ? Math.round(normalizeValue(value, c.ratingType)) : null
  const scoreClass = normalised !== null
    ? normalised >= 70 ? 'score-high' : normalised >= 45 ? 'score-mid' : 'score-low'
    : ''

  return (
    <div className="rounded-xl p-4 transition-colors"
      style={{ border: '1px solid var(--border)', background: value !== null ? '#fff' : 'var(--surface)' }}>
      <div className="flex items-start gap-4 flex-wrap">
        {/* Name + description */}
        <div style={{ minWidth: 180, flex: '0 0 180px' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {c.name}
            {!c.required && (
              <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--muted)' }}>optional</span>
            )}
          </div>
          {c.description && (
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {c.description}
            </div>
          )}
        </div>

        {/* Rating input */}
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          {c.ratingType === 'star' ? (
            <StarInput value={value} onChange={onValue} />
          ) : (
            <NumInput value={value} onChange={onValue} />
          )}

          {/* Note */}
          <textarea
            value={note}
            onChange={e => onNote(e.target.value)}
            placeholder="Notes…"
            rows={1}
            className="flex-1 text-sm rounded-lg px-3 py-2 resize-none"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              minWidth: 120,
            }}
          />

          {/* Normalised score pill */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium min-w-[44px] text-center ${scoreClass || 'bg-stone-100 text-stone-400'}`}>
            {normalised !== null ? normalised : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function NumInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
          style={{
            background: value === n ? 'var(--ink)' : 'var(--surface)',
            color:      value === n ? '#fff' : 'var(--muted)',
            border: `1px solid ${value === n ? 'var(--ink)' : 'var(--border)'}`,
            transform:  value === n ? 'scale(1.1)' : 'scale(1)',
          }}>
          {n}
        </button>
      ))}
    </div>
  )
}

function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value ?? 0
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className="star-btn"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(value === n ? null : n)}
          style={{ color: n <= display ? '#F59E0B' : 'var(--border)', fontSize: 24 }}>
          {n <= display ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
