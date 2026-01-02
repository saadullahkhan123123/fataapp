const Player = require('../../models/Player');
const PriceHistory = require('../../models/PriceHistory');

// @desc    Get all player prices
// @route   GET /api/admin/prices
// @access  Admin
exports.getAllPrices = async (req, res) => {
  try {
    const { competition } = req.query;
    const filter = {};

    if (competition) filter.competitions = competition;

    const players = await Player.find(filter)
      .select('name surname initialPrice currentPrice currentRating')
      .populate('competitions', 'name')
      .sort({ currentPrice: -1 });

    res.status(200).json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    console.error('Get Prices Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching prices'
    });
  }
};

// @desc    Get price history for a player
// @route   GET /api/admin/prices/:playerId/history
// @access  Admin
exports.getPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find({ player: req.params.playerId })
      .populate('changedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get Price History Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching price history'
    });
  }
};

// @desc    Manually override player price
// @route   PUT /api/admin/prices/:playerId
// @access  Admin
exports.updatePlayerPrice = async (req, res) => {
  try {
    const { newPrice, reason } = req.body;

    if (newPrice === undefined || newPrice === null || newPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid new price (must be >= 0)'
      });
    }

    // Validate reason if provided
    const allowedReasons = ['automatic', 'manual', 'performance'];
    const changeReason = reason && allowedReasons.includes(reason.toLowerCase()) 
      ? reason.toLowerCase() 
      : 'manual';

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const oldPrice = player.currentPrice;
    player.currentPrice = newPrice;
    await player.save();

    // Record price history
    await PriceHistory.create({
      player: player._id,
      oldPrice,
      newPrice,
      changeReason: changeReason,
      changedBy: req.user?._id || req.user?.id || null
    });

    res.status(200).json({
      success: true,
      message: 'Player price updated successfully',
      data: {
        player: await Player.findById(player._id).select('name surname currentPrice'),
        oldPrice,
        newPrice
      }
    });
  } catch (error) {
    console.error('Update Price Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating price'
    });
  }
};

// @desc    Trigger automatic price recalculation
// @route   POST /api/admin/prices/recalculate
// @access  Admin
exports.recalculatePrices = async (req, res) => {
  try {
    const { competitionId } = req.body;

    let players;
    if (competitionId) {
      const Competition = require('../../models/Competition');
      const competition = await Competition.findById(competitionId).populate('players');
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }
      players = competition.players;
    } else {
      players = await Player.find({ isActive: true });
    }

    let updated = 0;
    const updates = [];

    for (const player of players) {
      try {
        // Simple price calculation based on performance
        // You can customize this logic
        const performanceMultiplier = player.currentRating / player.initialRating;
        const newPrice = Math.round(player.initialPrice * performanceMultiplier * 100) / 100;

        if (newPrice !== player.currentPrice) {
          const oldPrice = player.currentPrice;
          player.currentPrice = newPrice;

          await player.save();

          // Record price history
          await PriceHistory.create({
            player: player._id,
            oldPrice,
            newPrice,
            changeReason: 'automatic'
          });

          updated++;
          updates.push({
            player: player.name + ' ' + player.surname,
            oldPrice,
            newPrice
          });
        }
      } catch (error) {
        console.error(`Error updating price for player ${player._id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Price recalculation completed. ${updated} players updated.`,
      data: {
        updated,
        total: players.length,
        updates
      }
    });
  } catch (error) {
    console.error('Recalculate Prices Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error recalculating prices'
    });
  }
};

// @desc    Bulk update prices
// @route   POST /api/admin/prices/bulk-update
// @access  Admin
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { playerId, newPrice }

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of updates with playerId and newPrice'
      });
    }

    const results = [];
    const errors = [];

    // Validate reason enum values
    const allowedReasons = ['automatic', 'manual', 'performance'];

    for (const update of updates) {
      try {
        const { playerId, newPrice, reason } = update;

        if (!playerId || newPrice === undefined) {
          errors.push({ update, error: 'Missing playerId or newPrice' });
          continue;
        }

        // Validate reason if provided, default to 'manual'
        const changeReason = reason && allowedReasons.includes(reason.toLowerCase())
          ? reason.toLowerCase()
          : 'manual';

        const player = await Player.findById(playerId);
        if (!player) {
          errors.push({ update, error: 'Player not found' });
          continue;
        }

        const oldPrice = player.currentPrice;
        player.currentPrice = newPrice;
        await player.save();

        // Record price history
        await PriceHistory.create({
          player: player._id,
          oldPrice,
          newPrice,
          changeReason: changeReason,
          changedBy: req.user?._id || req.user?.id || null
        });

        results.push({
          playerId,
          playerName: `${player.name} ${player.surname}`,
          oldPrice,
          newPrice
        });
      } catch (error) {
        errors.push({ update, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed. ${results.length} prices updated.`,
      data: {
        updated: results.length,
        errors: errors.length,
        results,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Bulk Update Prices Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error bulk updating prices'
    });
  }
};

