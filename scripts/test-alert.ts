// scripts/test-alert.ts
// One-off: fetch real HDWE listings and email a few as a delivery test.
// Run with: npx tsx scripts/test-alert.ts
// Does NOT write to the database.
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local (a standalone script doesn't get Next.js env loading).
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) {
      let v = m[2].trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1)
      process.env[m[1]] = v
    }
  }
} catch {
  console.warn('Could not read .env.local — relying on existing environment')
}

import { hdweResidential } from '../src/lib/scrapers/hdwe'
import { sendListingAlert } from '../src/lib/email'

async function main() {
  for (const key of ['RESEND_API_KEY', 'ALERT_EMAIL_TO', 'ALERT_EMAIL_FROM']) {
    console.log(`${key}: ${process.env[key] ? 'set ✓' : 'MISSING ✗'}`)
  }

  console.log('\nFetching live HDWE listings…')
  const listings = await hdweResidential.fetchListings()
  console.log(`Fetched ${listings.length} listings. Sending the first 3 as a test.`)

  const sample = listings.slice(0, 3)
  await sendListingAlert([
    { source: hdweResidential.source, label: hdweResidential.label, listings: sample },
  ])
  console.log(`\n✓ Sent to ${process.env.ALERT_EMAIL_TO}. Check your inbox (and spam).`)
}

main().catch((err) => {
  console.error('\n✗ Test failed:', err.message || err)
  process.exit(1)
})
