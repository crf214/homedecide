'use client'
// src/app/dashboard/properties/new/page.tsx
import PropertyForm from '@/components/property/PropertyForm'

export default function NewPropertyPage() {
  return (
    <div className="p-8 max-w-3xl fade-up">
      <h1 className="font-display text-3xl mb-8" style={{ color: 'var(--ink)' }}>Add property</h1>
      <PropertyForm />
    </div>
  )
}
