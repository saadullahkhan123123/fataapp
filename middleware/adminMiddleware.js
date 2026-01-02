const protect = require('./auth');

const adminMiddleware = (req, res, next) => {
  // First check authentication using protect middleware
  protect(req, res, () => {
    // After authentication, check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // User is authenticated and is admin, continue
    next();
  });
};

module.exports = adminMiddleware;

