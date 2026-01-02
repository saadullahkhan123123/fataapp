const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');

// POST /api/player-profiles/upgrade
// body: { playerName, country?, profilePicture? }
exports.upgradeToPlayer = async (req, res, next) => {
  try {
    const user = req.user;
    const { playerName, country, profilePicture } = req.body;

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ success: false, message: 'Player Name is required' });
    }

    const existing = await PlayerProfile.findOne({ user: user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Player profile already exists' });
    }

    const created = await PlayerProfile.create({
      user: user._id,
      playerName: playerName.trim(),
      country: (country || '').trim(),
      profilePicture: profilePicture || user.profilePicture || ''
    });

    // Mark user as player (non-breaking)
    await User.findByIdAndUpdate(user._id, { isPlayer: true });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

// GET /api/player-profiles/me
exports.getMyPlayerProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await PlayerProfile.findOne({ user: user._id }).populate('user', 'username email');
    if (!profile) return res.status(404).json({ success: false, message: 'Player profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};


