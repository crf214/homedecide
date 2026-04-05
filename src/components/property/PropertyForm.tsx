'use client'
// src/components/property/PropertyForm.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  property?: {
    id: string
    address: string
    price?: number | null
    currency: string
    listingUrl?: string | null
    tenure?: string | null
    epc?: string | null
    notes?: string | null
    photos: string[]
  }
}

const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF']
const TENURES    = ['Freehold', 'Leasehold', 'Share of freehold', 'Commonhold']
const EPCS       = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

export default function PropertyForm({ property }: Props) {
  const router = useRouter()
  const isEdit = !!property

  const [address,    setAddress]    = useState(property?.address    ?? '')
  const [price,      setPrice]      = useState(property?.price?.toString() ?? '')
  const [currency,   setCurrency]   = useState(property?.currency   ?? 'GBP')
  const [listingUrl, setListingUrl] = useState(property?.listingUrl ?? '')
  const [tenure,     setTenure]     = useState(property?.tenure     ?? 'Freehold')
  const [epc,        setEpc]        = useState(property?.epc        ?? 'C')
  const [notes,      setNotes]      = useState(property?.notes      ?? '')
  const [photos,     setPhotos]     = useState<string[]>(property?.photos ?? [])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setNewPhotoFiles(prev => [...prev, ...files])
    // Preview
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(prev => [...prev, ev.target!.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    // If it was a new file, remove from newPhotoFiles too
    const existingCount = (property?.photos ?? []).length
    if (idx >= existingCount) {
      setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx - existingCount))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) { setError('Address is required'); return }
    setError(''); setSaving(true)

    try {
      const body = {
        address: address.trim(),
        price:      price ? parseFloat(price) : null,
        currency,
        listingUrl: listingUrl.trim() || null,
        tenure:     tenure || null,
        epc:        epc || null,
        notes:      notes.trim() || null,
        photos:     isEdit ? photos.filter(p => !p.startsWith('data:')) : [],
      }

      let propId = property?.id
      if (isEdit) {
        const res = await fetch(`/api/properties/${property!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
      } else {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
        const j = await res.json()
        propId = j.data.id
      }

      // Upload new photos
      if (newPhotoFiles.length > 0 && propId) {
        const fd = new FormData()
        newPhotoFiles.forEach(f => fd.append('photos', f))
        await fetch(`/api/properties/${propId}/photos`, { method: 'POST', body: fd })
      }

      router.push(`/dashboard/properties/${propId}`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!property || !confirm('Delete this property and all its ratings? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/properties/${property.id}`, { method: 'DELETE' })
    router.push('/dashboard/properties')
    router.refresh()
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm transition-colors"
  const inputStyle = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }
  const labelStyle = { color: 'var(--muted)', fontSize: 13, display: 'block', marginBottom: 6 }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      {/* Address + Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label style={labelStyle}>Address <span style={{ color: 'var(--red-text)' }}>*</span></label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            className={inputClass} style={inputStyle}
            placeholder="e.g. 14 Kensington Gardens, London W8 4PT" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Asking price</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className={inputClass} style={inputStyle} placeholder="350000" min="0" />
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className={inputClass} style={inputStyle}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Listing URL */}
      <div>
        <label style={labelStyle}>Rightmove / Zoopla listing URL</label>
        <input type="url" value={listingUrl} onChange={e => setListingUrl(e.target.value)}
          className={inputClass} style={inputStyle}
          placeholder="https://www.rightmove.co.uk/properties/..." />
      </div>

      {/* Tenure + EPC */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label style={labelStyle}>Tenure</label>
          <select value={tenure} onChange={e => setTenure(e.target.value)}
            className={inputClass} style={inputStyle}>
            {TENURES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>EPC rating</label>
          <select value={epc} onChange={e => setEpc(e.target.value)}
            className={inputClass} style={inputStyle}>
            {EPCS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes & first impressions</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={4} className={inputClass} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }}
          placeholder="Street feel, building condition, neighbours, first impressions on arrival..." />
      </div>

      {/* Photos */}
      <div>
        <label style={labelStyle}>Photos</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {photos.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt="" className="w-24 h-20 object-cover rounded-xl"
                style={{ border: '1px solid var(--border)' }} />
              <button type="button" onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs items-center justify-center hidden group-hover:flex"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-24 h-20 rounded-xl flex flex-col items-center justify-center gap-1 text-xs transition-colors hover:border-stone-400"
            style={{ border: '1.5px dashed var(--border)', color: 'var(--muted)' }}>
            <span style={{ fontSize: 20 }}>+</span>
            Add photos
          </button>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*"
          onChange={handleFileChange} className="hidden" />
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Upload photos from viewings. Supported: JPG, PNG, WEBP. Max 10MB each.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-opacity"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Cancel
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto px-5 py-3 rounded-xl text-sm transition-opacity"
            style={{ background: 'var(--red-soft)', color: 'var(--red-text)', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete property'}
          </button>
        )}
      </div>
    </form>
  )
}
