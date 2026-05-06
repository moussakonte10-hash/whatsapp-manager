const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Lister toutes les communautés avec leurs groupes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(`*, community_groups(groups(*))`)
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Créer une communauté
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Nom requis' })

    const { data, error } = await supabase
      .from('communities')
      .insert({ name, description: description || '' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Modifier une communauté
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body
    const { data, error } = await supabase
      .from('communities')
      .update({ name, description })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Supprimer une communauté
router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('community_groups').delete().eq('community_id', req.params.id)
    const { error } = await supabase.from('communities').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Communauté supprimée' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Ajouter un groupe dans une communauté
router.post('/:id/groups', async (req, res) => {
  try {
    const { group_id } = req.body
    const { data, error } = await supabase
      .from('community_groups')
      .insert({ community_id: req.params.id, group_id })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Retirer un groupe d'une communauté
router.delete('/:id/groups/:groupId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('community_groups')
      .delete()
      .eq('community_id', req.params.id)
      .eq('group_id', req.params.groupId)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Groupe retiré de la communauté' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
