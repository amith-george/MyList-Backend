const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');


router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.post('/reset-password', userController.resetPassword);

router.get('/:id', authenticateToken, userController.getUser);

router.put('/:id', authenticateToken, userController.updateUser);

router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;

