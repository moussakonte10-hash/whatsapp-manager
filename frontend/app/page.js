'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

function StatCard({ label, value, icon, gradient, delay = 0 }) {
  return (
    <div
      className="stat-card animate-fade-in"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.12 }}>
        {icon}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          {label}
        </p>
        <p style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label, desc }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="card animate-fade-in"
        style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(37,211,102,0.12)',
          border: '1px solid rgba(37,211,102,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{label}</p>
          <p style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>{desc}</p>
        </div>
        <span style={{ marginLeft: 'auto', color: '#4a5568', fontSize: 18 }}>→</span>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ groups: 0, communities: 0, messages: 0 })
  const [history, setHistory] = useState([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [g, c, m] = await Promise.all([
        axios.get(`${API}/api/groups`),
        axios.get(`${API}/api/communities`),
        axios.get(`${API}/api/messages/history`),
      ])
      setStats({ groups: g.data.length, communities: c.data.length, messages: m.data.length })
      setHistory(m.data.slice(0, 6))
    } catch {}
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await axios.post(`${API}/api/groups/sync`)
      loadData()
    } catch (err) {
      alert('WhatsApp doit être connecté — scanne le QR code')
    } finally { setSyncing(false) }
  }

  const typeIcon = { community: '🌐', group: '👥', private: '👤' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>
            Bonjour 👋
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            Gérez vos groupes WhatsApp depuis un seul endroit
          </p>
        </div>
        <button className="btn-primary" onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
          {syncing ? 'Synchronisation…' : 'Sync WhatsApp'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="Groupes" value={stats.groups} icon="👥"
          gradient="linear-gradient(135deg, #1a4731, #0d2818)" delay={0} />
        <StatCard label="Communautés" value={stats.communities} icon="🌐"
          gradient="linear-gradient(135deg, #2d1b69, #1a0f3d)" delay={80} />
        <StatCard label="Messages envoyés" value={stats.messages} icon="✉️"
          gradient="linear-gradient(135deg, #1a2e4a, #0d1a2d)" delay={160} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Actions rapides */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#718096', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Actions rapides
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction href="/messages" icon="📤" label="Envoyer un message" desc="À un groupe, communauté ou contact" />
            <QuickAction href="/communities" icon="➕" label="Créer une communauté" desc="Grouper plusieurs groupes ensemble" />
            <QuickAction href="/groups" icon="👥" label="Voir mes groupes" desc={`${stats.groups} groupes synchronisés`} />
          </div>
        </div>

        {/* Historique récent */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#718096', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Activité récente
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#4a5568' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: 13 }}>Aucun message envoyé</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '14px 18px',
                    borderBottom: i < history.length - 1 ? '1px solid #1e2233' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(37,211,102,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                  }}>
                    {typeIcon[msg.type] || '💬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.target_name}
                    </p>
                    <p style={{ fontSize: 11, color: '#4a5568', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.message}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, color: '#4a5568', whiteSpace: 'nowrap' }}>
                    {new Date(msg.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
