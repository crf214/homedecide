'use client'
// src/components/shared/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',            label: 'Overview',    icon: '◈' },
  { href: '/dashboard/properties', label: 'Properties',  icon: '⌂' },
  { href: '/dashboard/evaluate',   label: 'Evaluate',    icon: '✦' },
  { href: '/dashboard/criteria',   label: 'Criteria',    icon: '⊞' },
  { href: '/dashboard/formula',    label: 'Formula',     icon: '∑' },
  { href: '/dashboard/rankings',   label: 'Rankings',    icon: '◉' },
]

interface Props {
  user: { email: string; name?: string | null }
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>

      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>HomeDecide</span>
        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>England & Wales</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: active ? '#fff' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--muted)',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                fontWeight: active ? 500 : 400,
              }}>
              <span style={{ fontSize: 15, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="px-3">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
            {user.name ?? user.email}
          </div>
          {user.name && (
            <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user.email}</div>
          )}
        </div>
        <button onClick={logout}
          className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white"
          style={{ color: 'var(--muted)' }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
