const express = require('express');
const router = express.Router();
const { getMe } = require('../controllers/userController');
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  deleteProfilePicture
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route GET /api/users/me
router.get('/me', authMiddleware, getMe);

// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/profile/change-password', authMiddleware, changePassword);
router.post('/profile/picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile/picture', authMiddleware, deleteProfilePicture);

module.exports = router;
