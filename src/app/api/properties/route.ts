// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const createSchema = z.object({
  address:          z.string().min(1),
  street:           z.string().optional().nullable(),
  postcode:         z.string().optional().nullable(),
  price:            z.number().positive().optional().nullable(),
  currency:         z.enum(['GBP','USD','EUR','CHF']).default('GBP'),
  listingUrl:       z.string().url().optional().nullable(),
  tenure:           z.string().optional().nullable(),
  epc:              z.string().optional().nullable(),
  notes:            z.string().optional().nullable(),
  photos:           z.array(z.string()).default([]),
  internalArea:     z.number().positive().optional().nullable(),
  internalAreaUnit: z.enum(['sqft','sqm']).default('sqft'),
  bedrooms:         z.number().int().min(0).optional().nullable(),
  bathrooms:        z.number().int().min(0).optional().nullable(),
  livingRooms:      z.number().int().min(0).optional().nullable(),
  hasOffice:        z.boolean().optional().nullable(),
  hasGym:           z.boolean().optional().nullable(),
  hasBasement:      z.boolean().optional().nullable(),
  gardenSize:         z.number().positive().optional().nullable(),
  gardenSizeUnit:     z.enum(['sqft','sqm']).default('sqft'),
  gardenOrientation:  z.string().optional().nullable(),
  gardenPrivacy:      z.string().optional().nullable(),
  gardenType:         z.string().optional().nullable(),
  gardenMaintenance:  z.string().optional().nullable(),
})

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const [owned, shared] = await Promise.all([
      prisma.property.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.propertyShare.findMany({
        where: { sharedWithId: userId },
        include: { property: true, sharedBy: { select: { name: true, email: true } } },
      }),
    ])
    const sharedProps = shared.map(s => ({
      ...s.property, isShared: true,
      sharedBy: s.sharedBy.name ?? s.sharedBy.email,
      canEdit: s.canEdit,
    }))
    return NextResponse.json({ data: [...owned, ...sharedProps] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const data = createSchema.parse(body)
    const property = await prisma.property.create({ data: { ...data, userId } })
    return NextResponse.json({ data: property }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}