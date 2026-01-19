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

// Google Sign-In
router.post('/google', authController.googleSignIn);

// Check user status (first time user detection) - requires authentication
router.get('/check-status', authMiddleware, authController.checkUserStatus);

// Complete onboarding - requires authentication
router.post('/complete-onboarding', authMiddleware, authController.completeOnboarding);

// Logout user (requires authentication)
router.post('/logout', authMiddleware, authController.logoutUser);

module.exports = router;
