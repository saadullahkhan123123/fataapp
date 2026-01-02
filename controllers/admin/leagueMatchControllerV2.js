const LeagueMatch = require('../../models/LeagueMatch');
const LeagueJoinRequest = require('../../models/LeagueJoinRequest');
const Team = require('../../models/Team');
const ManagedLeague = require('../../models/ManagedLeague');
const { parseDateInput } = require('../../utils/parseDateInput');

async function ensureTeamApprovedInLeague(leagueId, teamId) {
  const approved = await LeagueJoinRequest.findOne({
    league: leagueId,
    team: teamId,
    status: 'approved'
  });
  return !!approved;
}

// POST /api/admin/league-matches
// body: { leagueId, teamAId, teamBId, scheduledAt, lockAt? }
exports.createMatch = async (req, res, next) => {
  try {
    const { leagueId, teamAId, teamBId, scheduledAt, lockAt } = req.body;

    if (!leagueId || !teamAId || !teamBId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'leagueId, teamAId, teamBId, scheduledAt required' });
    }
    if (String(teamAId) === String(teamBId)) {
      return res.status(400).json({ success: false, message: 'Team A and Team B must be different' });
    }

    const league = await ManagedLeague.findById(leagueId);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });

    const teamA = await Team.findById(teamAId);
    const teamB = await Team.findById(teamBId);
    if (!teamA || !teamB) return res.status(404).json({ success: false, message: 'Team not found' });

    const okA = await ensureTeamApprovedInLeague(league._id, teamA._id);
    const okB = await ensureTeamApprovedInLeague(league._id, teamB._id);
    if (!okA || !okB) {
      return res.status(400).json({ success: false, message: 'Both teams must be approved members of this league' });
    }

    const scheduled = parseDateInput(scheduledAt);
    const locked = lockAt ? parseDateInput(lockAt) : scheduled;
    if (!scheduled) return res.status(400).json({ success: false, message: 'Invalid scheduledAt' });
    if (!locked) return res.status(400).json({ success: false, message: 'Invalid lockAt' });

    const match = await LeagueMatch.create({
      league: league._id,
      teamA: teamA._id,
      teamB: teamB._id,
      scheduledAt: scheduled,
      lockAt: locked,
      status: 'upcoming',
      lineupA: [],
      lineupB: []
    });

    res.status(201).json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/league-matches
exports.getAllMatches = async (req, res, next) => {
  try {
    const matches = await LeagueMatch.find()
      .populate('league', 'leagueName country')
      .populate('teamA', 'teamName')
      .populate('teamB', 'teamName')
      .sort({ scheduledAt: -1 });
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/league-matches/:id/lock
exports.lockMatch = async (req, res, next) => {
  try {
    const match = await LeagueMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    match.status = 'locked';
    match.lockAt = match.lockAt || match.scheduledAt;
    await match.save();
    res.json({ success: true, message: 'Match locked', data: match });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/league-matches/:id/result
// body: { score?, winnerTeamId?, isCompleted? }
exports.updateResult = async (req, res, next) => {
  try {
    const match = await LeagueMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const { score, winnerTeamId, isCompleted } = req.body;
    if (score !== undefined) match.score = String(score);
    if (winnerTeamId !== undefined) match.winner = winnerTeamId || null;
    if (isCompleted !== undefined) match.isCompleted = !!isCompleted;
    if (match.isCompleted) match.status = 'completed';

    await match.save();
    res.json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};


