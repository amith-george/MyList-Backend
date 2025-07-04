const express = require('express');
const router = express.Router();
const listController = require('../controllers/list.controller');

// Create a new list
router.post('/:userId/create', listController.createList); // Assuming userId is passed in the URL

// Get all lists by user
router.get('/:userId', listController.getListsByUser);

// Update a list
router.put('/:userId/:id/update', listController.updateList);

// Delete a list
router.delete('/:userId/:id/delete', listController.deleteList);

// Route to get media counts by type for a list
router.get('/:userId/:listId/counts', listController.getMediaCountByType);

// Route to get List items enriched with TMDB
router.get('/:userId/:id', listController.getListMediaWithDetails);

module.exports = router;