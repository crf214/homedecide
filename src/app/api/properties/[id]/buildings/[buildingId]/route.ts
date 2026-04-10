// src/app/api/properties/[id]/buildings/[buildingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { logActivity } from '@/lib/activityLog'

const updateSchema = z.object({
  name:       z.string().optional().nullable(),
  yearBuilt:  z.number().int().min(1000).max(2100).optional().nullable(),
  condition:  z.string().optional().nullable(),
  totalUnits: z.number().int().min(1).optional().nullable(),
  notes:      z.string().optional().nullable(),
})

async function canEdit(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return false
  if (property.userId === userId) return true
  const share = await prisma.propertyShare.findUnique({
    where: { propertyId_sharedWithId: { propertyId, sharedWithId: userId } },
  })
  return share?.canEdit ?? false
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; buildingId: string } }
) {
  try {
    const { userId } = await requireAuth()
    if (!(await canEdit(params.id, userId))) {
      return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 })
    }
    const building = await prisma.propertyBuilding.findUnique({ where: { id: params.buildingId } })
    if (!building || building.propertyId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const data = updateSchema.parse(body)
    const updated = await prisma.propertyBuilding.update({
      where: { id: params.buildingId },
      data,
    })
    void (async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const userName = user?.name ?? user?.email ?? userId
      const buildingLabel = updated.name ?? `Building ${params.buildingId.slice(-4)}`
      const LOGGABLE: (keyof typeof data)[] = ['name', 'yearBuilt', 'condition', 'totalUnits', 'notes']
      for (const field of LOGGABLE) {
        const oldVal = building[field] ?? null
        const newVal = updated[field] ?? null
        if (String(oldVal) !== String(newVal)) {
          logActivity({
            propertyId: params.id,
            userId,
            userName,
            actionType: 'building_updated',
            fieldName: `${buildingLabel} — ${field}`,
            oldValue: oldVal !== null ? String(oldVal) : undefined,
            newValue: newVal !== null ? String(newVal) : undefined,
          })
        }
      }
    })()
    return NextResponse.json({ data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; buildingId: string } }
) {
  try {
    const { userId } = await requireAuth()
    if (!(await canEdit(params.id, userId))) {
      return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 })
    }
    const building = await prisma.propertyBuilding.findUnique({ where: { id: params.buildingId } })
    if (!building || building.propertyId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const label = building.name ?? `Building ${params.buildingId.slice(-4)}`
    await prisma.propertyBuilding.delete({ where: { id: params.buildingId } })
    void (async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      logActivity({
        propertyId: params.id,
        userId,
        userName: user?.name ?? user?.email ?? userId,
        actionType: 'building_removed',
        oldValue: label,
      })
    })()
    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
