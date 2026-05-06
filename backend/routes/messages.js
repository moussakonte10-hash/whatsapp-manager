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

// Envoyer un message
router.post('/send', async (req, res) => {
  try {
    const { type, target_id, message, delay } = req.body

    if (!message || !type || !target_id) {
      return res.status(400).json({ error: 'type, target_id et message sont requis' })
    }

    let results = []
    let targetName = target_id

    if (type === 'group') {
      const { data: group } = await supabase.from('groups').select('*').eq('id', target_id).single()
      if (!group) return res.status(404).json({ error: 'Groupe introuvable' })
      await sendMessageToGroup(group.whatsapp_id, message)
      results = [{ group: group.name, status: 'sent' }]
      targetName = group.name
    }

    if (type === 'community') {
      const { data: community } = await supabase
        .from('communities')
        .select('*')
        .eq('id', target_id)
        .single()
      if (!community) return res.status(404).json({ error: 'Communauté introuvable' })
      results = await sendMessageToCommunity(target_id, message, delay || 2000)
      targetName = community.name
    }

    if (type === 'private') {
      await sendMessageToContact(target_id, message)
      results = [{ contact: target_id, status: 'sent' }]
    }

    // Sauvegarder dans l'historique
    await supabase.from('message_history').insert({
      type,
      target_id: target_id.toString(),
      target_name: targetName,
      message,
      results: JSON.stringify(results),
      sent_at: new Date().toISOString(),
    })

    res.json({ success: true, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Historique des messages
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

module.exports = router
