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

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
})

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

// Routes API
app.use('/api/groups', groupsRouter)
app.use('/api/communities', communitiesRouter)
app.use('/api/messages', messagesRouter)

// Statut WhatsApp
app.get('/api/status', (req, res) => {
  res.json(getStatus())
})

// Socket.IO — push temps réel (QR code, statut connexion)
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
