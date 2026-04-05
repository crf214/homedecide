// src/app/api/properties/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { uploadPhoto, deletePhoto } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('photos') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const urls = await Promise.all(
      files.map(f => uploadPhoto(f, userId, params.id))
    )

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { photos: [...property.photos, ...urls] },
    })

    return NextResponse.json({ data: updated.photos })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireAuth()
    const { url } = await req.json()

    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await deletePhoto(url)

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { photos: property.photos.filter(p => p !== url) },
    })

    return NextResponse.json({ data: updated.photos })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
