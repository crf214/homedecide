// src/app/api/cron/check-listings/route.ts
// Daily watcher: fetch each source, diff against what we've seen, email new listings.
// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SCRAPERS, type ScrapedListing } from '@/lib/scrapers'
import { sendListingAlert, type AlertGroup } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary: Array<Record<string, unknown>> = []
  const alertGroups: AlertGroup[] = []

  for (const scraper of SCRAPERS) {
    let listings: ScrapedListing[]
    try {
      listings = await scraper.fetchListings()
    } catch (err) {
      summary.push({ source: scraper.source, error: String(err) })
      continue
    }

    const existing = await prisma.watchedListing.findMany({
      where: { source: scraper.source },
      select: { externalId: true },
    })
    const known = new Set(existing.map((e) => e.externalId))
    const isFirstRun = known.size === 0
    const fresh = listings.filter((l) => !known.has(l.externalId))

    // Record/refresh every current listing. On the very first run we mark
    // everything as already-alerted so we establish a baseline silently
    // instead of emailing all existing listings on day one.
    for (const l of listings) {
      await prisma.watchedListing.upsert({
        where: {
          source_externalId: { source: scraper.source, externalId: l.externalId },
        },
        create: {
          source: scraper.source,
          externalId: l.externalId,
          title: l.title,
          area: l.area,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          priceText: l.priceText,
          url: l.url,
          desc: l.desc,
          alertedAt: isFirstRun ? new Date() : null,
        },
        update: {
          title: l.title,
          area: l.area,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          priceText: l.priceText,
          url: l.url,
          desc: l.desc,
        },
      })
    }

    summary.push({
      source: scraper.source,
      total: listings.length,
      new: isFirstRun ? 0 : fresh.length,
      seeded: isFirstRun ? listings.length : 0,
    })

    if (!isFirstRun && fresh.length > 0) {
      alertGroups.push({ source: scraper.source, label: scraper.label, listings: fresh })
    }
  }

  let emailed = false
  if (alertGroups.length > 0) {
    await sendListingAlert(alertGroups)
    emailed = true
    const now = new Date()
    for (const g of alertGroups) {
      for (const l of g.listings) {
        await prisma.watchedListing.update({
          where: {
            source_externalId: { source: g.source, externalId: l.externalId },
          },
          data: { alertedAt: now },
        })
      }
    }
  }

  return NextResponse.json({ ok: true, emailed, summary })
}
