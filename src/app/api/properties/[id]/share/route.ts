// src/app/api/properties/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { logActivity } from '@/lib/activityLog'

const shareSchema = z.object({
  email:   z.string().email(),
  canEdit: z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const { email, canEdit } = shareSchema.parse(body)

    const target = await prisma.user.findUnique({ where: { email } })
    if (!target) {
      return NextResponse.json({ error: 'No user with that email address found' }, { status: 404 })
    }
    if (target.id === userId) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
    }

    const share = await prisma.propertyShare.upsert({
      where: {
        propertyId_sharedWithId: { propertyId: params.id, sharedWithId: target.id },
      },
      update: { canEdit },
      create: {
        propertyId: params.id,
        sharedById: userId,
        sharedWithId: target.id,
        canEdit,
      },
    })

    const response = NextResponse.json({ data: share })

    void (async () => {
      const actor = await prisma.user.findUnique({ where: { id: userId } })
      logActivity({
        propertyId: params.id,
        userId,
        userName: actor?.name ?? actor?.email ?? userId,
        actionType: 'shared',
        fieldName: email,
      })
    })()

    return response
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Share failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const { sharedWithId } = await req.json()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.propertyShare.delete({
      where: {
        propertyId_sharedWithId: { propertyId: params.id, sharedWithId },
      },
    })

    const response = NextResponse.json({ data: { ok: true } })

    void (async () => {
      const [actor, target] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { id: sharedWithId } }),
      ])
      logActivity({
        propertyId: params.id,
        userId,
        userName: actor?.name ?? actor?.email ?? userId,
        actionType: 'unshared',
        fieldName: target?.email ?? sharedWithId,
      })
    })()

    return response
  } catch {
    return NextResponse.json({ error: 'Unshare failed' }, { status: 500 })
  }
}
