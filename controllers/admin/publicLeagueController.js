const League = require('../../models/League');
const User = require('../../models/User');

// @desc    Get all public leagues
// @route   GET /api/admin/public-leagues
// @access  Admin
exports.getAllPublicLeagues = async (req, res) => {
  try {
    const leagues = await League.find({ type: 'public' })
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leagues.length,
      data: leagues
    });
  } catch (error) {
    console.error('Get Public Leagues Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching public leagues'
    });
  }
};

// @desc    Get single public league
// @route   GET /api/admin/public-leagues/:id
// @access  Admin
exports.getPublicLeague = async (req, res) => {
  try {
    const league = await League.findOne({
      _id: req.params.id,
      type: 'public'
    })
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email');

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Public league not found'
      });
    }

    res.status(200).json({
      success: true,
      data: league
    });
  } catch (error) {
    console.error('Get Public League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching public league'
    });
  }
};

// @desc    View participants of a public league
// @route   GET /api/admin/public-leagues/:id/participants
// @access  Admin
exports.getLeagueParticipants = async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('members.user', 'username email credits');

    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }

    res.status(200).json({
      success: true,
      count: league.members.length,
      data: league.members
    });
  } catch (error) {
    console.error('Get League Participants Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching participants'
    });
  }
};

// @desc    Update public league
// @route   PUT /api/admin/public-leagues/:id
// @access  Admin
exports.updatePublicLeague = async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league || league.type !== 'public') {
      return res.status(404).json({
        success: false,
        message: 'Public league not found'
      });
    }

    const { leagueName, description, typology } = req.body;

    if (leagueName) league.leagueName = leagueName;
    if (description !== undefined) league.description = description;
    if (typology) league.typology = typology;

    await league.save();

    res.status(200).json({
      success: true,
      message: 'Public league updated successfully',
      data: await League.findById(league._id).populate('createdBy', 'username email')
    });
  } catch (error) {
    console.error('Update Public League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating public league'
    });
  }
};

// @desc    Delete public league
// @route   DELETE /api/admin/public-leagues/:id
// @access  Admin
exports.deletePublicLeague = async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league || league.type !== 'public') {
      return res.status(404).json({
        success: false,
        message: 'Public league not found'
      });
    }

    await League.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Public league deleted successfully'
    });
  } catch (error) {
    console.error('Delete Public League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting public league'
    });
  }
};

// @desc    Remove user from public league
// @route   DELETE /api/admin/public-leagues/:leagueId/users/:userId
// @access  Admin
exports.removeUserFromLeague = async (req, res) => {
  try {
    const { leagueId, userId } = req.params;

    const league = await League.findById(leagueId);
    if (!league || league.type !== 'public') {
      return res.status(404).json({
        success: false,
        message: 'Public league not found'
      });
    }

    league.members = league.members.filter(
      (m) => m.user.toString() !== userId
    );

    await league.save();

    res.status(200).json({
      success: true,
      message: 'User removed from league successfully'
    });
  } catch (error) {
    console.error('Remove User From League Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing user from league'
    });
  }
};

