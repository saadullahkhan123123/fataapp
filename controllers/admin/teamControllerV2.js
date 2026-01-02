const Team = require('../../models/Team');
const PlayerProfile = require('../../models/PlayerProfile');

function activeCount(team) {
  return (team.players || []).filter(p => p.status === 'active').length;
}

// GET /api/admin/teams-v2
exports.getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('owner', 'username email')
      .populate('purchase', 'packageKey status')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: teams.length, data: teams });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/teams-v2/:id
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'username email')
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

// POST /api/admin/teams-v2/:id/assign-player
// body: { playerProfileId, status? ('active'|'reserve') }
exports.assignPlayer = async (req, res, next) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { playerProfileId, status } = req.body;

    if (!playerProfileId) {
      return res.status(400).json({ success: false, message: 'playerProfileId required' });
    }

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const profile = await PlayerProfile.findById(playerProfileId);
    if (!profile) return res.status(404).json({ success: false, message: 'Player profile not found' });
    if (!profile.isActive) return res.status(400).json({ success: false, message: 'Player is inactive' });

    // A player can belong to only ONE team at a time (global constraint)
    const alreadyAssignedTeam = await Team.findOne({ 'players.playerProfile': profile._id }).select('_id teamName');
    if (alreadyAssignedTeam) {
      return res.status(400).json({
        success: false,
        message: `Player already assigned to another team: ${alreadyAssignedTeam.teamName || alreadyAssignedTeam._id}`
      });
    }

    const exists = team.players.some(p => String(p.playerProfile) === String(profile._id));
    if (exists) return res.status(400).json({ success: false, message: 'Player already assigned to this team' });

    if (team.players.length >= team.maxPlayersAllowed) {
      return res.status(400).json({
        success: false,
        message: `Team roster full. Max allowed: ${team.maxPlayersAllowed}`
      });
    }

    const desiredStatus = status === 'active' ? 'active' : 'reserve';
    if (desiredStatus === 'active' && activeCount(team) >= 4) {
      return res.status(400).json({ success: false, message: 'Max 4 active players allowed' });
    }

    team.players.push({
      playerProfile: profile._id,
      status: desiredStatus,
      assignedBy: admin._id,
      assignedAt: new Date()
    });

    await team.save();
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/teams-v2/:id/remove-player
// body: { playerProfileId }
exports.removePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { playerProfileId } = req.body;

    if (!playerProfileId) {
      return res.status(400).json({ success: false, message: 'playerProfileId required' });
    }

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const before = team.players.length;
    team.players = team.players.filter(p => String(p.playerProfile) !== String(playerProfileId));
    if (team.players.length === before) {
      return res.status(404).json({ success: false, message: 'Player not found in team' });
    }

    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};


