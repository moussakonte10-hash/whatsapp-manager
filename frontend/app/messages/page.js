'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

const typeConfig = {
  group:     { icon: '👥', label: 'Groupe',     desc: 'Un seul groupe WhatsApp',        color: '#667eea' },
  community: { icon: '🌐', label: 'Communauté', desc: 'Tous les groupes d\'une communauté', color: '#25D366' },
  private:   { icon: '👤', label: 'Privé',      desc: 'Un contact par numéro',          color: '#f093fb' },
}

export default function MessagesPage() {
  const [type, setType] = useState('group')
  const [groups, setGroups] = useState([])
  const [communities, setCommunities] = useState([])
  const [targetId, setTargetId] = useState('')
  const [privateNumber, setPrivateNumber] = useState('')
  const [message, setMessage] = useState('')
  const [delay, setDelay] = useState(2000)
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [g, c, h] = await Promise.all([
      axios.get(`${API}/api/groups`),
      axios.get(`${API}/api/communities`),
      axios.get(`${API}/api/messages/history`),
    ])
    setGroups(g.data)
    setCommunities(c.data)
    setHistory(h.data)
  }

  async function sendMessage() {
    if (!message.trim()) return alert('Écris un message')
    if (type !== 'private' && !targetId) return alert('Sélectionne une cible')
    if (type === 'private' && !privateNumber.trim()) return alert('Saisis un numéro')

    setSending(true)
    try {
      const res = await axios.post(`${API}/api/messages/send`, {
        type,
        target_id: type === 'private' ? privateNumber : targetId,
        message,
        delay,
      })
      setMessage('')
      loadData()
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.error || err.message))
    } finally { setSending(false) }
  }

  const charCount = message.length
  const maxChars = 4096

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Messages</h1>
        <p style={{ color: '#718096', fontSize: 14 }}>Envoie un message à un groupe, une communauté ou un contact</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Sélection du type */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Type de destinataire
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setType(key); setTargetId('') }}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 12,
                    border: `1px solid ${type === key ? cfg.color : '#2d3748'}`,
                    background: type === key ? `rgba(${hexToRgb(cfg.color)}, 0.1)` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{cfg.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: type === key ? cfg.color : '#718096' }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2, lineHeight: 1.4 }}>
                    {cfg.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sélection de la cible */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Destinataire
            </p>
            {type === 'group' && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Sélectionne un groupe…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} style={{ background: '#1a1d27' }}>
                    {g.name} ({g.participant_count || 0} membres)
                  </option>
                ))}
              </select>
            )}
            {type === 'community' && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Sélectionne une communauté…</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#1a1d27' }}>
                    🌐 {c.name} — {(c.community_groups || []).length} groupes
                  </option>
                ))}
              </select>
            )}
            {type === 'private' && (
              <input
                className="input-field"
                placeholder="Numéro avec indicatif, ex: 33612345678"
                value={privateNumber}
                onChange={(e) => setPrivateNumber(e.target.value)}
              />
            )}
          </div>

          {/* Zone de texte */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 }}>
                Message
              </p>
              <span style={{ fontSize: 11, color: charCount > maxChars * 0.9 ? '#FC8181' : '#4a5568' }}>
                {charCount}/{maxChars}
              </span>
            </div>
            <textarea
              className="input-field"
              placeholder="Écris ton message ici…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Délai (communauté uniquement) */}
          {type === 'community' && (
            <div className="card animate-fade-in" style={{ padding: 20, borderColor: 'rgba(246,201,14,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#F6C90E', textTransform: 'uppercase', letterSpacing: 1 }}>
                  ⏱ Délai entre groupes
                </p>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#F6C90E' }}>{delay / 1000}s</span>
              </div>
              <input
                type="range" min={1000} max={10000} step={500}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F6C90E' }}
              />
              <p style={{ fontSize: 11, color: '#4a5568', marginTop: 8 }}>
                Recommandé : 2–5s pour éviter les détections
              </p>
            </div>
          )}

          {/* Bouton envoi */}
          <button
            className="btn-primary"
            onClick={sendMessage}
            disabled={sending}
            style={{ width: '100%', padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            {sending ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Envoi en cours…
              </>
            ) : (
              <>
                <span>📤</span>
                Envoyer le message
              </>
            )}
          </button>
        </div>

        {/* Historique */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Historique récent
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <p style={{ color: '#4a5568', fontSize: 13 }}>Aucun message envoyé</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div key={msg.id} className="card animate-fade-in" style={{ padding: 14, animationDelay: `${i * 40}ms` }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(37,211,102,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>
                      {typeConfig[msg.type]?.icon || '💬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.target_name}
                        </span>
                        <span style={{ fontSize: 10, color: '#4a5568', whiteSpace: 'nowrap' }}>
                          {new Date(msg.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
