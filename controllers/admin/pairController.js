const Pair = require('../../models/Pair');
const Competition = require('../../models/Competition');
const Player = require('../../models/Player');

// @desc    Create a pair for a matchweek
// @route   POST /api/admin/pairs
// @access  Admin
exports.createPair = async (req, res) => {
  try {
    const { player1, player2, competition, matchweek, isActive } = req.body;

    if (!player1 || !player2 || !competition || !matchweek) {
      return res.status(400).json({
        success: false,
        message: 'Please provide player1, player2, competition, and matchweek'
      });
    }

    // Validate players exist
    const p1 = await Player.findById(player1);
    const p2 = await Player.findById(player2);
    if (!p1 || !p2) {
      return res.status(404).json({
        success: false,
        message: 'One or both players not found'
      });
    }

    // Validate competition exists
    const comp = await Competition.findById(competition);
    if (!comp) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check if pair already exists for this matchweek
    const existingPair = await Pair.findOne({
      competition,
      matchweek,
      $or: [
        { player1, player2 },
        { player1: player2, player2: player1 }
      ]
    });

    if (existingPair) {
      return res.status(400).json({
        success: false,
        message: 'Pair already exists for this matchweek'
      });
    }

    const pair = await Pair.create({
      player1,
      player2,
      competition,
      matchweek,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Pair created successfully',
      data: await Pair.findById(pair._id)
        .populate('player1', 'name surname gender')
        .populate('player2', 'name surname gender')
        .populate('competition', 'name')
    });
  } catch (error) {
    console.error('Create Pair Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating pair'
    });
  }
};

// @desc    Get all pairs
// @route   GET /api/admin/pairs
// @access  Admin
exports.getAllPairs = async (req, res) => {
  try {
    const { competition, matchweek, isActive } = req.query;
    const filter = {};

    if (competition) filter.competition = competition;
    if (matchweek) filter.matchweek = parseInt(matchweek);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const pairs = await Pair.find(filter)
      .populate('player1', 'name surname gender category')
      .populate('player2', 'name surname gender category')
      .populate('competition', 'name')
      .sort({ matchweek: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pairs.length,
      data: pairs
    });
  } catch (error) {
    console.error('Get Pairs Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pairs'
    });
  }
};

// @desc    Get single pair
// @route   GET /api/admin/pairs/:id
// @access  Admin
exports.getPair = async (req, res) => {
  try {
    const pair = await Pair.findById(req.params.id)
      .populate('player1', 'name surname gender category')
      .populate('player2', 'name surname gender category')
      .populate('competition', 'name');

    if (!pair) {
      return res.status(404).json({
        success: false,
        message: 'Pair not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pair
    });
  } catch (error) {
    console.error('Get Pair Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pair'
    });
  }
};

// @desc    Update pair
// @route   PUT /api/admin/pairs/:id
// @access  Admin
exports.updatePair = async (req, res) => {
  try {
    const { player1, player2, isActive } = req.body;

    const updateData = {};
    if (player1) updateData.player1 = player1;
    if (player2) updateData.player2 = player2;
    if (isActive !== undefined) updateData.isActive = isActive;

    const pair = await Pair.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('player1', 'name surname gender')
      .populate('player2', 'name surname gender')
      .populate('competition', 'name');

    if (!pair) {
      return res.status(404).json({
        success: false,
        message: 'Pair not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pair updated successfully',
      data: pair
    });
  } catch (error) {
    console.error('Update Pair Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating pair'
    });
  }
};

// @desc    Delete pair
// @route   DELETE /api/admin/pairs/:id
// @access  Admin
exports.deletePair = async (req, res) => {
  try {
    const pair = await Pair.findById(req.params.id);
    if (!pair) {
      return res.status(404).json({
        success: false,
        message: 'Pair not found'
      });
    }

    await Pair.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Pair deleted successfully'
    });
  } catch (error) {
    console.error('Delete Pair Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting pair'
    });
  }
};

// @desc    Create multiple pairs for a matchweek
// @route   POST /api/admin/pairs/bulk
// @access  Admin
exports.createBulkPairs = async (req, res) => {
  try {
    const { pairs, competition, matchweek } = req.body;

    if (!pairs || !Array.isArray(pairs) || !competition || !matchweek) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pairs array, competition, and matchweek'
      });
    }

    const createdPairs = [];
    const errors = [];

    for (const pairData of pairs) {
      try {
        const { player1, player2 } = pairData;

        if (!player1 || !player2) {
          errors.push({ pairData, error: 'Missing player1 or player2' });
          continue;
        }

        // Check if pair already exists
        const existingPair = await Pair.findOne({
          competition,
          matchweek,
          $or: [
            { player1, player2 },
            { player1: player2, player2: player1 }
          ]
        });

        if (existingPair) {
          errors.push({ pairData, error: 'Pair already exists' });
          continue;
        }

        const pair = await Pair.create({
          player1,
          player2,
          competition,
          matchweek,
          isActive: true
        });

        createdPairs.push(pair);
      } catch (error) {
        errors.push({ pairData, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdPairs.length} pairs`,
      data: {
        created: createdPairs.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Bulk Create Pairs Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating pairs'
    });
  }
};

