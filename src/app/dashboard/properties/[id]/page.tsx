// src/app/dashboard/properties/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { calcScore, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'
import Link from 'next/link'
import EvaluatePanel from '@/components/property/EvaluatePanel'
import SharePanel from '@/components/property/SharePanel'

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const userId  = session.userId!

  const [property, criteria, formula, existingRatings] = await Promise.all([
    prisma.property.findUnique({ where: { id: params.id } }),
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
    prisma.rating.findMany({ where: { userId, propertyId: params.id } }),
  ])

  if (!property) notFound()

  // Check access
  const isOwner = property.userId === userId
  if (!isOwner) {
    const share = await prisma.propertyShare.findUnique({
      where: { propertyId_sharedWithId: { propertyId: params.id, sharedWithId: userId } },
    })
    if (!share) notFound()
  }

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }
  const breakdown = calcScore(criteria as any, existingRatings as any, f as any, userId)

  const sym = CURRENCY_SYMBOLS[property.currency] ?? '£'

  return (
    <div className="p-8 max-w-5xl fade-up">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <Link href="/dashboard/properties" className="text-sm" style={{ color: 'var(--muted)' }}>
              ← Properties
            </Link>
          </div>
          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>{property.address}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              property.tenure,
              property.epc ? `EPC ${property.epc}` : null,
              property.price ? `${sym}${property.price.toLocaleString('en-GB')}` : null,
            ].filter(Boolean).map((m, i) => (
              <span key={i} className="text-sm px-3 py-1 rounded-full"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {m}
              </span>
            ))}
            {property.listingUrl && (
              <a href={property.listingUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm underline" style={{ color: 'var(--blue-text)' }}>
                View listing ↗
              </a>
            )}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium border-2
            ${breakdown.total !== null ? scoreBg(breakdown.total, f.normalise) : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
            {breakdown.total ?? '—'}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {breakdown.total !== null ? `Score / ${f.normalise}` : 'Not scored yet'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {breakdown.ratedCount} of {breakdown.requiredCount} required rated
            </div>
            {isOwner && (
              <Link href={`/dashboard/properties/${params.id}/edit`}
                className="text-xs underline mt-1 block" style={{ color: 'var(--muted)' }}>
                Edit details
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Photos */}
      {property.photos.length > 0 && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {property.photos.map((src, i) => (
            <img key={i} src={src} alt=""
              className="h-48 w-auto flex-shrink-0 rounded-2xl object-cover"
              style={{ border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {/* Notes */}
      {property.notes && (
        <div className="mb-8 p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Notes</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{property.notes}</p>
        </div>
      )}

      {/* Evaluate panel */}
      <EvaluatePanel
        propertyId={params.id}
        criteria={criteria as any}
        initialRatings={existingRatings as any}
        formula={f as any}
        userId={userId}
      />

      {/* Share panel (owner only) */}
      {isOwner && (
        <div className="mt-8">
          <SharePanel propertyId={params.id} />
        </div>
      )}
    </div>
  )
}
