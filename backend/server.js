require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const { startWhatsApp, getStatus, setSocketIO } = require('./services/whatsapp')
const groupsRouter = require('./routes/groups')
const communitiesRouter = require('./routes/communities')
const messagesRouter = require('./routes/messages')

const app = express()
const server = http.createServer(app)

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}

const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

// Routes API
app.use('/api/groups', groupsRouter)
app.use('/api/communities', communitiesRouter)
app.use('/api/messages', messagesRouter)

// Statut WhatsApp
app.get('/api/status', (req, res) => {
  res.json(getStatus())
})

// Page QR directe — ouvre cette URL pour scanner
app.get('/qr', (req, res) => {
  const { status, qr } = getStatus()
  if (status === 'connected') {
    return res.send(`<html><body style="background:#0f1117;color:#25D366;font-family:sans-serif;text-align:center;padding:60px">
      <h1>✅ WhatsApp Connecté !</h1><p>Tu peux fermer cette page.</p></body></html>`)
  }
  if (!qr) {
    return res.send(`<html><body style="background:#0f1117;color:white;font-family:sans-serif;text-align:center;padding:60px">
      <h1>⏳ QR Code en cours de génération...</h1>
      <p>Patiente 10 secondes puis <a href="/qr" style="color:#25D366">recharge cette page</a></p>
      <script>setTimeout(()=>location.reload(),5000)</script></body></html>`)
  }
  res.send(`<html><body style="background:#0f1117;color:white;font-family:sans-serif;text-align:center;padding:40px">
    <h1 style="color:#25D366">📱 Scanner le QR Code WhatsApp</h1>
    <p>WhatsApp → ⋮ → Appareils liés → Lier un appareil</p>
    <img src="${qr}" style="border-radius:12px;margin:20px auto;display:block"/>
    <p style="color:#718096;font-size:12px">Cette page se recharge automatiquement...</p>
    <script>setTimeout(()=>location.reload(),15000)</script>
  </body></html>`)
})

// Socket.IO
io.on('connection', (socket) => {
  console.log('Frontend connecté via Socket.IO')
  const current = getStatus()
  if (current.qr) socket.emit('qr', current.qr)
  socket.emit('connection_status', { status: current.status })
})

setSocketIO(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`)
  startWhatsApp()
})
