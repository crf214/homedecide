// src/app/api/media/route.ts
// Authenticated media proxy for private Storage buckets.
// Verifies the session (and property access for property-scoped objects), then
// 302-redirects to a short-lived signed URL. This is what makes the buckets safe
// to keep private: the raw object URLs never work anonymously.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

const PUBLIC_MARKER = '/storage/v1/object/public/'
const ALLOWED_BUCKETS = new Set(['property-photos', 'property-documents'])
const SIGNED_TTL = 3600 // seconds

async function canAccessProperty(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return false
  if (property.userId === userId) return true
  const share = await prisma.propertyShare.findUnique({
    where: { propertyId_sharedWithId: { propertyId, sharedWithId: userId } },
  })
  return !!share
}

export async function GET(req: NextRequest) {
  let userId: string
  try {
    ({ userId } = await requireAuth())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const u = req.nextUrl.searchParams.get('u')
  if (!u || !u.includes(PUBLIC_MARKER)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Extract "<bucket>/<path>" and drop any query string (e.g. avatar ?t= cache-buster).
  const afterMarker = u.split(PUBLIC_MARKER)[1].split('?')[0]
  const [bucket, ...pathParts] = afterMarker.split('/')
  const path = pathParts.map(decodeURIComponent).join('/')

  if (!ALLOWED_BUCKETS.has(bucket) || pathParts.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Object layout: <ownerId>/<propertyId>/<file> for property media,
  // <ownerId>/avatar.<ext> for avatars. Property media is access-checked.
  if (pathParts.length >= 3) {
    const propertyId = pathParts[1]
    if (!(await canAccessProperty(propertyId, userId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  // Avatars (2-segment paths) only require a valid session, which we have.

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_TTL)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.redirect(data.signedUrl, {
    // Cache slightly less than the signed-URL TTL, per user (private).
    headers: { 'Cache-Control': `private, max-age=${SIGNED_TTL - 600}` },
  })
}
