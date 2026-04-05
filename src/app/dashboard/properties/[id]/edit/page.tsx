// src/app/dashboard/properties/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import PropertyForm from '@/components/property/PropertyForm'
import Link from 'next/link'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const session  = await getSession()
  const property = await prisma.property.findUnique({ where: { id: params.id } })

  if (!property || property.userId !== session.userId) notFound()

  return (
    <div className="p-8 max-w-3xl fade-up">
      <div className="mb-8">
        <Link href={`/dashboard/properties/${params.id}`}
          className="text-sm" style={{ color: 'var(--muted)' }}>
          ← Back to property
        </Link>
        <h1 className="font-display text-3xl mt-2" style={{ color: 'var(--ink)' }}>Edit property</h1>
      </div>
      <PropertyForm property={{
        ...property,
        price:      property.price ?? undefined,
        listingUrl: property.listingUrl ?? undefined,
        tenure:     property.tenure ?? undefined,
        epc:        property.epc ?? undefined,
        notes:      property.notes ?? undefined,
      }} />
    </div>
  )
}
