'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [allGroups, setAllGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [c, g] = await Promise.all([
      axios.get(`${API}/api/communities`),
      axios.get(`${API}/api/groups`),
    ])
    setCommunities(c.data)
    setAllGroups(g.data)
    setLoading(false)
  }

  async function createCommunity() {
    if (!form.name.trim()) return
    await axios.post(`${API}/api/communities`, form)
    setForm({ name: '', description: '' })
    setShowForm(false)
    loadData()
  }

  async function deleteCommunity(id) {
    if (!confirm('Supprimer cette communauté ?')) return
    await axios.delete(`${API}/api/communities/${id}`)
    setSelected(null)
    loadData()
  }

  async function addGroup(communityId, groupId) {
    await axios.post(`${API}/api/communities/${communityId}/groups`, { group_id: groupId })
    loadData()
  }

  async function removeGroup(communityId, groupId) {
    await axios.delete(`${API}/api/communities/${communityId}/groups/${groupId}`)
    loadData()
  }

  const gradients = [
    'linear-gradient(135deg, #25D366, #128C7E)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Communautés</h1>
          <p style={{ color: '#718096', fontSize: 14 }}>Groupez vos groupes WhatsApp pour envoyer en masse</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{showForm ? '✕' : '+'}</span>
          {showForm ? 'Annuler' : 'Nouvelle communauté'}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 16, fontSize: 16 }}>
            Créer une communauté
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input-field"
              placeholder="Nom de la communauté *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="input-field"
              placeholder="Description (optionnel)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              style={{ resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={createCommunity}>Créer la communauté</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste communautés */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#4a5568' }}>Chargement…</div>
      ) : communities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
          <p style={{ color: '#718096', fontSize: 16, fontWeight: 600 }}>Aucune communauté</p>
          <p style={{ color: '#4a5568', fontSize: 13, marginTop: 8 }}>
            Crée une communauté pour envoyer un message à plusieurs groupes à la fois
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {communities.map((community, ci) => {
            const members = (community.community_groups || []).map((cg) => cg.groups).filter(Boolean)
            const memberIds = members.map((g) => g.id)
            const available = allGroups.filter((g) => !memberIds.includes(g.id))
            const isOpen = selected === community.id
            const gradient = gradients[ci % gradients.length]

            return (
              <div key={community.id} className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', animationDelay: `${ci * 60}ms` }}>
                {/* Header communauté */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: gradient, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                    🌐
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 16 }}>{community.name}</h3>
                    {community.description && (
                      <p style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{community.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#4a5568' }}>
                        {members.length} groupe{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelected(isOpen ? null : community.id)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      {isOpen ? 'Fermer' : 'Gérer'}
                    </button>
                    <button
                      onClick={() => deleteCommunity(community.id)}
                      style={{
                        padding: '8px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(252,129,129,0.1)', color: '#FC8181',
                        border: '1px solid rgba(252,129,129,0.2)', fontWeight: 500, transition: 'all 0.2s',
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Groupes membres (inline) */}
                {members.length > 0 && !isOpen && (
                  <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {members.map((g) => (
                      <span key={g.id} style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)',
                        color: '#a0aec0',
                      }}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Panel de gestion */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #1e2233', padding: '20px 24px', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Membres actuels */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                          Membres ({members.length})
                        </p>
                        {members.length === 0 ? (
                          <p style={{ fontSize: 12, color: '#4a5568' }}>Aucun groupe ajouté</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {members.map((g) => (
                              <div key={g.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px',
                                border: '1px solid #1e2233',
                              }}>
                                <span style={{ fontSize: 14 }}>👥</span>
                                <span style={{ flex: 1, fontSize: 13, color: '#cbd5e0' }}>{g.name}</span>
                                <button
                                  onClick={() => removeGroup(community.id, g.id)}
                                  style={{ color: '#FC8181', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Groupes disponibles */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                          Ajouter ({available.length} dispo.)
                        </p>
                        {available.length === 0 ? (
                          <p style={{ fontSize: 12, color: '#4a5568' }}>Tous les groupes sont déjà membres</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                            {available.map((g) => (
                              <button
                                key={g.id}
                                onClick={() => addGroup(community.id, g.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px',
                                  border: '1px solid #1e2233', cursor: 'pointer', transition: 'all 0.2s',
                                  color: '#a0aec0', fontSize: 13, fontWeight: 500,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#25D366'
                                  e.currentTarget.style.background = 'rgba(37,211,102,0.08)'
                                  e.currentTarget.style.color = '#25D366'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#1e2233'
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                  e.currentTarget.style.color = '#a0aec0'
                                }}
                              >
                                <span>+ </span>
                                <span style={{ flex: 1 }}>{g.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
