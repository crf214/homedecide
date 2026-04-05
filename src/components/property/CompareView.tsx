'use client'
// src/components/property/CompareView.tsx
import { useState } from 'react'
import type { Property, Criterion, Rating, Formula } from '@/types'
import { calcScore, normalizeValue, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'

interface Props {
  properties: Property[]
  criteria:   Criterion[]
  allRatings: Rating[]
  formula:    Formula
}

export default function CompareView({ properties, criteria, allRatings, formula }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const selectedProps = properties.filter(p => selected.includes(p.id))
  const cats          = [...new Set(criteria.map(c => c.category))]

  function ratingsFor(propId: string): Rating[] {
    return allRatings.filter(r => r.propertyId === propId)
  }

  function score(propId: string) {
    const ratings = ratingsFor(propId)
    return calcScore(criteria, ratings, formula, ratings[0]?.userId ?? '')
  }

  const scores = Object.fromEntries(selectedProps.map(p => [p.id, score(p.id)]))

  // Which prop wins each criterion?
  function winner(criterionId: string): string | null {
    if (selectedProps.length < 2) return null
    let best: { id: string; val: number } | null = null
    for (const p of selectedProps) {
      const r = ratingsFor(p.id).find(r => r.criterionId === criterionId)
      if (r?.value != null && (!best || r.value > best.val)) {
        best = { id: p.id, val: r.value }
      }
    }
    return best?.id ?? null
  }

  return (
    <div>
      {/* Property selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {properties.map(p => {
          const s = score(p.id)
          const sel = selected.includes(p.id)
          return (
            <button key={p.id} onClick={() => toggle(p.id)}
              className="text-left rounded-2xl overflow-hidden transition-all"
              style={{
                border: sel ? '2px solid var(--ink)' : '1px solid var(--border)',
                background: sel ? 'var(--surface)' : '#fff',
                opacity: !sel && selected.length >= 3 ? 0.5 : 1,
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
            Select {2 - selectedProps.length} more {selectedProps.length === 1 ? 'property' : 'properties'} to compare
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 500 }}>
            <thead>
              <tr>
                <th className="text-left pb-4 pr-4" style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500, minWidth: 160 }}>
                  Criterion
                </th>
                {selectedProps.map(p => (
                  <th key={p.id} className="pb-4 px-3 text-center" style={{ minWidth: 140 }}>
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--ink)', maxWidth: 130 }}>{p.address}</div>
                    <div className={`text-sm font-medium mt-1 inline-block px-3 py-1 rounded-full ${scores[p.id].total !== null ? scoreBg(scores[p.id].total!, formula.normalise) : 'bg-stone-100 text-stone-400'}`}>
                      {scores[p.id].total ?? '—'} / {formula.normalise}
                    </div>
                  </th>
                ))}
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
                          const r  = ratingsFor(p.id).find(r => r.criterionId === c.id)
                          const v  = r?.value ?? null
                          const ns = v !== null ? Math.round(normalizeValue(v, c.ratingType)) : null
                          const isWinner = w === p.id && selectedProps.length > 1
                          return (
                            <td key={p.id} className="py-3 px-3 text-center"
                              style={{ borderBottom: '1px solid var(--border)' }}>
                              {v !== null ? (
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
                  const s = scores[p.id].total
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
