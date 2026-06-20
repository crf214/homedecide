// src/lib/email.ts
import { Resend } from 'resend'
import type { ScrapedListing } from '@/lib/scrapers'

export interface AlertGroup {
  source: string
  label: string
  listings: ScrapedListing[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function listingRow(l: ScrapedListing): string {
  const bits = [
    l.bedrooms != null ? `${l.bedrooms} bed` : null,
    l.bathrooms != null ? `${l.bathrooms} bath` : null,
    l.priceText,
    l.area,
  ].filter(Boolean) as string[]

  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #eee;">
        <a href="${escapeHtml(l.url)}" style="font-size:16px;font-weight:600;color:#2563eb;text-decoration:none;">
          ${escapeHtml(l.title)}
        </a>
        <div style="margin-top:4px;color:#444;font-size:14px;">${escapeHtml(bits.join(' · '))}</div>
        ${l.desc ? `<div style="margin-top:2px;color:#888;font-size:13px;">${escapeHtml(l.desc)}</div>` : ''}
      </td>
    </tr>`
}

function buildHtml(groups: AlertGroup[]): string {
  const total = groups.reduce((n, g) => n + g.listings.length, 0)
  const sections = groups
    .map(
      (g) => `
      <h2 style="font-size:15px;color:#111;margin:24px 0 4px;">${escapeHtml(g.label)}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${g.listings.map(listingRow).join('')}
      </table>`
    )
    .join('')

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
    <h1 style="font-size:18px;margin:0 0 4px;">
      ${total} new listing${total === 1 ? '' : 's'}
    </h1>
    <p style="color:#666;font-size:13px;margin:0;">HomeDecide listing watcher</p>
    ${sections}
  </div>`
}

function buildText(groups: AlertGroup[]): string {
  const lines: string[] = []
  for (const g of groups) {
    lines.push(`\n${g.label}`)
    for (const l of g.listings) {
      const bits = [
        l.bedrooms != null ? `${l.bedrooms} bed` : null,
        l.bathrooms != null ? `${l.bathrooms} bath` : null,
        l.priceText,
        l.area,
      ].filter(Boolean)
      lines.push(`- ${l.title} (${bits.join(' · ')})\n  ${l.url}`)
    }
  }
  return lines.join('\n')
}

export async function sendListingAlert(groups: AlertGroup[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')

  const to = process.env.ALERT_EMAIL_TO
  if (!to) throw new Error('ALERT_EMAIL_TO is not set')

  const from = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev'
  const total = groups.reduce((n, g) => n + g.listings.length, 0)

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: to.split(',').map((s) => s.trim()),
    subject: `${total} new rental listing${total === 1 ? '' : 's'} — Marylebone`,
    html: buildHtml(groups),
    text: buildText(groups),
  })
  if (error) throw new Error(`Resend send failed: ${JSON.stringify(error)}`)
}
