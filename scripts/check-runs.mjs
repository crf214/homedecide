import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const ENV = process.env.ENVFILE || new URL('../.env', import.meta.url).pathname
for (const line of readFileSync(ENV, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
}

const p = new PrismaClient()
const rows = await p.watchedListing.findMany({ orderBy: { firstSeenAt: 'asc' } })
console.log('total rows:', rows.length)
if (rows.length) {
  const up = rows.map((r) => +r.updatedAt)
  console.log('latest updatedAt (last run):', new Date(Math.max(...up)).toISOString())
  console.log('rows with alertedAt:', rows.filter((r) => r.alertedAt).length)
  console.log('\ndistinct firstSeenAt (when each listing first recorded):')
  ;[...new Set(rows.map((r) => new Date(+r.firstSeenAt).toISOString()))].sort().forEach((t) => console.log('  ', t))
  console.log('\ndistinct updatedAt:')
  ;[...new Set(rows.map((r) => new Date(+r.updatedAt).toISOString()))].sort().forEach((t) => console.log('  ', t))
}
await p.$disconnect()
