'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BuildingsPanel from '@/components/property/BuildingsPanel'

interface ListingLink {
  label: string
  url: string
}

const MULTI_BUILDING_TYPES = ['Detached House', 'Land', 'Estate', 'Farm']

interface Props {
  property?: {
    id: string
    address: string
    street?: string | null
    postcode?: string | null
    price?: number | null
    currency: string
    listingUrl?: string | null
    mapsUrl?: string | null
    listingLinks?: ListingLink[] | null
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
    neighbourhood?: string | null
    neighbourhoodSub?: string | null
    propertyType?: string | null
    isNewBuild?: boolean | null
    floorInBuilding?: number | null
    totalFloorsInBuilding?: number | null
    isTopFloor?: boolean | null
    hasLift?: boolean | null
  }
}

const PROPERTY_TYPES = ['Detached House', 'Semi Detached House', 'Terraced / Row House', 'Townhouse', 'Apartment', 'Land', 'Estate', 'Farm']
const CURRENCIES   = ['GBP', 'USD', 'EUR', 'CHF']
const TENURES      = ['Freehold', 'Leasehold', 'Share of freehold', 'Commonhold']
const EPCS         = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const GARDEN_TYPES = ['garden', 'terrace', 'balcony', 'courtyard', 'roof terrace', 'none']
const PRIVACY      = ['private', 'shared', 'none']
const MAINTENANCE  = ['low', 'medium', 'high']

