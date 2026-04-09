'use client'
// src/components/property/CompareView.tsx
import { useState, useRef } from 'react'
import type { Property, Criterion, Rating, Formula } from '@/types'
import { calcScore, normalizeValue, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'

const MAX_COMPARE = 5

interface Props {
  properties: Property[]
  criteria:   Criterion[]
  allRatings: Rating[]
  formula:    Formula
}

export default function CompareView({ properties, criteria, allRatings, formula }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [ratingsMap, setRatingsMap] = useState<Record<string, Rating>>(() => {
    const map: Record<string, Rating> = {}
    for (const r of allRatings) {
      map[`${r.propertyId}:${r.criterionId}`] = r
    }
    return map
  })
  const [editing, setEditing] = useState<{ propId: string; critId: string; value: string } | null>(null)
  const [flashing, setFlashing] = useState<Set<string>>(new Set())
  const committedRef = useRef(false)

  const userId = allRatings[0]?.userId ?? ''

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_COMPARE ? [...prev, id] : prev
    )
  }

  const selectedProps = properties.filter(p => selected.includes(p.id))
  const cats = [...new Set(criteria.map(c => c.category))]

  function ratingsFor(propId: string): Rating[] {
    return criteria
      .map(c => ratingsMap[`${propId}:${c.id}`])
      .filter(Boolean) as Rating[]
  }

  function getScore(propId: string) {
    return calcScore(criteria, ratingsFor(propId), formula, userId)
  }

  function winner(criterionId: string): string | null {
    if (selectedProps.length < 2) return null
    let best: { id: string; val: number } | null = null
    for (const p of selectedProps) {
      const r = ratingsMap[`${p.id}:${criterionId}`]
      if (r?.value != null && (!best || r.value > best.val)) {
        best = { id: p.id, val: r.value }
      }
    }
    return best?.id ?? null
  }

  function startEdit(propId: string, crit: Criterion) {
    committedRef.current = false
    const existing = ratingsMap[`${propId}:${crit.id}`]
    setEditing({ propId, critId: crit.id, value: existing?.value != null ? String(existing.value) : '' })
  }

  async function commitEdit(propId: string, crit: Criterion, rawValue: string) {
    if (committedRef.current) return
    committedRef.current = true
    setEditing(null)

    const num = rawValue === '' ? null : Number(rawValue)
    const key = `${propId}:${crit.id}`
    const existing = ratingsMap[key]

    // Optimistic update
    setRatingsMap(prev => {
      if (num === null) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return {
        ...prev,
        [key]: {
          id:          existing?.id ?? key,
          userId,
          propertyId:  propId,
          criterionId: crit.id,
          value:       num,
          note:        existing?.note ?? null,
        } as Rating,
      }
    })

    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propId,
          ratings: [{ criterionId: crit.id, value: num, note: existing?.note ?? null }],
        }),
      })

      if (num !== null) {
        setFlashing(prev => new Set(prev).add(key))
        setTimeout(() => {
          setFlashing(prev => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        }, 800)
      }
    } catch (e) {
      console.error('Failed to save rating', e)
    }
  }

  return (
    <div>
      {/* Property selector */}
      <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {properties.map(p => {
          const s = getScore(p.id)
          const sel = selected.includes(p.id)
          return (
            <button key={p.id} onClick={() => toggle(p.id)}
              className="text-left rounded-2xl overflow-hidden transition-all"
              style={{
                border:   sel ? '2px solid var(--ink)' : '1px solid var(--border)',
                background: sel ? 'var(--surface)' : '#fff',
                opacity: !sel && selected.length >= MAX_COMPARE ? 0.5 : 1,
              }}>
              <div className="h-20" style={{ background: 'var(--surface)' }}>
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>No photo</div>
                }
              </div>
              <div className="p-3">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{p.address}</div>
                <div className={`text-xs mt-1 font-medium ${s.total !== null ? scoreBg(s.total, formula.normalise) : 'text-stone-400'} inline-block px-2 py-0.5 rounded-full`}>
                  {s.total ?? 'unrated'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedProps.length < 2 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: '1.5px dashed var(--border)' }}>
          <p style={{ color: 'var(--muted)' }}>
            {selectedProps.length === 1
              ? 'Select one more property to compare'
              : 'Select up to 5 properties to compare side by side'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 500 }}>
            <thead>
              <tr>
                <th className="text-left pb-4 pr-4" style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500, minWidth: 160 }}>
                  Criterion
                </th>
                {selectedProps.map(p => {
                  const s = getScore(p.id)
                  const sym = CURRENCY_SYMBOLS[p.currency] ?? '£'
                  const pricePerArea = p.price && p.internalArea
                    ? { value: Math.round(p.price / p.internalArea), unit: p.internalAreaUnit === 'sqm' ? '/sqm' : '/sqft' }
                    : null
                  return (
                    <th key={p.id} className="pb-4 px-3 text-center" style={{ minWidth: 140 }}>
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--ink)', maxWidth: 130 }}>{p.address}</div>
                      {p.price && (
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginTop: 2 }}>
                          {sym}{p.price.toLocaleString('en-GB')}
                        </div>
                      )}
                      {pricePerArea && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {sym}{pricePerArea.value.toLocaleString('en-GB')}{pricePerArea.unit}
                        </div>
                      )}
                      <div className={`text-sm font-medium inline-block px-3 py-1 rounded-full ${s.total !== null ? scoreBg(s.total, formula.normalise) : 'bg-stone-100 text-stone-400'}`} style={{ marginTop: 2 }}>
                        {s.total ?? '—'} / {formula.normalise}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <>
                  <tr key={`cat-${cat}`}>
                    <td colSpan={selectedProps.length + 1}
                      className="py-2 text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingTop: 16 }}>
                      {cat}
                    </td>
                  </tr>
                  {criteria.filter(c => c.category === cat).map(c => {
                    const w = winner(c.id)
                    return (
                      <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 pr-4" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="text-sm" style={{ color: 'var(--ink)' }}>{c.name}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>×{c.weight} weight</div>
                        </td>
                        {selectedProps.map(p => {
                          const key = `${p.id}:${c.id}`
                          const r = ratingsMap[key]
                          const v = r?.value ?? null
                          const isWinner = w === p.id && selectedProps.length > 1
                          const isEditing = editing?.propId === p.id && editing?.critId === c.id
                          const isFlashing = flashing.has(key)

                          return (
                            <td key={p.id} className="py-3 px-3 text-center"
                              style={{
                                borderBottom: '1px solid var(--border)',
                                background: isFlashing ? 'var(--color-background-success, #d1fae5)' : undefined,
                                transition: 'background 0.3s',
                                cursor: isEditing ? 'default' : 'pointer',
                              }}
                              onClick={() => !isEditing && startEdit(p.id, c)}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  autoFocus
                                  min={1}
                                  max={c.ratingType === 'star' ? 5 : 10}
                                  step={1}
                                  value={editing.value}
                                  onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                  onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                  onBlur={() => commitEdit(p.id, c, editing.value)}
                                  style={{
                                    width:        c.ratingType === 'star' ? 48 : 56,
                                    border:       '1px solid var(--border)',
                                    borderRadius: 8,
                                    padding:      '4px',
                                    fontSize:     13,
                                    color:        'var(--ink)',
                                    background:   '#fff',
                                    textAlign:    'center',
                                    outline:      'none',
                                  }}
                                />
                              ) : v !== null ? (
                                <div>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isWinner ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-50 text-stone-600'}`}>
                                    {c.ratingType === 'star' ? '★'.repeat(v) + '☆'.repeat(5 - v) : v}
                                    {isWinner && <span className="ml-1 text-xs">✓</span>}
                                  </span>
                                  {r?.note && (
                                    <div className="text-xs mt-1 text-left" style={{ color: 'var(--muted)', maxWidth: 130 }}>
                                      {r.note}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm" style={{ color: 'var(--border)' }}>—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </>
              ))}

              {/* Summary row */}
              <tr>
                <td className="pt-5 pb-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>Overall score</td>
                {selectedProps.map(p => {
                  const s = getScore(p.id).total
                  return (
                    <td key={p.id} className="pt-5 pb-2 px-3 text-center">
                      <span className={`text-lg font-medium inline-block px-4 py-1.5 rounded-full ${s !== null ? scoreBg(s, formula.normalise) : 'bg-stone-100 text-stone-400'}`}>
                        {s ?? '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
