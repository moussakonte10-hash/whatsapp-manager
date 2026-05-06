'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectionStatus } from './ConnectionStatus'

const navItems = [
  { href: '/',            icon: '⬛', emoji: '🏠', label: 'Dashboard' },
  { href: '/groups',      icon: '⬛', emoji: '👥', label: 'Groupes' },
  { href: '/communities', icon: '⬛', emoji: '🌐', label: 'Communautés' },
  { href: '/messages',    icon: '⬛', emoji: '✉️', label: 'Messages' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#13151f',
        borderRight: '1px solid #1e2233',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            📱
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>WhatsApp</div>
            <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 500 }}>Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5568', letterSpacing: 1, padding: '0 8px', marginBottom: 8, textTransform: 'uppercase' }}>
          Navigation
        </div>
        {navItems.map(({ href, emoji, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span>{label}</span>
              {active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#25D366',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status en bas */}
      <div
        style={{
          borderTop: '1px solid #1e2233',
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5568', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
          WhatsApp
        </div>
        <ConnectionStatus />
      </div>
    </aside>
  )
}
