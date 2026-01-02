const Team = require('../models/Team');
const PackPurchase = require('../models/PackPurchase');

function countActive(players) {
  return (players || []).filter(p => p.status === 'active').length;
}

// POST /api/teams
// body: { teamName, teamCountry?, teamLogo? }
exports.createMyTeam = async (req, res, next) => {
  try {
    const user = req.user;
    const { teamName, teamCountry, teamLogo } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ success: false, message: 'Team Name is required' });
    }

    const existingTeam = await Team.findOne({ owner: user._id });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'You already created a team' });
    }

    const approvedPurchase = await PackPurchase.findOne({ user: user._id, status: 'approved' })
      .sort({ approvedAt: -1, createdAt: -1 });

    if (!approvedPurchase) {
      return res.status(403).json({
        success: false,
        message: 'Team create nahi ho sakti. Pehle pack purchase karein aur admin approval ka wait karein.'
      });
    }

    const team = await Team.create({
      owner: user._id,
      teamName: teamName.trim(),
      teamCountry: (teamCountry || '').trim(),
      teamLogo: teamLogo || '',
      purchase: approvedPurchase._id,
      packageKey: approvedPurchase.packageKey,
      maxPlayersAllowed: approvedPurchase.freePlayers,
      players: []
    });

    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

// GET /api/teams/me
exports.getMyTeam = async (req, res, next) => {
  try {
    const user = req.user;
    const team = await Team.findOne({ owner: user._id })
      .populate('purchase', 'packageKey status')
      .populate({
        path: 'players.playerProfile',
        populate: { path: 'user', select: 'username email' }
      });

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

// PUT /api/teams/me
exports.updateMyTeam = async (req, res, next) => {
  try {
    const user = req.user;
    const { teamName, teamCountry, teamLogo } = req.body;

    const team = await Team.findOne({ owner: user._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (teamName !== undefined) team.teamName = String(teamName).trim();
    if (teamCountry !== undefined) team.teamCountry = String(teamCountry).trim();
    if (teamLogo !== undefined) team.teamLogo = String(teamLogo);

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/teams/me/lineup
// body: { activePlayerProfileIds: string[] }  (max 4)
exports.updateMyLineup = async (req, res, next) => {
  try {
    const user = req.user;
    const { activePlayerProfileIds } = req.body;

    if (!Array.isArray(activePlayerProfileIds)) {
      return res.status(400).json({ success: false, message: 'activePlayerProfileIds must be an array' });
    }

    const unique = Array.from(new Set(activePlayerProfileIds.map(String)));
    if (unique.length > 4) {
      return res.status(400).json({ success: false, message: 'Max 4 active players allowed' });
    }

    const team = await Team.findOne({ owner: user._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const rosterIds = new Set(team.players.map(p => String(p.playerProfile)));
    for (const id of unique) {
      if (!rosterIds.has(String(id))) {
        return res.status(400).json({ success: false, message: 'Active player must belong to your team roster' });
      }
    }

    team.players = team.players.map(p => ({
      ...p.toObject(),
      status: unique.includes(String(p.playerProfile)) ? 'active' : 'reserve'
    }));

    if (countActive(team.players) > 4) {
      return res.status(400).json({ success: false, message: 'Max 4 active players allowed' });
    }

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};


