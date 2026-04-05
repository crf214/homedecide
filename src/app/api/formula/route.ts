// src/app/api/formula/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const updateSchema = z.object({
  mode:      z.enum(['weighted', 'category']).optional(),
  normalise: z.number().int().min(1).max(100).optional(),
  config:    z.record(z.unknown()).optional(),
})

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const formula = await prisma.formula.findUnique({ where: { userId } })
    return NextResponse.json({ data: formula ?? { mode: 'weighted', normalise: 100, config: {} } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const data = updateSchema.parse(body)

    const formula = await prisma.formula.upsert({
      where: { userId },
      update: data,
      create: { userId, mode: 'weighted', normalise: 100, config: {}, ...data },
    })
    return NextResponse.json({ data: formula })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
