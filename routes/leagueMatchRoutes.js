const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getMyMatches, setMyMatchLineup } = require('../controllers/leagueMatchController');

router.get('/my', protect, getMyMatches);
router.patch('/:matchId/lineup', protect, setMyMatchLineup);

module.exports = router;


