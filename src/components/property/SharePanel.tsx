'use client'
// src/components/property/SharePanel.tsx
import { useState } from 'react'

export default function SharePanel({ propertyId }: { propertyId: string }) {
  const [email,   setEmail]   = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [open,    setOpen]    = useState(false)

  async function share() {
    if (!email.trim()) return
    setStatus('saving')
    const res = await fetch(`/api/properties/${propertyId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), canEdit }),
    })
    const json = await res.json()
    if (!res.ok) {
      setStatus('error'); setMessage(json.error)
    } else {
      setStatus('success'); setMessage(`Shared with ${email.trim()}`)
      setEmail(''); setCanEdit(false)
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left"
        style={{ color: 'var(--muted)', fontSize: 13 }}>
        <span>{open ? '▾' : '▸'}</span>
        Share this property
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Share with your spouse or partner so they can view and rate this property independently.
          </p>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', minWidth: 200 }}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
              <input type="checkbox" checked={canEdit} onChange={e => setCanEdit(e.target.checked)} />
              Can edit details
            </label>
            <button onClick={share} disabled={status === 'saving' || !email.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity"
              style={{ background: 'var(--ink)', color: '#fff', opacity: status === 'saving' ? 0.6 : 1 }}>
              {status === 'saving' ? 'Sharing…' : 'Share'}
            </button>
          </div>
          {status === 'success' && (
            <p className="text-sm" style={{ color: 'var(--green-text)' }}>✓ {message}</p>
          )}
          {status === 'error' && (
            <p className="text-sm" style={{ color: 'var(--red-text)' }}>{message}</p>
          )}
        </div>
      )}
    </div>
  )
}
