// src/app/api/properties/[id]/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { uploadDocument } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (property.userId !== userId) {
      const share = await prisma.propertyShare.findUnique({
        where: { propertyId_sharedWithId: { propertyId: params.id, sharedWithId: userId } },
      })
      if (!share || !share.canEdit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileUrl = await uploadDocument(file, userId, params.id)
    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId: params.id,
        userId,
        filename: file.name,
        fileUrl,
        fileSize: file.size,
      },
    })
    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
