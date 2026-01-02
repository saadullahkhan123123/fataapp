const PlayerProfile = require('../../models/PlayerProfile');

// GET /api/admin/player-profiles
exports.getAllPlayerProfiles = async (req, res, next) => {
  try {
    const profiles = await PlayerProfile.find()
      .populate('user', 'username email isPlayer')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (err) {
    next(err);
  }
};


