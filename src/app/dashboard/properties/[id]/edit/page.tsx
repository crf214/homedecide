// src/app/dashboard/properties/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { CURRENCY_SYMBOLS } from '@/lib/scoring'
import PropertyForm from '@/components/property/PropertyForm'
import Link from 'next/link'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session  = await getSession()
  const property = await prisma.property.findUnique({ where: { id: params.id } })

  if (!property || property.userId !== session.userId) notFound()

  const sym = CURRENCY_SYMBOLS[property.currency] ?? '£'

  const pricePerArea = property.price && property.internalArea
    ? (property.internalAreaUnit === 'sqm'
        ? { value: Math.round(property.price / property.internalArea), unit: '/sqm' }
        : { value: Math.round(property.price / property.internalArea), unit: '/sqft' })
    : null

  const stickyAttrs = [
    property.tenure ?? null,
    property.price ? `${sym}${property.price.toLocaleString('en-GB')}` : null,
    [
      property.bedrooms != null ? `${property.bedrooms} bed` : null,
      property.bathrooms != null ? `${property.bathrooms} bath` : null,
    ].filter(Boolean).join(' · ') || null,
    pricePerArea ? `${sym}${pricePerArea.value.toLocaleString('en-GB')}${pricePerArea.unit}` : null,
  ].filter(Boolean)

  return (
    <>
      {/* Sticky header bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '56px', padding: '0 2rem',
        background: '#fff',
        borderBottom: '3px solid #1F3C8F',
        display: 'flex', alignItems: 'center', gap: '1.25rem',
      }}>
        {/* Back link */}
        <Link href={`/dashboard/properties/${params.id}`}
          style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
          ← Back to property
        </Link>

        {/* Divider */}
        <span style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />

        {/* Property name + attributes */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink)', marginRight: '4px', whiteSpace: 'nowrap' }}>
              {property.address}
            </span>
            {stickyAttrs.map((attr, i) => (
              <span key={i} style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>{attr}
              </span>
            ))}
          </div>
        </div>

        {/* Neutral "Editing" ring */}
        <div style={{
          flexShrink: 0, width: '40px', height: '40px', borderRadius: '9999px',
          border: '2px solid #d1d5db', background: '#f9fafb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 500, color: '#9ca3af', letterSpacing: '-0.01em',
        }}>
          ✏
        </div>
      </div>

      <div className="p-8 max-w-3xl fade-up" style={{ paddingTop: 'calc(56px + 2rem)' }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Edit property</h1>
        </div>
        <PropertyForm property={{
          ...property,
          price:        property.price ?? undefined,
          listingUrl:   property.listingUrl ?? undefined,
          mapsUrl:      property.mapsUrl ?? undefined,
          listingLinks: (Array.isArray(property.listingLinks) ? property.listingLinks : []) as { label: string; url: string }[],
          tenure:           property.tenure ?? undefined,
          epc:              property.epc ?? undefined,
          notes:            property.notes ?? undefined,
          neighbourhood:    property.neighbourhood ?? undefined,
          neighbourhoodSub: property.neighbourhoodSub ?? undefined,
        }} />
      </div>
    </>
  )
}
