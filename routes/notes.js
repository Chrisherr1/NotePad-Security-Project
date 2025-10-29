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
        const id = req.params.id 
        const notes = await db.getUserNotes(id) 
        res.send(notes)
    } catch (error) {
        console.error('Could not fetch notes:', error)
        res.status(500)
    }
})

// allows user to add a note
router.post("/", async (req, res) => {
    try {
        const { title, content, category, id } = req.body
        const note = await db.createNote(title, content, category, id)
        res.status(201).send(note)
    } catch (error) {
        console.error('Could not create note:', error)
        res.status(500)
    }
})

// allows user to update note
router.put("/notes/:id", async (req, res) => {
    try {
        const id = req.params.id
        const { note } = req.body
        const notes = await db.updateNote(note, id)
        res.status(201).send(notes)
    } catch (error) {
        console.error('Could not update note:', error)
        res.status(500)
    }
})

// allows user to delete a note 
router.delete("/notes/:id", async (req, res) => {
    try {
        const id = req.params.id
        const result = await db.deleteNote(id)
        res.status(201).send(result)
    } catch (error) {
        console.error('Could not delete note:', error)
        res.status(500)
    }
    
})

module.exports = router