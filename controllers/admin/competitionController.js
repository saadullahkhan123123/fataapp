const Competition = require('../../models/Competition');
const Season = require('../../models/Season');
const Player = require('../../models/Player');
const GameRules = require('../../models/GameRules');

// @desc    Create a new competition
// @route   POST /api/admin/competitions
// @access  Admin
exports.createCompetition = async (req, res) => {
  try {
    const {
      name,
      season,
      startDate,
      endDate,
      status,
      weight,
      multiplier,
      deadlineForChanges,
      budget,
      totalSquadSize,
      startersCount,
      benchCount,
      genderRules,
      matchweeks,
      maxTopPlayers,
      perGenderLimits,
      transferRules
    } = req.body;

    if (!name || !season || !startDate || !endDate || !deadlineForChanges || 
        !budget || !totalSquadSize || !startersCount || !benchCount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate season exists
    const seasonExists = await Season.findById(season);
    if (!seasonExists) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }

    const competition = await Competition.create({
      name,
      season,
      startDate,
      endDate,
      status: status || 'upcoming',
      weight: weight || 'Silver',
      multiplier: multiplier || 1.0,
      deadlineForChanges,
      budget,
      totalSquadSize,
      startersCount,
      benchCount,
      genderRules: genderRules || 'mixed',
      matchweeks: matchweeks || [],
      maxTopPlayers,
      perGenderLimits,
      transferRules: transferRules || {
        changesAllowed: -1,
        transferWindowOpen: null,
        transferWindowClose: null
      }
    });

    // Create game rules for this competition
    await GameRules.create({
      competition: competition._id,
      initialBudget: budget,
      minPlayers: startersCount,
      maxPlayers: totalSquadSize,
      maxTopPlayers,
      perGenderLimits,
      transferRules: competition.transferRules
    });

    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: await Competition.findById(competition._id).populate('season', 'name')
    });
  } catch (error) {
    console.error('Create Competition Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating competition'
    });
  }
};

// @desc    Get all competitions
// @route   GET /api/admin/competitions
// @access  Admin
exports.getAllCompetitions = async (req, res) => {
  try {
    const { season, status } = req.query;
    const filter = {};

    if (season) filter.season = season;
    if (status) filter.status = status;

    const competitions = await Competition.find(filter)
      .populate('season', 'name year')
      .populate('players', 'name surname gender category')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: competitions.length,
      data: competitions
    });
  } catch (error) {
    console.error('Get Competitions Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching competitions'
    });
  }
};

// @desc    Get single competition
// @route   GET /api/admin/competitions/:id
// @access  Admin
exports.getCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('season', 'name year')
      .populate('players', 'name surname gender category currentPrice currentRating');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    res.status(200).json({
      success: true,
      data: competition
    });
  } catch (error) {
    console.error('Get Competition Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching competition'
    });
  }
};

// @desc    Update competition
// @route   PUT /api/admin/competitions/:id
// @access  Admin
exports.updateCompetition = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;

    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('season', 'name');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Update game rules if budget or other rules changed
    if (updateData.budget || updateData.totalSquadSize || updateData.startersCount) {
      await GameRules.findOneAndUpdate(
        { competition: competition._id },
        {
          initialBudget: competition.budget,
          minPlayers: competition.startersCount,
          maxPlayers: competition.totalSquadSize,
          maxTopPlayers: competition.maxTopPlayers,
          perGenderLimits: competition.perGenderLimits,
          transferRules: competition.transferRules
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Competition updated successfully',
      data: competition
    });
  } catch (error) {
    console.error('Update Competition Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating competition'
    });
  }
};

// @desc    Delete competition
// @route   DELETE /api/admin/competitions/:id
// @access  Admin
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    await Competition.findByIdAndDelete(req.params.id);
    await GameRules.findOneAndDelete({ competition: competition._id });

    res.status(200).json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    console.error('Delete Competition Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting competition'
    });
  }
};

// @desc    Add matchweek to competition
// @route   POST /api/admin/competitions/:id/matchweeks
// @access  Admin
exports.addMatchweek = async (req, res) => {
  try {
    const { weekNumber, startDate, endDate, formationDeadline, status } = req.body;

    if (!weekNumber || !startDate || !endDate || !formationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide weekNumber, startDate, endDate, and formationDeadline'
      });
    }

    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check if weekNumber already exists
    const existingWeek = competition.matchweeks.find(
      week => week.weekNumber === weekNumber
    );
    if (existingWeek) {
      return res.status(400).json({
        success: false,
        message: `Matchweek ${weekNumber} already exists`
      });
    }

    competition.matchweeks.push({
      weekNumber,
      startDate,
      endDate,
      formationDeadline,
      status: status || 'upcoming'
    });

    await competition.save();

    res.status(200).json({
      success: true,
      message: 'Matchweek added successfully',
      data: competition
    });
  } catch (error) {
    console.error('Add Matchweek Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding matchweek'
    });
  }
};

// @desc    Update matchweek
// @route   PUT /api/admin/competitions/:id/matchweeks/:weekNumber
// @access  Admin
exports.updateMatchweek = async (req, res) => {
  try {
    const { weekNumber } = req.params;
    const { startDate, endDate, formationDeadline, status } = req.body;

    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    const matchweek = competition.matchweeks.find(
      week => week.weekNumber === parseInt(weekNumber)
    );
    if (!matchweek) {
      return res.status(404).json({
        success: false,
        message: 'Matchweek not found'
      });
    }

    if (startDate) matchweek.startDate = startDate;
    if (endDate) matchweek.endDate = endDate;
    if (formationDeadline) matchweek.formationDeadline = formationDeadline;
    if (status) matchweek.status = status;

    await competition.save();

    res.status(200).json({
      success: true,
      message: 'Matchweek updated successfully',
      data: competition
    });
  } catch (error) {
    console.error('Update Matchweek Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating matchweek'
    });
  }
};

