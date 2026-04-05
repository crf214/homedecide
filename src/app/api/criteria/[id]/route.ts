// src/app/api/criteria/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  category:    z.string().min(1).optional(),
  ratingType:  z.enum(['num', 'star']).optional(),
  weight:      z.number().min(0.1).max(10).optional(),
  description: z.string().optional().nullable(),
  required:    z.boolean().optional(),
  position:    z.number().int().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const criterion = await prisma.criterion.findUnique({ where: { id: params.id } })
    if (!criterion || criterion.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.criterion.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({ data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const criterion = await prisma.criterion.findUnique({ where: { id: params.id } })
    if (!criterion || criterion.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.criterion.delete({ where: { id: params.id } })
    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
