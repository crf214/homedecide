// src/app/api/properties/[id]/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (property.userId !== userId) {
      const share = await prisma.propertyShare.findUnique({
        where: { propertyId_sharedWithId: { propertyId: params.id, sharedWithId: userId } },
      })
      if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const logs = await prisma.propertyActivityLog.findMany({
      where: { propertyId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ data: logs }, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
