// src/lib/scrapers/types.ts
// A normalised listing as produced by any source scraper.
export interface ScrapedListing {
  externalId: string          // stable per-listing id from the source (used for dedup)
  title: string
  area: string | null
  bedrooms: number | null
  bathrooms: number | null
  priceText: string | null    // human-readable, e.g. "£2,250.00 per week"
  url: string                 // absolute link to the listing
  desc: string | null
}

// A source we watch. Add more by implementing this and registering in index.ts.
export interface Scraper {
  source: string              // stable machine key, e.g. "hdwe-residential"
  label: string               // human label used in the alert email
  fetchListings(): Promise<ScrapedListing[]>
}
