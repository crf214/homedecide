'use client'
// src/components/property/PropertyForm.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  property?: {
    id: string
    address: string
    street?: string | null
    postcode?: string | null
    price?: number | null
    currency: string
    listingUrl?: string | null
    tenure?: string | null
    epc?: string | null
    notes?: string | null
    photos: string[]
    internalArea?: number | null
    internalAreaUnit?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    livingRooms?: number | null
    hasOffice?: boolean | null
    hasGym?: boolean | null
    hasBasement?: boolean | null
    gardenSize?: number | null
    gardenSizeUnit?: string | null
    gardenOrientation?: string | null
    gardenPrivacy?: string | null
    gardenType?: string | null
    gardenMaintenance?: string | null
  }
}

const CURRENCIES   = ['GBP', 'USD', 'EUR', 'CHF']
const TENURES      = ['Freehold', 'Leasehold', 'Share of freehold', 'Commonhold']
const EPCS         = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const GARDEN_TYPES = ['garden', 'terrace', 'balcony', 'courtyard', 'roof terrace', 'none']
const PRIVACY      = ['private', 'shared', 'none']
const MAINTENANCE  = ['low', 'medium', 'high']

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm transition-colors"
const inputSty = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }
const labelSty: React.CSSProperties = { color: 'var(--muted)', fontSize: 12, display: 'block', marginBottom: 4, marginTop: 10 }
const secSty: React.CSSProperties = { borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="px-4 py-1.5 rounded-lg text-sm transition-all"
          style={{
            background: value === v ? 'var(--ink)' : 'var(--surface)',
            color:      value === v ? '#fff' : 'var(--muted)',
            border:     `1px solid ${value === v ? 'var(--ink)' : 'var(--border)'}`,
          }}>
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

function AreaInput({ value, unit, onValue, onUnit, label }: {
  value: string; unit: string; onValue: (v: string) => void; onUnit: (u: string) => void; label: string
}) {
  function switchUnit(newUnit: string) {
    if (value && !isNaN(parseFloat(value))) {
      const v = parseFloat(value)
      if (newUnit === 'sqm'  && unit === 'sqft') onValue((v / 10.764).toFixed(1))
      if (newUnit === 'sqft' && unit === 'sqm')  onValue((v * 10.764).toFixed(0))
    }
    onUnit(newUnit)
  }
  return (
    <div>
      <label style={labelSty}>{label}</label>
      <div className="flex gap-2">
        <input type="number" value={value} onChange={e => onValue(e.target.value)}
          placeholder="0" min="0" className={inputCls} style={{ ...inputSty, flex: 1 }} />
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {['sqft', 'sqm'].map(u => (
            <button key={u} type="button" onClick={() => switchUnit(u)}
              className="px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: unit === u ? 'var(--ink)' : '#fff', color: unit === u ? '#fff' : 'var(--muted)' }}>
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PropertyForm({ property }: Props) {
  const router = useRouter()
  const isEdit = !!property

  const [address,    setAddress]    = useState(property?.address    ?? '')
  const [street,     setStreet]     = useState(property?.street     ?? '')
  const [postcode,   setPostcode]   = useState(property?.postcode   ?? '')
  const [price,      setPrice]      = useState(property?.price?.toString() ?? '')
  const [currency,   setCurrency]   = useState(property?.currency   ?? 'GBP')
  const [listingUrl, setListingUrl] = useState(property?.listingUrl ?? '')
  const [tenure,     setTenure]     = useState(property?.tenure     ?? 'Freehold')
  const [epc,        setEpc]        = useState(property?.epc        ?? 'C')
  const [notes,      setNotes]      = useState(property?.notes      ?? '')
  const [photos,     setPhotos]     = useState<string[]>(property?.photos ?? [])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [internalArea,     setInternalArea]     = useState(property?.internalArea?.toString()  ?? '')
  const [internalAreaUnit, setInternalAreaUnit] = useState(property?.internalAreaUnit ?? 'sqft')
  const [bedrooms,    setBedrooms]    = useState(property?.bedrooms?.toString()    ?? '')
  const [bathrooms,   setBathrooms]   = useState(property?.bathrooms?.toString()   ?? '')
  const [livingRooms, setLivingRooms] = useState(property?.livingRooms?.toString() ?? '')
  const [hasOffice,   setHasOffice]   = useState(property?.hasOffice   ?? false)
  const [hasGym,      setHasGym]      = useState(property?.hasGym      ?? false)
  const [hasBasement, setHasBasement] = useState(property?.hasBasement ?? false)
  const [gardenType,        setGardenType]        = useState(property?.gardenType        ?? '')
  const [gardenSize,        setGardenSize]        = useState(property?.gardenSize?.toString() ?? '')
  const [gardenSizeUnit,    setGardenSizeUnit]    = useState(property?.gardenSizeUnit    ?? 'sqft')
  const [gardenOrientation, setGardenOrientation] = useState(property?.gardenOrientation ?? '')
  const [gardenPrivacy,     setGardenPrivacy]     = useState(property?.gardenPrivacy     ?? '')
  const [gardenMaintenance, setGardenMaintenance] = useState(property?.gardenMaintenance ?? '')
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setNewPhotoFiles(prev => [...prev, ...files])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotos(prev => [...prev, ev.target!.result as string])
      r.readAsDataURL(f)
    })
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    const existingCount = (property?.photos ?? []).length
    if (idx >= existingCount) setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx - existingCount))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) { setError('Display name is required'); return }
    setError(''); setSaving(true)
    try {
      const body = {
        address: address.trim(), street: street.trim() || null, postcode: postcode.trim() || null,
        price: price ? parseFloat(price) : null, currency,
        listingUrl: listingUrl.trim() || null, tenure: tenure || null, epc: epc || null,
        notes: notes.trim() || null,
        photos: isEdit ? photos.filter(p => !p.startsWith('data:')) : [],
        internalArea: internalArea ? parseFloat(internalArea) : null, internalAreaUnit,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        livingRooms: livingRooms ? parseInt(livingRooms) : null,
        hasOffice, hasGym, hasBasement,
        gardenType: gardenType || null, gardenSize: gardenSize ? parseFloat(gardenSize) : null,
        gardenSizeUnit, gardenOrientation: gardenOrientation || null,
        gardenPrivacy: gardenPrivacy || null, gardenMaintenance: gardenMaintenance || null,
      }
      let propId = property?.id
      if (isEdit) {
        const res = await fetch(`/api/properties/${property!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
      } else {
        const res = await fetch('/api/properties', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json(); setError(j.error); return }
        const j = await res.json(); propId = j.data.id
      }
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
    if (!property || !confirm('Delete this property and all its ratings?')) return
    setDeleting(true)
    await fetch(`/api/properties/${property.id}`, { method: 'DELETE' })
    router.push('/dashboard/properties')
    router.refresh()
  }

  const hasGarden = gardenType && gardenType !== 'none'

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={labelSty}>Street address</label>
          <input type="text" value={street} onChange={e => setStreet(e.target.value)}
            className={inputCls} style={inputSty} placeholder="14 Kensington Gardens" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelSty}>Postcode</label>
            <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)}
              className={inputCls} style={inputSty} placeholder="W8 4PT" />
          </div>
          <div>
            <label style={labelSty}>Display name *</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className={inputCls} style={inputSty} placeholder="Short name" required />
          </div>
        </div>
      </div>

      <div style={secSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Price & tenure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label style={labelSty}>Asking price</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className={inputCls} style={inputSty} placeholder="350000" min="0" />
          </div>
          <div>
            <label style={labelSty}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls} style={inputSty}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSty}>Tenure</label>
            <select value={tenure} onChange={e => setTenure(e.target.value)} className={inputCls} style={inputSty}>
              {TENURES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSty}>EPC rating</label>
            <select value={epc} onChange={e => setEpc(e.target.value)} className={inputCls} style={inputSty}>
              {EPCS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label style={labelSty}>Listing URL (Rightmove / Zoopla)</label>
          <input type="url" value={listingUrl} onChange={e => setListingUrl(e.target.value)}
            className={inputCls} style={inputSty} placeholder="https://www.rightmove.co.uk/properties/..." />
        </div>
      </div>

      <div style={secSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Size & rooms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <AreaInput label="Internal area" value={internalArea} unit={internalAreaUnit}
            onValue={setInternalArea} onUnit={setInternalAreaUnit} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Bedrooms',     val: bedrooms,    set: setBedrooms    },
            { label: 'Bathrooms',    val: bathrooms,   set: setBathrooms   },
            { label: 'Living rooms', val: livingRooms, set: setLivingRooms },
          ].map(f => (
            <div key={f.label}>
              <label style={labelSty}>{f.label}</label>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                className={inputCls} style={inputSty} placeholder="0" min="0" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Office space', val: hasOffice,   set: setHasOffice   },
            { label: 'Gym space',    val: hasGym,      set: setHasGym      },
            { label: 'Basement',     val: hasBasement, set: setHasBasement },
          ].map(f => (
            <div key={f.label}>
              <label style={labelSty}>{f.label}</label>
              <Toggle value={f.val ?? false} onChange={f.set} />
            </div>
          ))}
        </div>
      </div>

      <div style={secSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Garden & outdoor space</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label style={labelSty}>Type</label>
            <select value={gardenType} onChange={e => setGardenType(e.target.value)} className={inputCls} style={inputSty}>
              <option value="">Select…</option>
              {GARDEN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSty}>Privacy</label>
            <select value={gardenPrivacy} onChange={e => setGardenPrivacy(e.target.value)} className={inputCls} style={inputSty}>
              <option value="">Select…</option>
              {PRIVACY.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSty}>Maintenance</label>
            <select value={gardenMaintenance} onChange={e => setGardenMaintenance(e.target.value)} className={inputCls} style={inputSty}>
              <option value="">Select…</option>
              {MAINTENANCE.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
            </select>
          </div>
        </div>
        {hasGarden && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AreaInput label="Garden size" value={gardenSize} unit={gardenSizeUnit}
              onValue={setGardenSize} onUnit={setGardenSizeUnit} />
            <div>
              <label style={labelSty}>Orientation</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ORIENTATIONS.map(o => (
                  <button key={o} type="button" onClick={() => setGardenOrientation(gardenOrientation === o ? '' : o)}
                    className="w-10 h-10 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: gardenOrientation === o ? 'var(--ink)' : 'var(--surface)',
                      color:      gardenOrientation === o ? '#fff' : 'var(--muted)',
                      border:     `1px solid ${gardenOrientation === o ? 'var(--ink)' : 'var(--border)'}`,
                    }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={secSty}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Notes</h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          className={inputCls} style={{ ...inputSty, resize: 'vertical', fontFamily: 'var(--font-body)' }}