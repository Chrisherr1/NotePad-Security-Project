import express from 'express';
import NoteController from '../controllers/NoteController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { csrfSynchronisedProtection } from '../middleware/csrf.js';

const notesRoutes = express.Router();

notesRoutes.use(isAuthenticated);

// get all notes for the logged in user
notesRoutes.get('/notes', NoteController.getNotes);

// create a new note
notesRoutes.post('/notes', csrfSynchronisedProtection, NoteController.createNote);

// update a note
notesRoutes.put('/notes/:id', csrfSynchronisedProtection, NoteController.updateNote);

// delete a note
notesRoutes.delete('/notes/:id', csrfSynchronisedProtection, NoteController.deleteNote);

export default notesRoutes;