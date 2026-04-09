// src/app/dashboard/rankings/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { calcScore, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'
import { getNeighbourhoodColor, neighbourhoodPillStyle } from '@/lib/neighbourhoodColor'
import Link from 'next/link'

export default async function RankingsPage() {
  const session = await getSession()
  const userId  = session.userId!

  const [ownedProps, sharedProps, criteria, formula] = await Promise.all([
    prisma.property.findMany({ where: { userId } }),
    prisma.propertyShare.findMany({
      where: { sharedWithId: userId },
      include: { property: true },
    }),
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
  ])

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }
  const allProps = [
    ...ownedProps,
    ...sharedProps.map(s => s.property),
  ]

  const scored = await Promise.all(allProps.map(async p => {
    const ratings = await prisma.rating.findMany({ where: { userId, propertyId: p.id } })
    const breakdown = calcScore(criteria as any, ratings as any, f as any, userId)
    return { ...p, score: breakdown.total, ratedCount: breakdown.ratedCount, requiredCount: breakdown.requiredCount, byCategory: breakdown.byCategory }
  }))

  const sorted = scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const cats   = [...new Set(criteria.map(c => c.category))]

  return (
    <div className="p-8 max-w-5xl fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          All properties sorted by your formula score
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed var(--border)' }}>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>No properties to rank yet</p>
          <Link href="/dashboard/properties/new"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--ink)', color: '#fff' }}>
            Add a property
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((p, rank) => {
            const sym = CURRENCY_SYMBOLS[p.currency] ?? '£'
            return (
              <Link key={p.id} href={`/dashboard/properties/${p.id}`}
                className="flex items-start gap-5 rounded-2xl p-5 transition-all hover:shadow-sm"
                style={{ border: '1px solid var(--border)', background: '#fff' }}>

                {/* Rank number */}
                <div className="text-3xl font-display flex-shrink-0 w-10 text-center pt-1"
                  style={{ color: rank === 0 ? 'var(--amber-text)' : 'var(--border)' }}>
                  {rank + 1}
                </div>

                {/* Photo */}
                <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--surface)' }}>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>—</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>{p.address}</div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {p.neighbourhood && (
                      <span style={{ ...neighbourhoodPillStyle, ...getNeighbourhoodColor(p.neighbourhood) }}>
                        {[p.neighbourhood, p.neighbourhoodSub].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
                      {[p.tenure, p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : null]
                        .filter(Boolean).join(' · ')}
                    </span>
                  </div>

                  {/* Category breakdown */}
                  <div className="flex flex-wrap gap-2">
                    {cats.map(cat => {
                      const cs = p.byCategory[cat]
                      return cs != null ? (
                        <span key={cat} className={`text-xs px-2 py-1 rounded-full ${scoreBg(cs, f.normalise)}`}>
                          {cat.split(' ')[0]}: {cs}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium
                    ${p.score !== null ? scoreBg(p.score, f.normalise) : 'bg-stone-100 text-stone-400'}`}>
                    {p.score ?? '—'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>
                    {p.ratedCount}/{p.requiredCount} rated
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Compare link */}
      {sorted.length >= 2 && (
        <div className="mt-8 text-center">
          <Link href="/dashboard/evaluate"
            className="inline-block px-6 py-3 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
            ↗ Compare properties side by side
          </Link>
        </div>
      )}
    </div>
  )
}
