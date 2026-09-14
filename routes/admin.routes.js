const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Unprotected migration endpoint as requested
router.post('/migrate-media', adminController.migrateMedia);

module.exports = router;
