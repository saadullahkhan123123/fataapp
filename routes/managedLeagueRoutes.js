const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getAllManagedLeagues,
  requestJoinLeague,
  getMyJoinRequests
} = require('../controllers/managedLeagueController');

// Public listing
router.get('/', getAllManagedLeagues);

// Team creator actions
router.post('/:leagueId/request-join', protect, requestJoinLeague);
router.get('/my-join-requests', protect, getMyJoinRequests);

module.exports = router;


