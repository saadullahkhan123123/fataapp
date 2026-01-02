const Season = require('../../models/Season');
const Competition = require('../../models/Competition');

// @desc    Create a new season
// @route   POST /api/admin/seasons
// @access  Admin
exports.createSeason = async (req, res) => {
  try {
    const { name, year, isActive } = req.body;

    if (!name || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and year'
      });
    }

    const season = await Season.create({
      name,
      year,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Season created successfully',
      data: season
    });
  } catch (error) {
    console.error('Create Season Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating season'
    });
  }
};

// @desc    Get all seasons
// @route   GET /api/admin/seasons
// @access  Admin
exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await Season.find().sort({ year: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: seasons.length,
      data: seasons
    });
  } catch (error) {
    console.error('Get Seasons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching seasons'
    });
  }
};

// @desc    Get single season with competitions
// @route   GET /api/admin/seasons/:id
// @access  Admin
exports.getSeason = async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }

    const competitions = await Competition.find({ season: season._id });

    res.status(200).json({
      success: true,
      data: {
        ...season.toObject(),
        competitions
      }
    });
  } catch (error) {
    console.error('Get Season Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching season'
    });
  }
};

// @desc    Update season
// @route   PUT /api/admin/seasons/:id
// @access  Admin
exports.updateSeason = async (req, res) => {
  try {
    const { name, year, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (year) updateData.year = year;
    if (isActive !== undefined) updateData.isActive = isActive;

    const season = await Season.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Season updated successfully',
      data: season
    });
  } catch (error) {
    console.error('Update Season Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating season'
    });
  }
};

// @desc    Delete season
// @route   DELETE /api/admin/seasons/:id
// @access  Admin
exports.deleteSeason = async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }

    // Check if season has competitions
    const competitions = await Competition.find({ season: season._id });
    if (competitions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete season with existing competitions. Delete competitions first.'
      });
    }

    await Season.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Season deleted successfully'
    });
  } catch (error) {
    console.error('Delete Season Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting season'
    });
  }
};

