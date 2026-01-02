const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { upgradeToPlayer, getMyPlayerProfile } = require('../controllers/playerProfileController');

router.post('/upgrade', protect, upgradeToPlayer);
router.get('/me', protect, getMyPlayerProfile);

module.exports = router;


