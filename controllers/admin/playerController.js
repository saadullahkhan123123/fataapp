const Player = require('../../models/Player');
const Competition = require('../../models/Competition');
const csv = require('csv-parser');
const { Readable } = require('stream');

// @desc    Create a new player
// @route   POST /api/admin/players
// @access  Admin
exports.createPlayer = async (req, res) => {
  try {
    const { name, surname, gender, category, initialPrice, initialRating, isActive } = req.body;

    if (!name || !surname || !gender || !category || !initialPrice || !initialRating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, surname, gender, category, initialPrice, initialRating'
      });
    }

    const player = await Player.create({
      name,
      surname,
      gender,
      category,
      initialPrice,
      currentPrice: initialPrice,
      initialRating,
      currentRating: initialRating,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: player
    });
  } catch (error) {
    console.error('Create Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating player'
    });
  }
};

// @desc    Get all players
// @route   GET /api/admin/players
// @access  Admin
exports.getAllPlayers = async (req, res) => {
  try {
    const { isActive, gender, category, competition } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (gender) filter.gender = gender;
    if (category) filter.category = category;
    if (competition) filter.competitions = competition;

    const players = await Player.find(filter)
      .populate('competitions', 'name')
      .sort({ position: 1, surname: 1 });

    res.status(200).json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    console.error('Get Players Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching players'
    });
  }
};

// @desc    Get single player
// @route   GET /api/admin/players/:id
// @access  Admin
exports.getPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate('competitions', 'name');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching player'
    });
  }
};

// @desc    Update player
// @route   PUT /api/admin/players/:id
// @access  Admin
exports.updatePlayer = async (req, res) => {
  try {
    const { name, surname, gender, category, initialPrice, initialRating, isActive, currentPrice, currentRating } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;
    if (gender) updateData.gender = gender;
    if (category) updateData.category = category;
    if (initialPrice !== undefined) {
      updateData.initialPrice = initialPrice;
      if (!currentPrice) updateData.currentPrice = initialPrice;
    }
    if (initialRating !== undefined) {
      updateData.initialRating = initialRating;
      if (!currentRating) updateData.currentRating = initialRating;
    }
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice;
    if (currentRating !== undefined) updateData.currentRating = currentRating;
    if (isActive !== undefined) updateData.isActive = isActive;

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('competitions', 'name');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: player
    });
  } catch (error) {
    console.error('Update Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating player'
    });
  }
};

// @desc    Delete player
// @route   DELETE /api/admin/players/:id
// @access  Admin
exports.deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    await Player.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Delete Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting player'
    });
  }
};

// @desc    Upload players from CSV
// @route   POST /api/admin/players/upload-csv
// @access  Admin
exports.uploadPlayersCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const results = [];
    const errors = [];
    const buffer = req.file.buffer.toString('utf-8');
    const stream = Readable.from(buffer);
    const promises = []; // Track all async operations

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Wrap async operation in a promise and track it
          const promise = (async () => {
            try {
              const position = parseInt(row.position) || null;
              const initialPrice = parseFloat(row.initialPrice) || 0;
              const initialRating = parseFloat(row.initialRating) || 0;
              // Handle isActive: default to true if not provided, otherwise parse the value
              let isActive = true; // default
              if (row.isActive !== undefined && row.isActive !== null && row.isActive !== '') {
                const isActiveStr = String(row.isActive).toLowerCase().trim();
                isActive = isActiveStr === 'true' || isActiveStr === '1';
              }

              if (!row.name || !row.surname || !row.gender || !row.category) {
                errors.push({ row, error: 'Missing required fields' });
                return;
              }

              const player = await Player.create({
                name: row.name.trim(),
                surname: row.surname.trim(),
                gender: row.gender.toLowerCase(),
                category: row.category.trim(),
                initialPrice,
                currentPrice: initialPrice,
                initialRating,
                currentRating: initialRating,
                position,
                isActive
              });

              results.push(player);
            } catch (error) {
              errors.push({ row, error: error.message });
            }
          })();
          promises.push(promise);
        })
        .on('end', async () => {
          // Wait for all async operations to complete before resolving
          try {
            await Promise.all(promises);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error));
    });

    // Sort all players by position and update positions if needed
    const allPlayers = await Player.find({ isActive: true }).sort({ position: 1 });
    for (let i = 0; i < allPlayers.length; i++) {
      if (allPlayers[i].position !== i + 1) {
        allPlayers[i].position = i + 1;
        await allPlayers[i].save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${results.length} players`,
      data: {
        created: results.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('CSV Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading CSV'
    });
  }
};

// @desc    Assign players to competition
// @route   POST /api/admin/players/:playerId/assign-competition
// @access  Admin
exports.assignPlayerToCompetition = async (req, res) => {
  try {
    const { competitionId } = req.body;
    const { playerId } = req.params;

    if (!competitionId) {
      return res.status(400).json({
        success: false,
        message: 'Competition ID is required'
      });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Add competition to player if not already assigned
    if (!player.competitions.includes(competitionId)) {
      player.competitions.push(competitionId);
      await player.save();
    }

    // Add player to competition if not already added
    if (!competition.players.includes(playerId)) {
      competition.players.push(playerId);
      await competition.save();
    }

    res.status(200).json({
      success: true,
      message: 'Player assigned to competition successfully',
      data: {
        player: await Player.findById(playerId).populate('competitions', 'name'),
        competition: await Competition.findById(competitionId).populate('players', 'name surname')
      }
    });
  } catch (error) {
    console.error('Assign Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning player to competition'
    });
  }
};

// @desc    Remove player from competition
// @route   DELETE /api/admin/players/:playerId/competitions/:competitionId
// @access  Admin
exports.removePlayerFromCompetition = async (req, res) => {
  try {
    const { playerId, competitionId } = req.params;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    player.competitions = player.competitions.filter(
      comp => comp.toString() !== competitionId
    );
    await player.save();

    competition.players = competition.players.filter(
      p => p.toString() !== playerId
    );
    await competition.save();

    res.status(200).json({
      success: true,
      message: 'Player removed from competition successfully'
    });
  } catch (error) {
    console.error('Remove Player Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing player from competition'
    });
  }
};

