// src/app/dashboard/criteria/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import CriteriaManager from '@/components/criteria/CriteriaManager'

export default async function CriteriaPage() {
  const session  = await getSession()
  const criteria = await prisma.criterion.findMany({
    where:   { userId: session.userId! },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="p-8 max-w-4xl fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Criteria</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Define what matters to you. Drag to reorder — changes apply across all properties.
        </p>
      </div>
      <CriteriaManager initialCriteria={criteria as any} />
    </div>
  )
}
