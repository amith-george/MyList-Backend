const express = require('express');
const router = express.Router();
const { getStatus } = require('../controllers/status.controller');

router.get('/ping', getStatus);

module.exports = router;
