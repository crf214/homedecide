// src/app/dashboard/properties/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { calcScore, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'

export default async function PropertiesPage() {
  const session = await getSession()
  const userId = session.userId!

  const [owned, shared, criteria, formula] = await Promise.all([
    prisma.property.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.propertyShare.findMany({
      where: { sharedWithId: userId },
      include: { property: true, sharedBy: { select: { name: true, email: true } } },
    }),
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
  ])

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }

  const allProps = [
    ...owned.map(p => ({ ...p, isShared: false, sharedBy: null })),
    ...shared.map(s => ({ ...s.property, isShared: true, sharedBy: s.sharedBy.name ?? s.sharedBy.email })),
  ]

  const scored = await Promise.all(allProps.map(async p => {
    const ratings = await prisma.rating.findMany({ where: { userId, propertyId: p.id } })
    const breakdown = calcScore(criteria as any, ratings as any, f as any, userId)
    return { ...p, score: breakdown.total, ratedCount: breakdown.ratedCount, requiredCount: breakdown.requiredCount }
  }))

  return (
    <div className="p-8 max-w-5xl fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Properties</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {scored.length} {scored.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <Link href="/dashboard/properties/new"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--ink)', color: '#fff' }}>
          + Add property
        </Link>
      </div>

      {scored.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed var(--border)' }}>
          <p className="text-lg font-display mb-2" style={{ color: 'var(--ink)' }}>No properties yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Add a property to start evaluating</p>
          <Link href="/dashboard/properties/new"
            className="inline-block px-6 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--ink)', color: '#fff' }}>
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scored.map(p => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`}
              className="rounded-2xl overflow-hidden transition-all hover:shadow-sm"
              style={{ border: '1px solid var(--border)', background: '#fff' }}>
              {/* Photo */}
              <div className="h-40 relative" style={{ background: 'var(--surface)' }}>
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>No photos</div>
                }
                {p.isShared && (
                  <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)' }}>
                    Shared by {p.sharedBy}
                  </span>
                )}
                {p.score !== null && (
                  <span className={`absolute top-3 right-3 text-sm font-medium px-3 py-1 rounded-full ${scoreBg(p.score, f.normalise)}`}>
                    {p.score}
                  </span>
                )}
              </div>
              {/* Body */}
              <div className="p-4">
                <div className="font-medium truncate mb-1" style={{ color: 'var(--ink)' }}>{p.address}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  {[p.tenure, p.epc ? `EPC ${p.epc}` : null, p.price ? `${CURRENCY_SYMBOLS[p.currency]}${p.price.toLocaleString('en-GB')}` : null]
                    .filter(Boolean).join(' · ')}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.requiredCount > 0 ? Math.round((p.ratedCount / p.requiredCount) * 100) : 0}%`,
                        background: 'var(--ink)',
                      }} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {p.ratedCount}/{p.requiredCount} rated
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
