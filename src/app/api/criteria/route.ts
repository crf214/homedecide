// src/app/api/criteria/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const createSchema = z.object({
  name:        z.string().min(1),
  category:    z.string().min(1),
  ratingType:  z.enum(['num', 'star']).default('num'),
  weight:      z.number().min(0.1).max(10).default(1),
  description: z.string().optional().nullable(),
  required:    z.boolean().default(true),
  position:    z.number().int().default(999),
})

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const criteria = await prisma.criterion.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json({ data: criteria })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const data = createSchema.parse(body)

    const criterion = await prisma.criterion.create({
      data: { ...data, userId, isDefault: false },
    })
    return NextResponse.json({ data: criterion }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create criterion' }, { status: 500 })
  }
}
