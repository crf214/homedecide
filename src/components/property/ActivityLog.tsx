'use client'
// src/components/property/ActivityLog.tsx
import { useState } from 'react'

interface LogEntry {
  id: string
  userName: string
  actionType: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function describe(entry: LogEntry): string {
  const f = entry.fieldName ?? ''
  const old = entry.oldValue
  const next = entry.newValue
  switch (entry.actionType) {
    case 'property_updated':
      return `updated ${f}${old ? ` from "${old}"` : ''} to "${next ?? '—'}"`
    case 'rated':
      return `rated ${f}: ${old ?? '—'} → ${next ?? '—'}`
    case 'document_uploaded':
      return `uploaded ${f}`
    case 'document_deleted':
      return `deleted document ${f}`
    case 'shared':
      return `shared with ${f}`
    case 'unshared':
      return `removed sharing with ${f}`
    default:
      return entry.actionType
  }
}

export default function ActivityLog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<LogEntry[] | null>(null)

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (entries !== null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/activity`)
      const json = await res.json()
      setEntries(json.data ?? [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="activity-log" className="mt-8">
      <button
        onClick={toggle}
        className="text-xs underline"
        style={{ color: 'var(--muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {open ? 'Hide history' : 'History'}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Activity history
            </span>
          </div>

          {loading && (
            <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
              Loading history…
            </div>
          )}

          {!loading && entries !== null && entries.length === 0 && (
            <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
              No activity recorded yet
            </div>
          )}

          {!loading && entries !== null && entries.length > 0 && (
            <div>
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="px-4 py-3"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{entry.userName}</span>
                      {' '}
                      <span style={{ color: 'var(--muted)' }}>{describe(entry)}</span>
                    </div>
                    <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '12px' }}>
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
