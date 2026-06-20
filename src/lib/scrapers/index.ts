// src/lib/scrapers/index.ts
// Registry of sources we watch. Add a new scraper here to start watching it.
import type { Scraper } from './types'
import { hdweResidential } from './hdwe'

export const SCRAPERS: Scraper[] = [hdweResidential]

export type { Scraper, ScrapedListing } from './types'
