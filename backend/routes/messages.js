const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const {
  sendMessageToGroup,
  sendMessageToContact,
  sendMessageToCommunity,
} = require('../services/whatsapp')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const DELETE_PIN = '1234'

// Envoyer un message
router.post('/send', async (req, res) => {
  try {
    const { type, target_id, message, delay } = req.body
    if (!message || !type || !target_id)
      return res.status(400).json({ error: 'type, target_id et message sont requis' })

    let results = []
    let targetName = target_id
    let chatJid = target_id

    if (type === 'group') {
      const { data: group } = await supabase.from('groups').select('*').eq('id', target_id).single()
      if (!group) return res.status(404).json({ error: 'Groupe introuvable' })
      await sendMessageToGroup(group.whatsapp_id, message)
      results = [{ group: group.name, status: 'sent' }]
      targetName = group.name
      chatJid = group.whatsapp_id
    }

    if (type === 'community') {
      const { data: community } = await supabase.from('communities').select('*').eq('id', target_id).single()
      if (!community) return res.status(404).json({ error: 'Communauté introuvable' })
      results = await sendMessageToCommunity(target_id, message, delay || 2000)
      targetName = community.name
      chatJid = `community:${target_id}`
    }

    if (type === 'private') {
      await sendMessageToContact(target_id, message)
      results = [{ contact: target_id, status: 'sent' }]
      chatJid = target_id.includes('@') ? target_id : `${target_id}@s.whatsapp.net`
      chatName = target_id
    }

    // Sauvegarder dans message_history (legacy)
    await supabase.from('message_history').insert({
      type,
      target_id: target_id.toString(),
      target_name: targetName,
      message,
      results: JSON.stringify(results),
      sent_at: new Date().toISOString(),
    })

    // Sauvegarder dans conversations (nouveau)
    await supabase.from('conversations').insert({
      direction: 'sent',
      sender_name: 'Moi',
      sender_jid: 'me',
      chat_jid: chatJid,
      chat_name: targetName,
      message,
      timestamp: new Date().toISOString(),
    })

    res.json({ success: true, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Historique legacy
router.get('/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('message_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Liste des conversations (chats uniques)
router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('timestamp', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    // Grouper par chat_jid, garder le dernier message + le nombre total
    const chatsMap = {}
    for (const msg of data) {
      if (!chatsMap[msg.chat_jid]) {
        chatsMap[msg.chat_jid] = {
          chat_jid: msg.chat_jid,
          chat_name: msg.chat_name,
          last_message: msg.message,
          last_timestamp: msg.timestamp,
          unread: msg.direction === 'received' ? 1 : 0,
          total: 1,
        }
      } else {
        chatsMap[msg.chat_jid].total++
        if (msg.direction === 'received') chatsMap[msg.chat_jid].unread++
      }
    }

    res.json(Object.values(chatsMap))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Messages d'une conversation
router.get('/conversations/:chatJid', async (req, res) => {
  try {
    const chatJid = decodeURIComponent(req.params.chatJid)
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('chat_jid', chatJid)
      .order('timestamp', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Supprimer un message (avec PIN)
router.delete('/conversations/message/:id', async (req, res) => {
  const { pin } = req.body
  if (pin !== DELETE_PIN) return res.status(403).json({ error: 'PIN incorrect' })
  try {
    const { error } = await supabase.from('conversations').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Supprimer toute une conversation (avec PIN)
router.delete('/conversations/chat/:chatJid', async (req, res) => {
  const { pin } = req.body
  if (pin !== DELETE_PIN) return res.status(403).json({ error: 'PIN incorrect' })
  try {
    const chatJid = decodeURIComponent(req.params.chatJid)
    const { error } = await supabase.from('conversations').delete().eq('chat_jid', chatJid)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Tout supprimer (avec PIN)
router.delete('/conversations', async (req, res) => {
  const { pin } = req.body
  if (pin !== DELETE_PIN) return res.status(403).json({ error: 'PIN incorrect' })
  try {
    const { error } = await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
