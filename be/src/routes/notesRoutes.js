// BE: be/src/routes/notesRoutes.js
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

// GET /api/notes - List all notes for the authenticated user
router.get('/', notesController.listNotes);

// POST /api/notes - Create a new note
router.post('/', notesController.createNote);

// GET /api/notes/:id - Get a specific note
router.get('/:id', notesController.getNote);

// PATCH /api/notes/:id - Update a specific note
router.patch('/:id', notesController.updateNote);

// PATCH /api/notes/:id/color - Update note color
router.patch('/:id/color', notesController.updateColor);

// DELETE /api/notes/:id - Delete a specific note
router.delete('/:id', notesController.deleteNote);

// POST /api/notes/bulk - Perform bulk actions on multiple notes
router.post('/bulk', notesController.bulkAction);

module.exports = router;
