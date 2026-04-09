// src/lib/neighbourhoodColor.ts

const PALETTE = [
  { background: '#E8F4FD', color: '#1A5276' }, // soft blue
  { background: '#E9F7EF', color: '#1D6A3A' }, // soft green
  { background: '#FEF9E7', color: '#7D6608' }, // soft amber
  { background: '#FDEBD0', color: '#784212' }, // soft orange
  { background: '#F4ECF7', color: '#6C3483' }, // soft purple
  { background: '#FDEDEC', color: '#922B21' }, // soft red
  { background: '#E8F8F5', color: '#0E6655' }, // soft teal
  { background: '#EBF5FB', color: '#154360' }, // soft indigo
  { background: '#FDF2F8', color: '#76448A' }, // soft pink
  { background: '#F0F3F4', color: '#2C3E50' }, // soft slate
]

/**
 * Returns a consistent background + text colour pair for a neighbourhood name.
 * Only the main area is used for hashing so "Chelsea" and "Chelsea · World's End"
 * always resolve to the same colour.
 */
export function getNeighbourhoodColor(neighbourhood: string): { background: string; color: string } {
  // Strip sub-area if the full string was accidentally passed
  const main = neighbourhood.split('·')[0].trim()
  let hash = 0
  for (let i = 0; i < main.length; i++) {
    hash += main.charCodeAt(i)
  }
  return PALETTE[hash % PALETTE.length]
}

/** Shared inline style for neighbourhood pills — apply the spread plus the colour object. */
export const neighbourhoodPillStyle = {
  padding: '2px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  display: 'inline-block' as const,
  whiteSpace: 'nowrap' as const,
}
