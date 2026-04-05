// src/app/api/criteria/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const schema = z.object({
  order: z.array(z.object({ id: z.string(), position: z.number().int() })),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const { order } = schema.parse(body)

    await prisma.$transaction(
      order.map(({ id, position }) =>
        prisma.criterion.updateMany({
          where: { id, userId },
          data: { position },
        })
      )
    )

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Reorder failed' }, { status: 500 })
  }
}
