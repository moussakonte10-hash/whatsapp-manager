'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function ConnectionStatus() {
  const [status, setStatus] = useState('loading')
  const [qr, setQr] = useState(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL)
    socket.on('connection_status', ({ status }) => setStatus(status))
    socket.on('qr', (qrData) => {
      setQr(qrData)
      setStatus('qr')
      setShowQR(true)
    })

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/status`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status)
        if (data.qr) { setQr(data.qr); setShowQR(true) }
      })
      .catch(() => setStatus('error'))

    return () => socket.disconnect()
  }, [])

  const cfg = {
    connected:    { color: '#25D366', label: 'Connecté',      dot: true },
    qr:           { color: '#F6C90E', label: 'Scan QR requis', dot: true },
    disconnected: { color: '#FC8181', label: 'Déconnecté',    dot: false },
    loading:      { color: '#718096', label: 'Chargement…',   dot: false },
    error:        { color: '#FC8181', label: 'Erreur backend', dot: false },
  }[status] || { color: '#718096', label: '…', dot: false }

  return (
    <>
      <button
        onClick={() => status === 'qr' && setShowQR(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #1e2233',
          borderRadius: 12,
          padding: '10px 12px',
          width: '100%',
          cursor: status === 'qr' ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => status === 'qr' && (e.currentTarget.style.background = 'rgba(37,211,102,0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: cfg.color,
            flexShrink: 0,
            boxShadow: cfg.dot ? `0 0 6px ${cfg.color}` : 'none',
          }}
          className={cfg.dot ? 'pulse-green' : ''}
        />
        <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 500, flex: 1, textAlign: 'left' }}>
          {cfg.label}
        </span>
        {status === 'qr' && (
          <span style={{ fontSize: 10, color: '#25D366', fontWeight: 600 }}>SCAN →</span>
        )}
      </button>

      {showQR && qr && (
        <div
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#13151f',
              border: '1px solid #2d3748',
              borderRadius: 20,
              padding: 32,
              textAlign: 'center',
              maxWidth: 320,
              width: '90%',
            }}
            className="animate-fade-in"
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#e2e8f0', marginBottom: 4 }}>
              Scanner le QR Code
            </h2>
            <p style={{ fontSize: 12, color: '#718096', marginBottom: 20, lineHeight: 1.6 }}>
              WhatsApp → ⋮ → Appareils liés → Lier un appareil
            </p>
            <div style={{ background: 'white', borderRadius: 12, padding: 12, display: 'inline-block' }}>
              <img src={qr} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} />
            </div>
            <button
              onClick={() => setShowQR(false)}
              style={{ marginTop: 20, fontSize: 13, color: '#4a5568', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
