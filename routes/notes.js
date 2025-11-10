// handles backend GET, POST, PUT, & DELETE requests

// import modules
const express = require('express')
const router = express.Router()
const db = require('../config/db')

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

router.use(isAuthenticated)

// gets user notes
router.get("/notes", async (req, res) => {
    try {
        const id = req.user.user_id
        const notes = await db.getUserNotes(id) 
        res.send(notes)
    } catch (error) {
        res.status(500).send({ error: 'Could not fetch notes'})
    }
})

// allows user to add a note
//** FIX: need to get user_id (user_id is currently being hardcoded into database)
router.post("/notes", async (req, res) => {
    try {
        const { title, content, category, user_id } = req.body
        const note = await db.createNote(title, content, category, req.user.user_id)
        res.status(200).send(note)
    } catch (error) {
        console.error('Could not create note:', error)
        res.status(500).send({ error: 'Could not create note' })
    }
})

// allows user to update note
router.put("/notes/:id", async (req, res) => {
    try {
        const id = req.params.id
        const { title, content, category } = req.body
        const note = await db.updateNote(title, content, category, id)
        res.status(201).send(note)
    } catch (error) {
        console.error('Could not update note:', error)
        res.status(500).send({ error: 'Could not update note' })
    }
})

// allows user to delete a note 
router.delete("/notes/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id)    
        const result = await db.deleteNote(id)
        res.status(201).send(result)
    } catch (error) {
        console.error('Could not delete note:', error)
        res.status(500).send({ error: 'Could not delete note' })
    }
    
})

module.exports = router