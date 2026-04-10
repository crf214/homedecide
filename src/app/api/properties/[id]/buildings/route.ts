// src/app/api/properties/[id]/buildings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { logActivity } from '@/lib/activityLog'

const buildingSchema = z.object({
  name:       z.string().optional().nullable(),
  yearBuilt:  z.number().int().min(1000).max(2100).optional().nullable(),
  condition:  z.string().optional().nullable(),
  totalUnits: z.number().int().min(1).optional().nullable(),
  notes:      z.string().optional().nullable(),
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
    const buildings = await prisma.propertyBuilding.findMany({
      where: { propertyId: params.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: buildings })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const access = await canAccess(params.id, userId, true)
    if (!access) return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 })

    const buildings = await prisma.propertyBuilding.findMany({ where: { propertyId: params.id } })
    if (buildings.length === 0) return NextResponse.json({ data: { deleted: 0 } })

    await prisma.propertyBuilding.deleteMany({ where: { propertyId: params.id } })

    void (async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const userName = user?.name ?? user?.email ?? userId
      logActivity({
        propertyId: params.id,
        userId,
        userName,
        actionType: 'buildings_cleared',
        oldValue: `${buildings.length} building${buildings.length !== 1 ? 's' : ''} removed on property type change`,
      })
    })()

    return NextResponse.json({ data: { deleted: buildings.length } })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const access = await canAccess(params.id, userId, true)
    if (!access) return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 })
    const body = await req.json()
    const data = buildingSchema.parse(body)
    const building = await prisma.propertyBuilding.create({
      data: { ...data, propertyId: params.id },
    })
    void (async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      logActivity({
        propertyId: params.id,
        userId,
        userName: user?.name ?? user?.email ?? userId,
        actionType: 'building_added',
        newValue: building.name ?? `Building ${building.id.slice(-4)}`,
      })
    })()
    return NextResponse.json({ data: building }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
