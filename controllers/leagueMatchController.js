const LeagueMatch = require('../models/LeagueMatch');
const Team = require('../models/Team');

function ensureUniqueLen(arr, len) {
  const uniq = Array.from(new Set((arr || []).map(String)));
  return uniq.length === len;
}

// GET /api/league-matches/my
exports.getMyMatches = async (req, res, next) => {
  try {
    const user = req.user;
    const team = await Team.findOne({ owner: user._id });
    if (!team) return res.json({ success: true, count: 0, data: [] });

    const matches = await LeagueMatch.find({ $or: [{ teamA: team._id }, { teamB: team._id }] })
      .populate('league', 'leagueName country')
      .populate('teamA', 'teamName')
      .populate('teamB', 'teamName')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/league-matches/:matchId/lineup
// body: { playerProfileIds: string[] } (exactly 4)
exports.setMyMatchLineup = async (req, res, next) => {
  try {
    const user = req.user;
    const { matchId } = req.params;
    const { playerProfileIds } = req.body;

    if (!Array.isArray(playerProfileIds) || !ensureUniqueLen(playerProfileIds, 4)) {
      return res.status(400).json({ success: false, message: 'Exactly 4 unique playerProfileIds required' });
    }

    const team = await Team.findOne({ owner: user._id });
    if (!team) return res.status(400).json({ success: false, message: 'Team not found' });

    const match = await LeagueMatch.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const now = new Date();
    const lockAt = match.lockAt || match.scheduledAt;
    if (now >= lockAt || match.status === 'locked') {
      return res.status(400).json({ success: false, message: 'Match lineup locked' });
    }

    const isTeamA = String(match.teamA) === String(team._id);
    const isTeamB = String(match.teamB) === String(team._id);
    if (!isTeamA && !isTeamB) {
      return res.status(403).json({ success: false, message: 'You are not part of this match' });
    }

    const rosterIds = new Set(team.players.map(p => String(p.playerProfile)));
    for (const pid of playerProfileIds) {
      if (!rosterIds.has(String(pid))) {
        return res.status(400).json({ success: false, message: 'Selected player must belong to your team roster' });
      }
    }

    // Update team active/reserve statuses to match lineup selection
    team.players = team.players.map(p => ({
      ...p.toObject(),
      status: playerProfileIds.map(String).includes(String(p.playerProfile)) ? 'active' : 'reserve'
    }));
    await team.save();

    if (isTeamA) match.lineupA = playerProfileIds;
    if (isTeamB) match.lineupB = playerProfileIds;
    await match.save();

    res.json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};


