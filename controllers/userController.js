const User = require('../models/User');

// GET current user (protected)
exports.getMe = async (req, res, next) => {
  try {
    // authMiddleware attaches req.user
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
