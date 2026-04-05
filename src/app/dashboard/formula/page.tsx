// src/app/dashboard/formula/page.tsx
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import FormulaBuilder from '@/components/criteria/FormulaBuilder'

export default async function FormulaPage() {
  const session  = await getSession()
  const userId   = session.userId!

  const [criteria, formula] = await Promise.all([
    prisma.criterion.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
    prisma.formula.findUnique({ where: { userId } }),
  ])

  const f = formula ?? { id: '', userId, mode: 'weighted' as const, normalise: 100, config: {} }

  return (
    <div className="p-8 max-w-3xl fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>Score formula</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Control how criteria combine into a single property score.
        </p>
      </div>
      <FormulaBuilder initialCriteria={criteria as any} initialFormula={f as any} />
    </div>
  )
}
