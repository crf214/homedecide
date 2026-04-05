// src/lib/scoring.ts
import type { Criterion, Rating, Formula, ScoreBreakdown } from '@/types'

export function normalizeValue(value: number, ratingType: 'num' | 'star'): number {
  if (ratingType === 'star') return (value / 5) * 100
  return (value / 10) * 100
}

export function calcScore(
  criteria: Criterion[],
  ratings: Rating[],
  formula: Formula,
  userId: string
): ScoreBreakdown {
  const ratingMap = new Map(
    ratings
      .filter(r => r.userId === userId)
      .map(r => [r.criterionId, r])
  )

  const requiredCount = criteria.filter(c => c.required).length
  let weightedSum = 0
  let totalWeight = 0
  let ratedCount = 0
  const byCriterion: Record<string, number | null> = {}
  const byCategorySum: Record<string, { sum: number; weight: number; count: number }> = {}

  for (const c of criteria) {
    const rating = ratingMap.get(c.id)
    const val = rating?.value

    if (val != null) {
      const normalised = normalizeValue(val, c.ratingType)
      const weighted = normalised * c.weight
      weightedSum += weighted
      totalWeight += c.weight
      ratedCount++
      byCriterion[c.id] = Math.round(normalised)

      if (!byCategorySum[c.category]) {
        byCategorySum[c.category] = { sum: 0, weight: 0, count: 0 }
      }
      byCategorySum[c.category].sum += weighted
      byCategorySum[c.category].weight += c.weight
      byCategorySum[c.category].count++
    } else {
      byCriterion[c.id] = null
    }
  }

  // Need at least 3 required criteria rated
  const ratedRequired = criteria
    .filter(c => c.required)
    .filter(c => ratingMap.get(c.id)?.value != null).length

  if (ratedRequired < Math.min(3, requiredCount) || totalWeight === 0) {
    return { total: null, byCategory: {}, byCriterion, ratedCount, requiredCount }
  }

  const raw = weightedSum / totalWeight
  const total = Math.round((raw / 100) * formula.normalise)

  const byCategory: Record<string, number | null> = {}
  for (const [cat, { sum, weight }] of Object.entries(byCategorySum)) {
    if (weight > 0) {
      byCategory[cat] = Math.round((sum / weight / 100) * formula.normalise)
    }
  }

  return { total, byCategory, byCriterion, ratedCount, requiredCount }
}

export function scoreColor(score: number | null, normalise = 100): string {
  if (score === null) return 'text-stone-400'
  const pct = (score / normalise) * 100
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 45) return 'text-amber-600'
  return 'text-red-500'
}

export function scoreBg(score: number | null, normalise = 100): string {
  if (score === null) return 'bg-stone-100 text-stone-500'
  const pct = (score / normalise) * 100
  if (pct >= 70) return 'bg-emerald-50 text-emerald-700'
  if (pct >= 45) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', CHF: '₣',
}

export const FX_RATES: Record<string, number> = {
  GBP: 1, USD: 1.27, EUR: 1.17, CHF: 1.13,
}

export function formatPrice(
  price: number,
  fromCurrency: string,
  toCurrency: string
): string {
  const inTarget = price * (FX_RATES[toCurrency] / FX_RATES[fromCurrency])
  return CURRENCY_SYMBOLS[toCurrency] + Math.round(inTarget).toLocaleString('en-GB')
}
