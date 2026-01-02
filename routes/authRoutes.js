const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const authController = require('../controllers/authController');

// Register user
router.post('/register', authController.registerUser);

// Login user
router.post('/login', authController.loginUser);

// Verify OTP
router.post('/verify-otp', authController.verifyLoginOrRegisterOtp);

// Logout user (requires authentication)
router.post('/logout', authMiddleware, authController.logoutUser);

module.exports = router;
