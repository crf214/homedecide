'use client'
// src/components/property/HistoryLink.tsx
export default function HistoryLink() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent('open-activity-log'))
    // Delay scroll slightly so the panel has time to begin opening
    setTimeout(() => {
      document.getElementById('activity-log')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }
  return (
    <button
      onClick={handleClick}
      className="text-xs underline mt-0.5 block"
      style={{ color: 'var(--muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      History
    </button>
  )
}
