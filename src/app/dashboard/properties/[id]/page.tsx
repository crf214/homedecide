// src/app/dashboard/properties/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { calcScore, scoreBg, CURRENCY_SYMBOLS } from '@/lib/scoring'
import Link from 'next/link'
import EvaluatePanel from '@/components/property/EvaluatePanel'
import SharePanel from '@/components/property/SharePanel'
import DocumentsPanel from '@/components/property/DocumentsPanel'

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

  const listingLinks = (Array.isArray(property.listingLinks) ? property.listingLinks : []) as { label: string; url: string }[]

  function buildEmbedUrl(url: string): string {
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
  }

  return (
    <div className="p-8 max-w-5xl fade-up">
      <div className="flex items-start gap-6 mb-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <Link href="/dashboard/properties" className="text-sm" style={{ color: 'var(--muted)' }}>
            ← Properties
          </Link>
          <h1 className="font-display text-3xl mb-2 mt-1" style={{ color: 'var(--ink)' }}>{property.address}</h1>
          {property.street && (
            <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
              {property.street}{property.postcode ? `, ${property.postcode}` : ''}
            </div>
          )}
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
          </div>
          {listingLinks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {listingLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)', border: '1px solid transparent' }}>
                  {link.label || link.url}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1.5 8.5L8.5 1.5M8.5 1.5H3.5M8.5 1.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

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

      {property.photos.length > 0 && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {property.photos.map((src, i) => (
            <img key={i} src={src} alt=""
              className="h-48 w-auto flex-shrink-0 rounded-2xl object-cover"
              style={{ border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {property.mapsUrl && (
        <div className="mb-8">
          <a href={property.mapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm underline mb-3 inline-block" style={{ color: 'var(--blue-text)' }}>
            View on map ↗
          </a>
          <iframe
            src={buildEmbedUrl(property.mapsUrl)}
            width="100%"
            height="300"
            title="Property location"
            style={{ border: 'none', borderRadius: 12, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {property.notes && (
        <div className="mb-6 p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Notes</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{property.notes}</p>
        </div>
      )}

      <div className="mb-8 rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="text-xs font-medium mb-4 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Property details</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {property.bedrooms != null && (
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Bedrooms</div>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>{property.bedrooms}</div>
            </div>
          )}
          {property.bathrooms != null && (
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Bathrooms</div>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>{property.bathrooms}</div>
            </div>
          )}
          {property.livingRooms != null && (
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Living rooms</div>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>{property.livingRooms}</div>
            </div>
          )}
          {property.internalArea != null && (
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Internal area</div>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>
                {property.internalArea} {property.internalAreaUnit ?? 'sqft'}
                <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
                  ({property.internalAreaUnit === 'sqm'
                    ? `${Math.round(property.internalArea * 10.764)} sqft`
                    : `${(property.internalArea / 10.764).toFixed(1)} sqm`})
                </span>
              </div>
            </div>
          )}
        </div>

        {(property.hasOffice || property.hasGym || property.hasBasement) && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {property.hasOffice   && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)' }}>Office</span>}
            {property.hasGym      && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)' }}>Gym</span>}
            {property.hasBasement && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--blue-soft)', color: 'var(--blue-text)' }}>Basement</span>}
          </div>
        )}

        {property.gardenType && property.gardenType !== 'none' && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Outdoor space</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Type</div>
                <div className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--ink)' }}>{property.gardenType}</div>
              </div>
              {property.gardenPrivacy && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Privacy</div>
                  <div className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--ink)' }}>{property.gardenPrivacy}</div>
                </div>
              )}
              {property.gardenOrientation && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Orientation</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>{property.gardenOrientation}</div>
                </div>
              )}
              {property.gardenMaintenance && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Maintenance</div>
                  <div className="text-sm font-medium mt-0.5 capitalize" style={{ color: 'var(--ink)' }}>{property.gardenMaintenance}</div>
                </div>
              )}
              {property.gardenSize != null && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Garden size</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--ink)' }}>
                    {property.gardenSize} {property.gardenSizeUnit ?? 'sqft'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <EvaluatePanel
        propertyId={params.id}
        criteria={criteria as any}
        initialRatings={existingRatings as any}
        formula={f as any}
        userId={userId}
      />

      <DocumentsPanel propertyId={params.id} />

      {isOwner && (
        <div className="mt-8">
          <SharePanel propertyId={params.id} />
        </div>
      )}
    </div>
  )
}