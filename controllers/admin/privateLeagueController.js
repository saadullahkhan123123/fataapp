const League = require('../../models/League');
const User = require('../../models/User');

// @desc    Get all private leagues
// @route   GET /api/admin/private-leagues
// @access  Admin
exports.getAllPrivateLeagues = async (req, res) => {
  try {
    const leagues = await League.find({ type: 'private' })
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leagues.length,
      data: leagues
    });
  } catch (error) {
    console.error('Get Private Leagues Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching private leagues'
    });
  }
};

// @desc    Get single private league
// @route   GET /api/admin/private-leagues/:id
// @access  Admin
exports.getPrivateLeague = async (req, res) => {
  try {
    const league = await League.findOne({
      _id: req.params.id,
      type: 'private'
    })
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email');

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Private league not found'
      });
    }

    res.status(200).json({
      success: true,
      data: league
    });
  } catch (error) {
    console.error('Get Private League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching private league'
    });
  }
};

// @desc    View participants of a private league
// @route   GET /api/admin/private-leagues/:id/participants
// @access  Admin
exports.getLeagueParticipants = async (req, res) => {
  try {
    const league = await League.findOne({
      _id: req.params.id,
      type: 'private'
    }).populate('members.user', 'username email createdAt');

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Private league not found'
      });
    }

    res.status(200).json({
      success: true,
      count: league.members.length,
      data: {
        league: {
          id: league._id,
          name: league.leagueName,
          createdBy: league.createdBy
        },
        participants: league.members
      }
    });
  } catch (error) {
    console.error('Get League Participants Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching participants'
    });
  }
};

// @desc    Delete/Modify private league
// @route   DELETE /api/admin/private-leagues/:id
// @access  Admin
exports.deletePrivateLeague = async (req, res) => {
  try {
    const league = await League.findOne({
      _id: req.params.id,
      type: 'private'
    });

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Private league not found'
      });
    }

    await League.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Private league deleted successfully'
    });
  } catch (error) {
    console.error('Delete Private League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting private league'
    });
  }
};

// @desc    Update private league
// @route   PUT /api/admin/private-leagues/:id
// @access  Admin
exports.updatePrivateLeague = async (req, res) => {
  try {
    const { leagueName, description, playerAvailability, gameMode } = req.body;

    const league = await League.findOne({
      _id: req.params.id,
      type: 'private'
    });

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Private league not found'
      });
    }

    if (leagueName) league.leagueName = leagueName;
    if (description !== undefined) league.description = description;
    if (playerAvailability) league.playerAvailability = playerAvailability;
    if (gameMode) league.gameMode = gameMode;

    await league.save();

    res.status(200).json({
      success: true,
      message: 'Private league updated successfully',
      data: await League.findById(league._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email')
    });
  } catch (error) {
    console.error('Update Private League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating private league'
    });
  }
};

// @desc    Remove user from private league
// @route   DELETE /api/admin/private-leagues/:leagueId/users/:userId
// @access  Admin
exports.removeUserFromLeague = async (req, res) => {
  try {
    const { leagueId, userId } = req.params;

    const league = await League.findOne({
      _id: leagueId,
      type: 'private'
    });

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Private league not found'
      });
    }

    league.members = league.members.filter(
      member => member.user.toString() !== userId
    );

    await league.save();

    res.status(200).json({
      success: true,
      message: 'User removed from private league successfully',
      data: await League.findById(league._id)
        .populate('members.user', 'username email')
    });
  } catch (error) {
    console.error('Remove User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing user from league'
    });
  }
};

// @desc    Block user account (affects all leagues)
// @route   PUT /api/admin/users/:userId/block
// @access  Admin
exports.blockUserAccount = async (req, res) => {
  try {
    const { isBlocked } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add isBlocked field dynamically
    user.isBlocked = isBlocked !== undefined ? isBlocked : true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Block User Account Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error blocking user account'
    });
  }
};

