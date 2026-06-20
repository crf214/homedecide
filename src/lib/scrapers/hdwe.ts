// src/lib/scrapers/hdwe.ts
// Howard de Walden Estate — residential properties to rent.
// Listings are embedded in the static HTML as a JSON array inside
//   <span class="property-blocks-json hidden">[ ... ]</span>
// so a plain fetch + parse is enough (no headless browser required).
import type { Scraper, ScrapedListing } from './types'

const BASE = 'https://www.hdwe.co.uk'
const PAGE = `${BASE}/our-properties/residential-homes`

const JSON_BLOCK = /<span class="property-blocks-json hidden">([\s\S]*?)<\/span>/

interface HdweItem {
  itemid: number | string
  itemtitle?: string
  area?: string
  bedrooms?: string | number
  bathrooms?: string | number
  priceper?: string
  priceperlabel?: string
  desc?: string
  link?: string
}

function toInt(v: unknown): number | null {
  const n = parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : null
}

export const hdweResidential: Scraper = {
  source: 'hdwe-residential',
  label: 'Howard de Walden — Residential to rent',

  async fetchListings(): Promise<ScrapedListing[]> {
    const res = await fetch(PAGE, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; HomeDecideListingWatcher/1.0; +personal-use)',
        Accept: 'text/html',
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`HDWE fetch failed: ${res.status} ${res.statusText}`)
    }

    const html = await res.text()
    const match = html.match(JSON_BLOCK)
    if (!match) {
      throw new Error(
        'HDWE: listings JSON block not found — page structure may have changed'
      )
    }

    let items: HdweItem[]
    try {
      items = JSON.parse(match[1])
    } catch {
      throw new Error('HDWE: failed to parse listings JSON')
    }

    return items.map((item) => {
      const link = item.link
        ? item.link.startsWith('http')
          ? item.link
          : BASE + item.link
        : PAGE
      const priceText =
        item.priceper && item.priceperlabel
          ? `£${item.priceper} per ${item.priceperlabel}`
          : item.priceper
            ? `£${item.priceper}`
            : null

      return {
        externalId: String(item.itemid),
        title: item.itemtitle?.trim() || 'Untitled listing',
        area: item.area?.trim() || null,
        bedrooms: toInt(item.bedrooms),
        bathrooms: toInt(item.bathrooms),
        priceText,
        url: link,
        desc: item.desc?.trim() || null,
      }
    })
  },
}
