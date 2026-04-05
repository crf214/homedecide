// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'property-photos'

export async function uploadPhoto(
  file: File,
  userId: string,
  propertyId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${propertyId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deletePhoto(url: string): Promise<void> {
  // Extract path from public URL
  const parts = url.split(`/storage/v1/object/public/${BUCKET}/`)
  if (parts.length < 2) return
  const path = parts[1]
  await supabase.storage.from(BUCKET).remove([path])
}
