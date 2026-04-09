// src/app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { logActivity } from '@/lib/activityLog'

const LOGGABLE_FIELDS = [
  'address', 'street', 'postcode', 'price', 'currency', 'listingUrl',
  'tenure', 'epc', 'notes', 'internalArea', 'internalAreaUnit',
  'bedrooms', 'bathrooms', 'livingRooms', 'hasOffice', 'hasGym', 'hasBasement',
  'gardenType', 'gardenSize', 'gardenOrientation', 'gardenPrivacy',
  'gardenMaintenance', 'mapsUrl', 'neighbourhood', 'neighbourhoodSub',
] as const

const updateSchema = z.object({
  address:          z.string().min(1).optional(),
  street:           z.string().optional().nullable(),
  postcode:         z.string().optional().nullable(),
  price:            z.number().positive().optional().nullable(),
  currency:         z.enum(['GBP','USD','EUR','CHF']).optional(),
  listingUrl:       z.string().url().optional().nullable(),
  tenure:           z.string().optional().nullable(),
  epc:              z.string().optional().nullable(),
  notes:            z.string().optional().nullable(),
  photos:           z.array(z.string()).optional(),
  internalArea:     z.number().positive().optional().nullable(),
  internalAreaUnit: z.enum(['sqft','sqm']).optional(),
  bedrooms:         z.number().int().min(0).optional().nullable(),
  bathrooms:        z.number().int().min(0).optional().nullable(),
  livingRooms:      z.number().int().min(0).optional().nullable(),
  hasOffice:        z.boolean().optional().nullable(),
  hasGym:           z.boolean().optional().nullable(),
  hasBasement:      z.boolean().optional().nullable(),
  gardenSize:         z.number().positive().optional().nullable(),
  gardenSizeUnit:     z.enum(['sqft','sqm']).optional(),
  gardenOrientation:  z.string().optional().nullable(),
  gardenPrivacy:      z.string().optional().nullable(),
  gardenType:         z.string().optional().nullable(),
  gardenMaintenance:  z.string().optional().nullable(),
  mapsUrl:             z.string().optional().nullable(),
  listingLinks:        z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  neighbourhood:       z.string().optional().nullable(),
  neighbourhoodSub:    z.string().optional().nullable(),
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
    const old = access.property
    const updated = await prisma.property.update({ where: { id: params.id }, data })
    const response = NextResponse.json({ data: updated })

    void (async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const userName = user?.name ?? user?.email ?? userId
      for (const field of LOGGABLE_FIELDS) {
        const oldVal = old[field] ?? null
        const newVal = (updated as any)[field] ?? null
        if (String(oldVal) !== String(newVal)) {
          logActivity({
            propertyId: params.id,
            userId,
            userName,
            actionType: 'property_updated',
            fieldName: field,
            oldValue: oldVal !== null ? String(oldVal) : undefined,
            newValue: newVal !== null ? String(newVal) : undefined,
          })
        }
      }
    })()

    return response
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