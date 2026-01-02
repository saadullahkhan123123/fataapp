const ManagedLeague = require('../../models/ManagedLeague');
const LeagueJoinRequest = require('../../models/LeagueJoinRequest');
const Team = require('../../models/Team');
const { parseDateInput } = require('../../utils/parseDateInput');

// CRUD for leagues
exports.createLeague = async (req, res, next) => {
  try {
    const admin = req.user;
    const { leagueName, country, startDate, endDate, rules, limits, status } = req.body;

    if (!leagueName || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'leagueName, startDate, endDate required' });
    }

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Invalid startDate/endDate' });
    }

    const league = await ManagedLeague.create({
      leagueName: String(leagueName).trim(),
      country: (country || '').trim(),
      startDate: start,
      endDate: end,
      rules: rules || '',
      limits: limits || '',
      status: status || 'upcoming',
      createdBy: admin._id
    });

    res.status(201).json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
};

exports.getAllLeagues = async (req, res, next) => {
  try {
    const leagues = await ManagedLeague.find().sort({ createdAt: -1 });
    res.json({ success: true, count: leagues.length, data: leagues });
  } catch (err) {
    next(err);
  }
};

exports.getLeague = async (req, res, next) => {
  try {
    const league = await ManagedLeague.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    res.json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
};

exports.updateLeague = async (req, res, next) => {
  try {
    const league = await ManagedLeague.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });

    const { leagueName, country, startDate, endDate, rules, limits, status } = req.body;
    if (leagueName !== undefined) league.leagueName = String(leagueName).trim();
    if (country !== undefined) league.country = String(country).trim();
    if (startDate !== undefined) {
      const d = parseDateInput(startDate);
      if (!d) return res.status(400).json({ success: false, message: 'Invalid startDate' });
      league.startDate = d;
    }
    if (endDate !== undefined) {
      const d = parseDateInput(endDate);
      if (!d) return res.status(400).json({ success: false, message: 'Invalid endDate' });
      league.endDate = d;
    }
    if (rules !== undefined) league.rules = String(rules);
    if (limits !== undefined) league.limits = String(limits);
    if (status !== undefined) league.status = status;

    await league.save();
    res.json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
};

exports.deleteLeague = async (req, res, next) => {
  try {
    const league = await ManagedLeague.findByIdAndDelete(req.params.id);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    await LeagueJoinRequest.deleteMany({ league: league._id });
    res.json({ success: true, message: 'League deleted' });
  } catch (err) {
    next(err);
  }
};

// Join requests
exports.getJoinRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await LeagueJoinRequest.find(filter)
      .populate('league', 'leagueName country')
      .populate({
        path: 'team',
        populate: { path: 'owner', select: 'username email' }
      })
      .populate('requestedBy', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
};

exports.approveJoinRequest = async (req, res, next) => {
  try {
    const admin = req.user;
    const request = await LeagueJoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status === 'approved') return res.json({ success: true, message: 'Already approved', data: request });
    if (request.status === 'rejected') return res.status(400).json({ success: false, message: 'Already rejected' });

    // Ensure team still exists
    const team = await Team.findById(request.team);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    request.status = 'approved';
    request.reviewedBy = admin._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Join request approved', data: request });
  } catch (err) {
    next(err);
  }
};

exports.rejectJoinRequest = async (req, res, next) => {
  try {
    const admin = req.user;
    const { note } = req.body;
    const request = await LeagueJoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status === 'rejected') return res.json({ success: true, message: 'Already rejected', data: request });
    if (request.status === 'approved') return res.status(400).json({ success: false, message: 'Already approved' });

    request.status = 'rejected';
    request.reviewedBy = admin._id;
    request.reviewedAt = new Date();
    request.note = note || request.note;
    await request.save();

    res.json({ success: true, message: 'Join request rejected', data: request });
  } catch (err) {
    next(err);
  }
};


