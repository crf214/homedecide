'use client'
// src/components/property/CompareView.tsx
import { useState, useRef } from 'react'
import type { Property, Criterion, Rating, Formula } from '@/types'
import { calcScore, normalizeValue, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'
import { getNeighbourhoodColor, neighbourhoodPillStyle } from '@/lib/neighbourhoodColor'

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
      <div className="mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {properties.map(p => {
          const s = getScore(p.id)
          const sel = selected.includes(p.id)
          return (
            <button key={p.id} onClick={() => toggle(p.id)}
              className="text-left rounded-xl px-3 py-2 transition-all"
              style={{
                border:     sel ? '2px solid var(--ink)' : '1px solid var(--border)',
                background: sel ? 'var(--surface)' : '#fff',
                opacity:    !sel && selected.length >= MAX_COMPARE ? 0.4 : 1,
                width: 140, height: 62,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                overflow: 'hidden',
              }}>
              <div className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{p.address}</div>
              <div className={`text-xs font-medium ${s.total !== null ? scoreBg(s.total, formula.normalise) : 'text-stone-400'} inline-block px-2 py-0.5 rounded-full`}
                style={{ alignSelf: 'flex-start' }}>
                {s.total ?? 'unrated'}
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
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', minHeight: 320, position: 'relative' }}>
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 500 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th className="text-left pr-4" style={{
                  color: 'var(--muted)', fontSize: 12, fontWeight: 500, minWidth: 160,
                  position: 'sticky', top: 0, left: 0, background: '#fff', zIndex: 11,
                  verticalAlign: 'bottom', paddingBottom: 12,
                  borderBottom: '2px solid var(--border)',
                }}>
                  Criterion
                </th>
                {selectedProps.map(p => {
                  const s = getScore(p.id)
                  const sym = CURRENCY_SYMBOLS[p.currency] ?? '£'
                  const pricePerArea = p.price && p.internalArea
                    ? { value: Math.round(p.price / p.internalArea), unit: p.internalAreaUnit === 'sqm' ? '/sqm' : '/sqft' }
                    : null
                  return (
                    <th key={p.id} className="px-3 text-center" style={{
                      minWidth: 150,
                      position: 'sticky', top: 0, background: '#fff',
                      borderBottom: '2px solid var(--border)',
                      paddingBottom: 12,
                    }}>
                      {/* Name — always present */}
                      <div style={{ minHeight: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--ink)', maxWidth: 130, display: 'block' }}>{p.address}</span>
                      </div>
                      {/* Property type — always present, empty slot if missing */}
                      <div style={{ minHeight: 16, marginTop: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {(p as any).propertyType && (
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{(p as any).propertyType}</span>
                        )}
                      </div>
                      {/* Neighbourhood — always present, empty slot if missing */}
                      <div style={{ minHeight: 22, marginTop: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {p.neighbourhood
                          ? <span style={{ ...neighbourhoodPillStyle, ...getNeighbourhoodColor(p.neighbourhood), fontSize: '11px', padding: '1px 8px' }}>
                              {[p.neighbourhood, p.neighbourhoodSub].filter(Boolean).join(' · ')}
                            </span>
                          : null}
                      </div>
                      {/* Price — always present, dash if missing */}
                      <div style={{ minHeight: 20, marginTop: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {p.price
                          ? <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{sym}{p.price.toLocaleString('en-GB')}</span>
                          : <span style={{ fontSize: 12, color: 'var(--border)' }}>—</span>}
                      </div>
                      {/* Price per area — always present, dash if missing */}
                      <div style={{ minHeight: 18, marginTop: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {pricePerArea
                          ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sym}{pricePerArea.value.toLocaleString('en-GB')}{pricePerArea.unit}</span>
                          : <span style={{ fontSize: 11, color: 'var(--border)' }}>—</span>}
                      </div>
                      {/* Score — always present */}
                      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                        <span className={`text-sm font-medium inline-block px-3 py-1 rounded-full ${s.total !== null ? scoreBg(s.total, formula.normalise) : 'bg-stone-100 text-stone-400'}`}>
                          {s.total ?? '—'} / {formula.normalise}
                        </span>
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
                        <td className="py-3 pr-4" style={{ borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
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
