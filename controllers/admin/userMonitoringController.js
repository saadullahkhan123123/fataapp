const User = require('../../models/User');
const FantasyTeam = require('../../models/FantasyTeam');
const Competition = require('../../models/Competition');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { isVerified, isAdmin } = req.query;
    const filter = {};

    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isAdmin !== undefined) filter.isAdmin = isAdmin === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users'
    });
  }
};

// @desc    Get single user profile
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile'
    });
  }
};

// @desc    Get user's fantasy teams
// @route   GET /api/admin/users/:id/fantasy-teams
// @access  Admin
exports.getUserFantasyTeams = async (req, res) => {
  try {
    const { competition } = req.query;
    const filter = { user: req.params.id };

    if (competition) filter.competition = competition;

    const teams = await FantasyTeam.find(filter)
      .populate('competition', 'name status')
      .populate('starters', 'name surname gender category currentPrice currentRating')
      .populate('bench', 'name surname gender category currentPrice currentRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get User Fantasy Teams Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching fantasy teams'
    });
  }
};

// @desc    Get user's fantasy team details
// @route   GET /api/admin/users/:userId/fantasy-teams/:teamId
// @access  Admin
exports.getFantasyTeamDetails = async (req, res) => {
  try {
    const team = await FantasyTeam.findOne({
      _id: req.params.teamId,
      user: req.params.userId
    })
      .populate('user', 'username email')
      .populate('competition', 'name status startDate endDate')
      .populate('starters', 'name surname gender category currentPrice currentRating totalPoints')
      .populate('bench', 'name surname gender category currentPrice currentRating totalPoints');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Fantasy team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get Fantasy Team Details Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching fantasy team details'
    });
  }
};

// @desc    Reset user's fantasy team
// @route   POST /api/admin/users/:userId/fantasy-teams/:teamId/reset
// @access  Admin
exports.resetFantasyTeam = async (req, res) => {
  try {
    const team = await FantasyTeam.findOne({
      _id: req.params.teamId,
      user: req.params.userId
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Fantasy team not found'
      });
    }

    team.starters = [];
    team.bench = [];
    team.totalPoints = 0;
    team.weeklyPoints = [];
    team.transfersUsed = 0;
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Fantasy team reset successfully',
      data: team
    });
  } catch (error) {
    console.error('Reset Fantasy Team Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting fantasy team'
    });
  }
};

// @desc    Manually change player in fantasy team
// @route   PUT /api/admin/users/:userId/fantasy-teams/:teamId/change-player
// @access  Admin
exports.changePlayerInTeam = async (req, res) => {
  try {
    const { oldPlayerId, newPlayerId, position } = req.body; // position: 'starter' or 'bench'

    if (!oldPlayerId || !newPlayerId || !position) {
      return res.status(400).json({
        success: false,
        message: 'Please provide oldPlayerId, newPlayerId, and position (starter/bench)'
      });
    }

    const team = await FantasyTeam.findOne({
      _id: req.params.teamId,
      user: req.params.userId
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Fantasy team not found'
      });
    }

    if (position === 'starter') {
      const index = team.starters.findIndex(p => p.toString() === oldPlayerId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Player not found in starters'
        });
      }
      team.starters[index] = newPlayerId;
    } else if (position === 'bench') {
      const index = team.bench.findIndex(p => p.toString() === oldPlayerId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Player not found in bench'
        });
      }
      team.bench[index] = newPlayerId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Position must be "starter" or "bench"'
      });
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Player changed successfully',
      data: await FantasyTeam.findById(team._id)
        .populate('starters', 'name surname')
        .populate('bench', 'name surname')
    });
  } catch (error) {
    console.error('Change Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing player'
    });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Admin
exports.blockUser = async (req, res) => {
  try {
    const { isBlocked } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add isBlocked field if not exists in schema, or use a different approach
    // For now, we'll add it dynamically
    user.isBlocked = isBlocked !== undefined ? isBlocked : true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error blocking user'
    });
  }
};

// @desc    Get leaderboard for a competition
// @route   GET /api/admin/competitions/:competitionId/leaderboard
// @access  Admin
exports.getLeaderboard = async (req, res) => {
  try {
    const teams = await FantasyTeam.find({ competition: req.params.competitionId })
      .populate('user', 'username email')
      .sort({ totalPoints: -1 });

    const leaderboard = teams.map((team, index) => ({
      rank: index + 1,
      user: team.user,
      totalPoints: team.totalPoints,
      weeklyPoints: team.weeklyPoints,
      startersCount: team.starters.length,
      benchCount: team.bench.length
    }));

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leaderboard'
    });
  }
};

