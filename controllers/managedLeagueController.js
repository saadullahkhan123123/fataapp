const ManagedLeague = require('../models/ManagedLeague');
const Team = require('../models/Team');
const LeagueJoinRequest = require('../models/LeagueJoinRequest');

// GET /api/managed-leagues
exports.getAllManagedLeagues = async (req, res, next) => {
  try {
    const leagues = await ManagedLeague.find().sort({ createdAt: -1 });
    res.json({ success: true, count: leagues.length, data: leagues });
  } catch (err) {
    next(err);
  }
};

// POST /api/managed-leagues/:leagueId/request-join
exports.requestJoinLeague = async (req, res, next) => {
  try {
    const user = req.user;
    const { leagueId } = req.params;

    const league = await ManagedLeague.findById(leagueId);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });

    const team = await Team.findOne({ owner: user._id });
    if (!team) {
      return res.status(400).json({ success: false, message: 'Team required. Pehle team create karein.' });
    }

    const reqDoc = await LeagueJoinRequest.create({
      league: league._id,
      team: team._id,
      requestedBy: user._id,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: reqDoc });
  } catch (err) {
    // Unique index error -> already requested
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Join request already exists for this league' });
    }
    next(err);
  }
};

// GET /api/managed-leagues/my-join-requests
exports.getMyJoinRequests = async (req, res, next) => {
  try {
    const user = req.user;
    const team = await Team.findOne({ owner: user._id });
    if (!team) return res.json({ success: true, count: 0, data: [] });

    const requests = await LeagueJoinRequest.find({ team: team._id })
      .populate('league', 'leagueName country status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
};


