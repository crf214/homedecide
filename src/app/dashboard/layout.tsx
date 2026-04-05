// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import Sidebar from '@/components/shared/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.userId) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ email: session.email!, name: session.name }} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
