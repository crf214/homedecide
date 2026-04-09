// src/lib/activityLog.ts
import { prisma } from '@/lib/prisma'

export function logActivity(params: {
  propertyId: string
  userId: string
  userName: string
  actionType: string
  fieldName?: string
  oldValue?: string
  newValue?: string
}): void {
  // Fire and forget — never awaited, never blocks the caller
  void prisma.propertyActivityLog.create({ data: params }).catch(() => {})
}
