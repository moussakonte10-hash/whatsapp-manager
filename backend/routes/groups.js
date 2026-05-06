const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { syncGroups } = require('../services/whatsapp')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Lister tous les groupes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Synchroniser les groupes depuis WhatsApp
router.post('/sync', async (req, res) => {
  try {
    const groups = await syncGroups()
    res.json({ message: `${groups.length} groupes synchronisés`, count: groups.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Supprimer un groupe de la liste locale (pas du vrai WhatsApp)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Groupe supprimé de la liste' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
