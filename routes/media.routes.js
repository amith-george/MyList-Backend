const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const mediaController = require('../controllers/media.controller');

// Get 15 latest entries of media
router.get('/latest/:userId/:mediaType', mediaController.getLatestMediaByType);

// Get media stats for a user
router.get('/stats/:userId', mediaController.getMediaStats);

// Add media to a list
router.post('/:listId/add', authenticateToken, mediaController.addMediaToList);

// Update media
router.put('/:mediaId/update', authenticateToken, mediaController.updateMediaInList);

// Delete media from a list
router.delete('/:listId/:mediaId/delete', authenticateToken, mediaController.deleteMediaFromList);

// Get media details
router.get('/:listId/:tmdbId', mediaController.getMediaDetails);

module.exports = router;