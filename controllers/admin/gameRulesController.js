const GameRules = require('../../models/GameRules');
const Competition = require('../../models/Competition');

// @desc    Get game rules for a competition
// @route   GET /api/admin/game-rules/:competitionId
// @access  Admin
exports.getGameRules = async (req, res) => {
  try {
    const gameRules = await GameRules.findOne({ competition: req.params.competitionId })
      .populate('competition', 'name');

    if (!gameRules) {
      return res.status(404).json({
        success: false,
        message: 'Game rules not found for this competition'
      });
    }

    res.status(200).json({
      success: true,
      data: gameRules
    });
  } catch (error) {
    console.error('Get Game Rules Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching game rules'
    });
  }
};

// @desc    Update game rules
// @route   PUT /api/admin/game-rules/:competitionId
// @access  Admin
exports.updateGameRules = async (req, res) => {
  try {
    const {
      initialBudget,
      minPlayers,
      maxPlayers,
      maxTopPlayers,
      perGenderLimits,
      transferRules,
      scoringRules
    } = req.body;

    const competition = await Competition.findById(req.params.competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    const updateData = {};
    if (initialBudget !== undefined) updateData.initialBudget = initialBudget;
    if (minPlayers !== undefined) updateData.minPlayers = minPlayers;
    if (maxPlayers !== undefined) updateData.maxPlayers = maxPlayers;
    if (maxTopPlayers !== undefined) updateData.maxTopPlayers = maxTopPlayers;
    if (perGenderLimits) updateData.perGenderLimits = perGenderLimits;
    if (transferRules) updateData.transferRules = transferRules;
    if (scoringRules) updateData.scoringRules = scoringRules;

    const gameRules = await GameRules.findOneAndUpdate(
      { competition: req.params.competitionId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    ).populate('competition', 'name');

    res.status(200).json({
      success: true,
      message: 'Game rules updated successfully',
      data: gameRules
    });
  } catch (error) {
    console.error('Update Game Rules Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating game rules'
    });
  }
};

// @desc    Get all game rules
// @route   GET /api/admin/game-rules
// @access  Admin
exports.getAllGameRules = async (req, res) => {
  try {
    const gameRules = await GameRules.find()
      .populate('competition', 'name status');

    res.status(200).json({
      success: true,
      count: gameRules.length,
      data: gameRules
    });
  } catch (error) {
    console.error('Get All Game Rules Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching game rules'
    });
  }
};

