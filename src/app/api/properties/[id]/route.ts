// src/app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const updateSchema = z.object({
  address:    z.string().min(1).optional(),
  price:      z.number().positive().optional().nullable(),
  currency:   z.enum(['GBP','USD','EUR','CHF']).optional(),
  listingUrl: z.string().url().optional().nullable(),
  tenure:     z.string().optional().nullable(),
  epc:        z.string().optional().nullable(),
  notes:      z.string().optional().nullable(),
  photos:     z.array(z.string()).optional(),
})

async function canAccess(propertyId: string, userId: string, requireEdit = false) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return null

  if (property.userId === userId) return { property, canEdit: true }

  const share = await prisma.propertyShare.findUnique({
    where: { propertyId_sharedWithId: { propertyId, sharedWithId: userId } },
  })
  if (!share) return null
  if (requireEdit && !share.canEdit) return null

  return { property, canEdit: share.canEdit }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const access = await canAccess(params.id, userId)
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: access.property })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const access = await canAccess(params.id, userId, true)
    if (!access) return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 })

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.property.update({
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
    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.property.delete({ where: { id: params.id } })
    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
