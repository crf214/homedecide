// src/app/dashboard/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { calcScore, scoreBg } from '@/lib/scoring'
import { getNeighbourhoodColor, neighbourhoodPillStyle } from '@/lib/neighbourhoodColor'

export default async function DashboardPage() {
  const session = await getSession()
  const userId = session.userId!

  const [properties, criteria, formula] = await Promise.all([
    prisma.property.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
  ])

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }

  const scored = await Promise.all(properties.map(async p => {
    const ratings = await prisma.rating.findMany({ where: { userId, propertyId: p.id } })
    const breakdown = calcScore(criteria as any, ratings as any, f as any, userId)
    return { ...p, score: breakdown.total, ratedCount: breakdown.ratedCount }
  }))

  const totalProps = await prisma.property.count({ where: { userId } })
  const ratedProps = scored.filter(p => p.score !== null).length
  const topProp = scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0]

  return (
    <div className="p-8 max-w-4xl fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--ink)' }}>
          Good to see you{session.name ? `, ${session.name}` : ''}.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Your property search at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Properties saved', value: totalProps },
          { label: 'Fully rated', value: ratedProps },
          { label: 'Criteria defined', value: criteria.length },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-3xl font-medium mb-1" style={{ color: 'var(--ink)' }}>{s.value}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent properties */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Recent properties</h2>
        <Link href="/dashboard/properties" className="text-sm underline" style={{ color: 'var(--muted)' }}>View all</Link>
      </div>

      {scored.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: '1.5px dashed var(--border)' }}>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>No properties yet</p>
          <Link href="/dashboard/properties/new"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--ink)', color: '#fff' }}>
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scored.map(p => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`}
              className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-stone-300"
              style={{ border: '1px solid var(--border)', background: '#fff' }}>
              <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--surface)' }}>
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>No photo</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: 'var(--ink)' }}>{p.address}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {p.neighbourhood && (
                    <span style={{ ...neighbourhoodPillStyle, ...getNeighbourhoodColor(p.neighbourhood) }}>
                      {[p.neighbourhood, p.neighbourhoodSub].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {[p.tenure, p.price ? `£${p.price.toLocaleString('en-GB')}` : null].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${p.score !== null ? scoreBg(p.score, f.normalise) : 'bg-stone-100 text-stone-400'}`}>
                {p.score !== null ? p.score : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        {[
          { href: '/dashboard/criteria', label: 'Manage criteria', desc: 'Add, edit, reorder your rating criteria' },
          { href: '/dashboard/rankings', label: 'View rankings', desc: 'See all properties sorted by score' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="rounded-2xl p-5 hover:border-stone-300 transition-colors"
            style={{ border: '1px solid var(--border)', background: '#fff' }}>
            <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>{l.label}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
