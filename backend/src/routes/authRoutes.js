const express = require('express');
const router = express.Router();
const { login, getProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
