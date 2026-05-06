'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

function GroupCard({ group, index }) {
  const initials = group.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    'linear-gradient(135deg, #25D366, #128C7E)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)',
  ]

  const color = colors[index % colors.length]

  return (
    <div className="card animate-fade-in" style={{ padding: 20, animationDelay: `${index * 40}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {group.name}
          </h3>
          {group.description && (
            <p style={{ fontSize: 11, color: '#4a5568', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.description}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>👤</span>
          <span style={{ fontSize: 12, color: '#718096' }}>{group.participant_count || 0} membres</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#25D366',
          background: 'rgba(37,211,102,0.1)',
          border: '1px solid rgba(37,211,102,0.2)',
          borderRadius: 6, padding: '3px 8px',
        }}>
          ACTIF
        </span>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { loadGroups() }, [])

  async function loadGroups() {
    try {
      const res = await axios.get(`${API}/api/groups`)
      setGroups(res.data)
    } catch {}
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await axios.post(`${API}/api/groups/sync`)
      loadGroups()
    } catch {
      alert('WhatsApp doit être connecté')
    } finally { setSyncing(false) }
  }

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Groupes</h1>
          <p style={{ color: '#718096', fontSize: 14 }}>{groups.length} groupes synchronisés</p>
        </div>
        <button className="btn-primary" onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔄</span>
          {syncing ? 'Synchronisation…' : 'Synchroniser'}
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#4a5568' }}>🔍</span>
        <input
          className="input-field"
          style={{ paddingLeft: 44 }}
          placeholder="Rechercher un groupe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#4a5568' }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <p style={{ color: '#718096', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun groupe trouvé</p>
          <p style={{ color: '#4a5568', fontSize: 13 }}>
            {groups.length === 0
              ? 'Connecte WhatsApp et clique sur Synchroniser'
              : 'Essaie un autre terme de recherche'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map((group, i) => (
            <GroupCard key={group.id} group={group} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
