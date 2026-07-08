// src/lib/media.ts
// Rewrites a stored Supabase Storage URL to point at our authenticated media
// proxy (/api/media), which verifies the session + property access and issues a
// short-lived signed URL. Buckets are private, so the raw `object/public/...`
// URLs no longer work anonymously — everything must go through the proxy.
//
// Pure string transform, safe to import from both server and client components.
// Pass-through for data:/blob: previews (editor) and anything that isn't a
// Supabase public-object URL, so the stored value can stay unchanged in the DB.

const PUBLIC_MARKER = '/storage/v1/object/public/'

export function mediaProxyUrl(stored: string | null | undefined): string {
  if (!stored) return ''
  if (stored.startsWith('data:') || stored.startsWith('blob:')) return stored
  if (!stored.includes(PUBLIC_MARKER)) return stored
  return `/api/media?u=${encodeURIComponent(stored)}`
}