const iCls = "w-full px-4 py-2.5 rounded-xl text-sm"
const iSty = { border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)' }
const lSty: React.CSSProperties = { color: 'var(--muted)', fontSize: 12, display: 'block', marginBottom: 4, marginTop: 10 }
const sSty: React.CSSProperties = { borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {([true, false] as boolean[]).map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="px-4 py-1.5 rounded-lg text-sm"
          style={{
            background: value === v ? 'var(--ink)' : 'var(--surface)',
            color: value === v ? '#fff' : 'var(--muted)',
            border: `1px solid ${value === v ? 'var(--ink)' : 'var(--border)'}`,
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
      if (newUnit === 'sqm' && unit === 'sqft') onValue((v / 10.764).toFixed(1))
      if (newUnit === 'sqft' && unit === 'sqm') onValue((v * 10.764).toFixed(0))
    }
    onUnit(newUnit)
  }
  return (
    <div>
      <label style={lSty}>{label}</label>
      <div className="flex gap-2">
        <input type="number" value={value} onChange={e => onValue(e.target.value)}
          placeholder="0" min="0" className={iCls} style={{ ...iSty, flex: 1 }} />
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {['sqft', 'sqm'].map(u => (
            <button key={u} type="button" onClick={() => switchUnit(u)}
              className="px-3 py-2 text-xs font-medium"
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
  const [address, setAddress] = useState(property?.address ?? '')
  const [street, setStreet] = useState(property?.street ?? '')
  const [postcode, setPostcode] = useState(property?.postcode ?? '')
  const [mapsUrl, setMapsUrl] = useState(property?.mapsUrl ?? '')
  const [price, setPrice] = useState(property?.price?.toString() ?? '')
  const [currency, setCurrency] = useState(property?.currency ?? 'GBP')
  const [listingUrl] = useState(property?.listingUrl ?? '')
  const [listingLinks, setListingLinks] = useState<ListingLink[]>(
    property?.listingLinks ?? []
  )
  const [tenure, setTenure] = useState(property?.tenure ?? 'Freehold')
  const [epc, setEpc] = useState(property?.epc ?? 'C')
  const [notes, setNotes] = useState(property?.notes ?? '')
  const [photos, setPhotos] = useState<string[]>(property?.photos ?? [])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [internalArea, setInternalArea] = useState(property?.internalArea?.toString() ?? '')
  const [internalAreaUnit, setInternalAreaUnit] = useState(property?.internalAreaUnit ?? 'sqft')
  const [bedrooms, setBedrooms] = useState(property?.bedrooms?.toString() ?? '')
  const [bathrooms, setBathrooms] = useState(property?.bathrooms?.toString() ?? '')
  const [livingRooms, setLivingRooms] = useState(property?.livingRooms?.toString() ?? '')
  const [hasOffice, setHasOffice] = useState(property?.hasOffice ?? false)
  const [hasGym, setHasGym] = useState(property?.hasGym ?? false)
  const [hasBasement, setHasBasement] = useState(property?.hasBasement ?? false)
  const [gardenType, setGardenType] = useState(property?.gardenType ?? '')
  const [gardenSize, setGardenSize] = useState(property?.gardenSize?.toString() ?? '')
  const [gardenSizeUnit, setGardenSizeUnit] = useState(property?.gardenSizeUnit ?? 'sqft')
  const [gardenOrientation, setGardenOrientation] = useState(property?.gardenOrientation ?? '')
  const [gardenPrivacy, setGardenPrivacy] = useState(property?.gardenPrivacy ?? '')
  const [gardenMaintenance, setGardenMaintenance] = useState(property?.gardenMaintenance ?? '')
  const [neighbourhood, setNeighbourhood] = useState(property?.neighbourhood ?? '')
  const [neighbourhoodSub, setNeighbourhoodSub] = useState(property?.neighbourhoodSub ?? '')
  const [propertyType, setPropertyType] = useState(property?.propertyType ?? '')
  const [isNewBuild, setIsNewBuild] = useState(property?.isNewBuild ?? false)
  const [floorInBuilding, setFloorInBuilding] = useState(property?.floorInBuilding?.toString() ?? '')
  const [totalFloorsInBuilding, setTotalFloorsInBuilding] = useState(property?.totalFloorsInBuilding?.toString() ?? '')
  const [isTopFloor, setIsTopFloor] = useState(property?.isTopFloor ?? false)
  const [hasLift, setHasLift] = useState(property?.hasLift ?? false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (fileRef.current) fileRef.current.value = ''

    if (isEdit && property?.id) {
      // Edit mode: upload immediately, all files at once
      setUploadingPhotos(true)
      try {
        const fd = new FormData()
        files.forEach(f => fd.append('photos', f))
        const res = await fetch(`/api/properties/${property.id}/photos`, { method: 'POST', body: fd })
        if (res.ok) {
          const j = await res.json()
          setPhotos(j.data)
        }
      } finally {
        setUploadingPhotos(false)
      }
    } else {
      // New property: collect locally, upload on save
      setNewPhotoFiles(prev => [...prev, ...files])
      files.forEach(f => {
        const r = new FileReader()
        r.onload = ev => setPhotos(prev => [...prev, ev.target!.result as string])
        r.readAsDataURL(f)
      })
    }
  }

  async function removePhoto(idx: number) {
    const src = photos[idx]
    if (isEdit && property?.id && !src.startsWith('data:')) {
      await fetch(`/api/properties/${property.id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: src }),
      })
    } else {
      const ec = (property?.photos ?? []).length
      if (idx >= ec) setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx - ec))
    }
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function setThumbnail(idx: number) {
    if (idx === 0) return
    const reordered = [photos[idx], ...photos.filter((_, i) => i !== idx)]
    setPhotos(reordered)
    if (isEdit && property?.id) {
      await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: reordered.filter(p => !p.startsWith('data:')) }),
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) { setError('Display name is required'); return }
    setError(''); setSaving(true)
    try {
      const body = {
        address: address.trim(),
        street: street.trim() || null,
        postcode: postcode.trim() || null,
        price: price ? parseFloat(price) : null,
        currency,
        listingUrl: listingUrl.trim() || null,
        mapsUrl: mapsUrl.trim() || null,
        listingLinks: listingLinks.filter(l => l.url.trim()),
        tenure: tenure || null,
        epc: epc || null,
        notes: notes.trim() || null,
        photos: isEdit ? photos.filter(p => !p.startsWith('data:')) : [],
        internalArea: internalArea ? parseFloat(internalArea) : null,
        internalAreaUnit,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        livingRooms: livingRooms ? parseInt(livingRooms) : null,
        hasOffice,
        hasGym,
        hasBasement,
        gardenType: gardenType || null,
        gardenSize: gardenSize ? parseFloat(gardenSize) : null,
        gardenSizeUnit,
        gardenOrientation: gardenOrientation || null,
        gardenPrivacy: gardenPrivacy || null,
        gardenMaintenance: gardenMaintenance || null,
        neighbourhood: neighbourhood.trim() || null,
        neighbourhoodSub: neighbourhoodSub.trim() || null,
        propertyType: propertyType || null,
        isNewBuild,
        floorInBuilding: floorInBuilding ? parseInt(floorInBuilding) : null,
        totalFloorsInBuilding: totalFloorsInBuilding ? parseInt(totalFloorsInBuilding) : null,
        isTopFloor,
        hasLift,
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
      if (!isEdit && newPhotoFiles.length > 0 && propId) {
        const fd = new FormData()
        newPhotoFiles.forEach(f => fd.append('photos', f))
        await fetch(`/api/properties/${propId}/photos`, { method: 'POST', body: fd })
      }
      router.push(`/dashboard/properties/${propId}`)
      router.refresh()
    } catch {
      setError('Something went wrong.')
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

  async function handlePropertyTypeChange(newType: string) {
    const resultingType = propertyType === newType ? '' : newType
    const label = resultingType ? `"${resultingType}"` : 'no type'
    if (!confirm(`Change property type to ${label}?`)) return

    const wasMultiBuilding = MULTI_BUILDING_TYPES.includes(propertyType)
    const willBeMultiBuilding = MULTI_BUILDING_TYPES.includes(resultingType)

    if (isEdit && property?.id && wasMultiBuilding && !willBeMultiBuilding) {
      if (!confirm('This property type does not support multiple buildings. All building records will be permanently deleted. Continue?')) return
      await fetch(`/api/properties/${property.id}/buildings`, { method: 'DELETE' })
    }

    setPropertyType(resultingType)
  }

  return (
    <form id="property-form" onSubmit={handleSubmit}>
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={lSty}>Street address</label>
          <input type="text" value={street} onChange={e => setStreet(e.target.value)}
            className={iCls} style={iSty} placeholder="14 Kensington Gardens" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={lSty}>Postcode</label>
            <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)}
              className={iCls} style={iSty} placeholder="W8 4PT" />
          </div>
          <div>
            <label style={lSty}>Display name *</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className={iCls} style={iSty} placeholder="Short name" required />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label style={lSty}>Google Maps link</label>
        <input type="url" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)}
          className={iCls} style={iSty} placeholder="Paste a Google Maps share link" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div>
          <label style={lSty}>Area / neighbourhood</label>
          <input type="text" value={neighbourhood} onChange={e => setNeighbourhood(e.target.value)}
            className={iCls} style={iSty} placeholder="e.g. Chelsea, Notting Hill" />
        </div>
        <div>
          <label style={lSty}>Sub-area</label>
          <input type="text" value={neighbourhoodSub} onChange={e => setNeighbourhoodSub(e.target.value)}
            className={iCls} style={iSty} placeholder="e.g. World's End, Sloane Square" />
        </div>
      </div>

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Property type</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {PROPERTY_TYPES.map(t => (
            <button key={t} type="button" onClick={() => handlePropertyTypeChange(t)}
              className="px-4 py-1.5 rounded-lg text-sm"
              style={{
                background: propertyType === t ? 'var(--ink)' : 'var(--surface)',
                color: propertyType === t ? '#fff' : 'var(--muted)',
                border: `1px solid ${propertyType === t ? 'var(--ink)' : 'var(--border)'}`,
              }}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 mb-1">
          <div>
            <label style={lSty}>New build?</label>
            <Toggle value={isNewBuild ?? false} onChange={setIsNewBuild} />
          </div>
        </div>
        {propertyType === 'Apartment' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <label style={lSty}>Floor in building</label>
              <input type="number" value={floorInBuilding} onChange={e => setFloorInBuilding(e.target.value)}
                className={iCls} style={iSty} placeholder="e.g. 3" min="0" />
            </div>
            <div>
              <label style={lSty}>Total floors in building</label>
              <input type="number" value={totalFloorsInBuilding} onChange={e => setTotalFloorsInBuilding(e.target.value)}
                className={iCls} style={iSty} placeholder="e.g. 8" min="1" />
            </div>
            <div>
              <label style={lSty}>Top floor?</label>
              <Toggle value={isTopFloor ?? false} onChange={setIsTopFloor} />
            </div>
            <div>
              <label style={lSty}>Has lift?</label>
              <Toggle value={hasLift ?? false} onChange={setHasLift} />
            </div>
          </div>
        )}
      </div>

      {isEdit && property?.id && MULTI_BUILDING_TYPES.includes(propertyType) && (
        <div style={sSty}>
          <BuildingsPanel propertyId={property.id} />
        </div>
      )}

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Price & tenure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label style={lSty}>Asking price</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className={iCls} style={iSty} placeholder="350000" min="0" />
          </div>
          <div>
            <label style={lSty}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={iCls} style={iSty}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lSty}>Tenure</label>
            <select value={tenure} onChange={e => setTenure(e.target.value)} className={iCls} style={iSty}>
              {TENURES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lSty}>EPC rating</label>
            <select value={epc} onChange={e => setEpc(e.target.value)} className={iCls} style={iSty}>
              {EPCS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between" style={{ marginTop: 10, marginBottom: 4 }}>
            <label style={{ ...lSty, marginTop: 0, marginBottom: 0 }}>Listing links</label>
            <button
              type="button"
              onClick={() => setListingLinks(prev => [...prev, { label: '', url: '' }])}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}>
              + Add link
            </button>
          </div>
          {listingLinks.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>No listing links added yet.</p>
          )}
          {listingLinks.map((link, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <input
                type="text"
                value={link.label}
                onChange={e => setListingLinks(prev => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                className={iCls}
                style={{ ...iSty, flex: '0 0 160px' }}
                placeholder="e.g. Rightmove" />
              <input
                type="url"
                value={link.url}
                onChange={e => setListingLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                className={iCls}
                style={{ ...iSty, flex: 1 }}
                placeholder="https://..." />
              <button
                type="button"
                onClick={() => setListingLinks(prev => prev.filter((_, j) => j !== i))}
                className="px-3 rounded-xl text-sm flex-shrink-0"
                style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Size & rooms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <AreaInput label="Internal area" value={internalArea} unit={internalAreaUnit}
            onValue={setInternalArea} onUnit={setInternalAreaUnit} />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Bedrooms', val: bedrooms, set: setBedrooms },
            { label: 'Bathrooms', val: bathrooms, set: setBathrooms },
            { label: 'Living rooms', val: livingRooms, set: setLivingRooms },
          ].map(f => (
            <div key={f.label}>
              <label style={lSty}>{f.label}</label>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                className={iCls} style={iSty} placeholder="0" min="0" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Office space', val: hasOffice, set: setHasOffice },
            { label: 'Gym space', val: hasGym, set: setHasGym },
            { label: 'Basement', val: hasBasement, set: setHasBasement },
          ].map(f => (
            <div key={f.label}>
              <label style={lSty}>{f.label}</label>
              <Toggle value={f.val ?? false} onChange={f.set} />
            </div>
          ))}
        </div>
      </div>

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Garden & outdoor space</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label style={lSty}>Type</label>
            <select value={gardenType} onChange={e => setGardenType(e.target.value)} className={iCls} style={iSty}>
              <option value="">Select…</option>
              {GARDEN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={lSty}>Privacy</label>
            <select value={gardenPrivacy} onChange={e => setGardenPrivacy(e.target.value)} className={iCls} style={iSty}>
              <option value="">Select…</option>
              {PRIVACY.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={lSty}>Maintenance</label>
            <select value={gardenMaintenance} onChange={e => setGardenMaintenance(e.target.value)} className={iCls} style={iSty}>
              <option value="">Select…</option>
              {MAINTENANCE.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
        </div>
        {hasGarden && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AreaInput label="Garden size" value={gardenSize} unit={gardenSizeUnit}
              onValue={setGardenSize} onUnit={setGardenSizeUnit} />
            <div>
              <label style={lSty}>Orientation</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ORIENTATIONS.map(o => (
                  <button key={o} type="button"
                    onClick={() => setGardenOrientation(gardenOrientation === o ? '' : o)}
                    className="w-10 h-10 rounded-lg text-xs font-medium"
                    style={{
                      background: gardenOrientation === o ? 'var(--ink)' : 'var(--surface)',
                      color: gardenOrientation === o ? '#fff' : 'var(--muted)',
                      border: `1px solid ${gardenOrientation === o ? 'var(--ink)' : 'var(--border)'}`,
                    }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Notes</h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          className={iCls} style={{ ...iSty, resize: 'vertical', fontFamily: 'var(--font-body)' }}
          placeholder="First impressions, street feel, building condition..." />
      </div>

      <div style={sSty}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Photos</h3>
        {uploadingPhotos && (
          <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            Uploading photos…
          </div>
        )}
        <div className="flex flex-wrap gap-3 mb-2">
          {photos.map((src, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <img src={src} alt="" className="w-28 h-24 object-cover rounded-xl"
                style={{ border: i === 0 ? '2px solid var(--ink)' : '1px solid var(--border)' }} />
              {/* Thumbnail badge — always visible on first photo */}
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-md font-medium"
                  style={{ background: 'var(--ink)', color: '#fff', fontSize: 10, padding: '2px 6px' }}>
                  Thumbnail
                </span>
              )}
              {/* Set as thumbnail — visible on hover for non-first photos */}
              {i !== 0 && (
                <button type="button" onClick={() => setThumbnail(i)}
                  className="absolute bottom-1.5 left-1.5 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 6px', border: 'none', cursor: 'pointer' }}>
                  Set thumbnail
                </button>
              )}
              {/* Remove */}
              <button type="button" onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs items-center justify-center hidden group-hover:flex"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()}
            disabled={uploadingPhotos}
            className="w-28 h-24 rounded-xl flex flex-col items-center justify-center gap-1 text-xs flex-shrink-0"
            style={{ border: '1.5px dashed var(--border)', color: 'var(--muted)', opacity: uploadingPhotos ? 0.5 : 1 }}>
            <span style={{ fontSize: 20 }}>+</span>
            Add photos
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {isEdit
            ? 'Photos upload immediately. Hover any photo to set it as thumbnail or remove it.'
            : 'Photos are saved when you submit the form. The first photo becomes the thumbnail.'}
        </p>
        <input ref={fileRef} type="file" multiple accept="image/*"
          onChange={handleFileChange} className="hidden" />
      </div>

      <div className="flex items-center gap-3 pt-6"
        style={{ borderTop: '1px solid var(--border)', marginTop: 24 }}>
        <button type="submit" disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--ink)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Cancel
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto px-5 py-3 rounded-xl text-sm"
            style={{ background: 'var(--red-soft)', color: 'var(--red-text)', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete property'}
          </button>
        )}
      </div>
    </form>
  )
}