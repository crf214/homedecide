// src/app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { logActivity } from '@/lib/activityLog'

const schema = z.object({
  propertyId: z.string(),
  ratings: z.array(z.object({
    criterionId: z.string(),
    value:       z.number().min(1).max(10).optional().nullable(),
    note:        z.string().optional().nullable(),
  })),
})

// GET all ratings for a property (own ratings only)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
    }

    const ratings = await prisma.rating.findMany({
      where: { userId, propertyId },
    })
    return NextResponse.json({ data: ratings })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST bulk upsert ratings for a property
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const { propertyId, ratings } = schema.parse(body)

    // Verify user can access this property
    const property = await prisma.property.findUnique({ where: { id: propertyId } })
    const share = property?.userId !== userId
      ? await prisma.propertyShare.findUnique({
          where: { propertyId_sharedWithId: { propertyId, sharedWithId: userId } },
        })
      : null

    if (!property || (property.userId !== userId && !share)) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch existing ratings before upsert so we can diff old vs new
    const criterionIds = ratings.map(r => r.criterionId)
    const existingRatings = await prisma.rating.findMany({
      where: { userId, propertyId, criterionId: { in: criterionIds } },
    })

    const upserted = await prisma.$transaction(
      ratings.map(r =>
        prisma.rating.upsert({
          where: {
            userId_propertyId_criterionId: {
              userId,
              propertyId,
              criterionId: r.criterionId,
            },
          },
          update: { value: r.value, note: r.note },
          create: {
            userId,
            propertyId,
            criterionId: r.criterionId,
            value: r.value,
            note: r.note,
          },
        })
      )
    )

    const response = NextResponse.json({ data: upserted })

    void (async () => {
      const [user, criteria] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.criterion.findMany({ where: { id: { in: criterionIds } } }),
      ])
      const userName = user?.name ?? user?.email ?? userId
      const criteriaMap = new Map(criteria.map(c => [c.id, c.name]))

      for (const r of ratings) {
        const old = existingRatings.find(e => e.criterionId === r.criterionId)
        const oldVal = old?.value ?? null
        const newVal = r.value ?? null
        if (oldVal !== newVal) {
          logActivity({
            propertyId,
            userId,
            userName,
            actionType: 'rated',
            fieldName: criteriaMap.get(r.criterionId) ?? r.criterionId,
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
    console.error(err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
