// src/app/api/properties/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

async function canAccess(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return false
  if (property.userId === userId) return true
  const share = await prisma.propertyShare.findUnique({
    where: { propertyId_sharedWithId: { propertyId, sharedWithId: userId } },
  })
  return !!share
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    if (!(await canAccess(params.id, userId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const documents = await prisma.propertyDocument.findMany({
      where: { propertyId: params.id },
      orderBy: { uploadedAt: 'desc' },
    })
    return NextResponse.json({ data: documents })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const { searchParams } = new URL(req.url)
    const docId = searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

    const doc = await prisma.propertyDocument.findUnique({ where: { id: docId } })
    if (!doc || doc.propertyId !== params.id || doc.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.propertyDocument.delete({ where: { id: docId } })
    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
