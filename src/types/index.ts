// src/types/index.ts

export type RatingType = 'num' | 'star'
export type FormulaMode = 'weighted' | 'category'
export type Currency = 'GBP' | 'USD' | 'EUR' | 'CHF'

export interface User {
  id: string
  email: string
  name?: string | null
}

export interface Property {
  id: string
  userId: string
  address: string
  price?: number | null
  currency: Currency
  listingUrl?: string | null
  tenure?: string | null
  epc?: string | null
  notes?: string | null
  photos: string[]
  createdAt: string
  updatedAt: string
  // joined
  score?: number | null
  ratedCount?: number
  isShared?: boolean
  sharedBy?: string | null
}

export interface Criterion {
  id: string
  userId: string
  name: string
  category: string
  ratingType: RatingType
  weight: number
  description?: string | null
  required: boolean
  position: number
  isDefault: boolean
}

export interface Rating {
  id: string
  userId: string
  propertyId: string
  criterionId: string
  value?: number | null
  note?: string | null
}

export interface Formula {
  id: string
  userId: string
  mode: FormulaMode
  normalise: number
  config: Record<string, unknown>
}

export interface PropertyShare {
  id: string
  propertyId: string
  sharedById: string
  sharedWithId: string
  canEdit: boolean
}

// API response types
export interface ApiSuccess<T> {
  data: T
  error?: never
}
export interface ApiError {
  error: string
  data?: never
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Score calculation
export interface ScoreBreakdown {
  total: number | null
  byCategory: Record<string, number | null>
  byCriterion: Record<string, number | null>
  ratedCount: number
  requiredCount: number
}
