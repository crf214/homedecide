// src/app/dashboard/evaluate/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import CompareView from '@/components/property/CompareView'

export default async function EvaluatePage() {
  const session = await getSession()
  const userId  = session.userId!

  const [ownedProps, sharedProps, criteria, formula] = await Promise.all([
    prisma.property.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.propertyShare.findMany({
      where: { sharedWithId: userId },
      include: { property: true },
    }),
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
  ])

  const allProps = [
    ...ownedProps.map(p => ({ ...p, isShared: false })),
    ...sharedProps.map(s => ({ ...s.property, isShared: true })),
  ]

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }

  // Fetch all ratings for this user across all properties
  const allRatings = await prisma.rating.findMany({ where: { userId } })

  return (
    <div className="p-8 fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Compare properties</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Select up to 3 properties to compare side by side
        </p>
      </div>
      <CompareView
        properties={allProps as any}
        criteria={criteria as any}
        allRatings={allRatings as any}
        formula={f as any}
      />
    </div>
  )
}
