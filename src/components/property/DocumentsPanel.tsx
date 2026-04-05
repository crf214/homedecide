'use client'
import { useState, useEffect, useRef } from 'react'

interface PropertyDocument {
  id: string
  filename: string
  fileUrl: string
  fileSize: number | null
  uploadedAt: string
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPanel({ propertyId }: { propertyId: string }) {
  const [docs, setDocs] = useState<PropertyDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    const res = await fetch(`/api/properties/${propertyId}/documents`)
    if (res.ok) {
      const j = await res.json()
      setDocs(j.data)
    }
  }

  useEffect(() => { loadDocs() }, [propertyId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/properties/${propertyId}/documents/upload`, {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) {
          const j = await res.json()
          setError(j.error ?? 'Upload failed')
          break
        }
      }
      await loadDocs()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Remove this document?')) return
    await fetch(`/api/properties/${propertyId}/documents?docId=${docId}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div className="mt-8 rounded-2xl p-5" style={{ border: '1px solid var(--border)', background: '#fff' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Documents
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--ink)', color: '#fff', opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
          {error}
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No documents uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                  {doc.filename}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {formatFileSize(doc.fileSize)}
                  {doc.fileSize ? ' · ' : ''}
                  {new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ border: '1px solid var(--border)', color: 'var(--blue-text)', background: 'var(--surface)' }}>
                Download
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: 'var(--red-soft)', color: 'var(--red-text)' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" multiple onChange={handleUpload} className="hidden" />
    </div>
  )
}
