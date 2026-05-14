const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const logger = pino({ level: 'silent' })

let sock = null
let qrCode = null
let connectionStatus = 'disconnected'
let io = null

function setSocketIO(socketIO) {
  io = socketIO
}

function getStatus() {
  return { status: connectionStatus, qr: qrCode }
}

function getSock() {
  return sock
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    browser: ['WhatsApp Manager', 'Chrome', '1.0.0'],
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const QRCode = require('qrcode')
      qrCode = await QRCode.toDataURL(qr)
      connectionStatus = 'qr'
      if (io) io.emit('qr', qrCode)
      console.log('QR Code généré — scanne depuis le frontend')
    }

    if (connection === 'open') {
      qrCode = null
      connectionStatus = 'connected'
      if (io) io.emit('connection_status', { status: 'connected' })
      console.log('✅ WhatsApp connecté !')
      await syncGroups()
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      connectionStatus = 'disconnected'
      if (io) io.emit('connection_status', { status: 'disconnected' })

      if (shouldReconnect) {
        console.log('Reconnexion en cours...')
        setTimeout(startWhatsApp, 3000)
      } else {
        console.log('Déconnecté — re-scan requis')
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      await upsertGroup(update)
    }
  })

  // Écoute des messages reçus
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue
      const jid = msg.key.remoteJid
      if (!jid) continue

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        '[Média]'

      const isGroup = jid.endsWith('@g.us')
      const senderJid = isGroup ? (msg.key.participant || jid) : jid
      const senderName = msg.pushName || senderJid.split('@')[0] || 'Inconnu'

      let chatName = null
      if (isGroup) {
        const { data: group } = await supabase
          .from('groups')
          .select('name')
          .eq('whatsapp_id', jid)
          .single()
        chatName = group?.name || jid.split('@')[0]
      } else {
        chatName = senderName
      }

      await supabase.from('conversations').insert({
        direction: 'received',
        sender_name: senderName,
        sender_jid: senderJid,
        chat_jid: jid,
        chat_name: chatName,
        message: text,
        timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
      })
    }
  })
}

async function syncGroups() {
  try {
    if (!sock) return []
    const groups = await sock.groupFetchAllParticipating()
    const groupList = Object.values(groups)

    for (const group of groupList) {
      await upsertGroup(group)
    }

    console.log(`✅ ${groupList.length} groupes synchronisés`)
    return groupList
  } catch (err) {
    console.error('Erreur sync groupes:', err)
    return []
  }
}

async function upsertGroup(group) {
  try {
    const { error } = await supabase.from('groups').upsert(
      {
        whatsapp_id: group.id,
        name: group.subject || 'Groupe sans nom',
        description: group.desc || '',
        participant_count: group.participants?.length || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'whatsapp_id' }
    )
    if (error) console.error('Erreur upsert groupe:', error)
  } catch (err) {
    console.error('Erreur upsert:', err)
  }
}

async function sendMessageToGroup(groupId, message) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp non connecté')
  }
  await sock.sendMessage(groupId, { text: message })
}

async function sendMessageToContact(jid, message) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp non connecté')
  }
  const formattedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`
  await sock.sendMessage(formattedJid, { text: message })
}

async function sendMessageToCommunity(communityId, message, delay = 2000) {
  const { data: groups } = await supabase
    .from('community_groups')
    .select('groups(*)')
    .eq('community_id', communityId)

  if (!groups || groups.length === 0) throw new Error('Aucun groupe dans cette communauté')

  const results = []
  for (const item of groups) {
    const group = item.groups
    try {
      await sendMessageToGroup(group.whatsapp_id, message)
      results.push({ group: group.name, status: 'sent' })
      await new Promise((r) => setTimeout(r, delay))
    } catch (err) {
      results.push({ group: group.name, status: 'error', error: err.message })
    }
  }
  return results
}

module.exports = {
  startWhatsApp,
  getStatus,
  getSock,
  setSocketIO,
  syncGroups,
  sendMessageToGroup,
  sendMessageToContact,
  sendMessageToCommunity,
}
