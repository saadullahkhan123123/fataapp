const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { createMyTeam, getMyTeam, updateMyTeam, updateMyLineup } = require('../controllers/teamController');

router.post('/', protect, createMyTeam);
router.get('/me', protect, getMyTeam);
router.put('/me', protect, updateMyTeam);
router.patch('/me/lineup', protect, updateMyLineup);

module.exports = router;


