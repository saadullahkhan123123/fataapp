const Match = require('../../models/Match');
const Pair = require('../../models/Pair');
const Competition = require('../../models/Competition');
const PlayerPoints = require('../../models/PlayerPoints');
const FantasyTeam = require('../../models/FantasyTeam');
const GameRules = require('../../models/GameRules');

// @desc    Create a match
// @route   POST /api/admin/matches
// @access  Admin
exports.createMatch = async (req, res) => {
  try {
    const { competition, matchweek, pair1, pair2, matchDate } = req.body;

    if (!competition || !matchweek || !pair1 || !pair2 || !matchDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide competition, matchweek, pair1, pair2, and matchDate'
      });
    }

    // Validate pairs exist
    const p1 = await Pair.findById(pair1);
    const p2 = await Pair.findById(pair2);
    if (!p1 || !p2) {
      return res.status(404).json({
        success: false,
        message: 'One or both pairs not found'
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

    const match = await Match.create({
      competition,
      matchweek,
      pair1,
      pair2,
      matchDate,
      isCompleted: false,
      pointsCalculated: false
    });

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: await Match.findById(match._id)
        .populate('pair1', 'player1 player2')
        .populate('pair2', 'player1 player2')
        .populate('competition', 'name')
    });
  } catch (error) {
    console.error('Create Match Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating match'
    });
  }
};

// @desc    Get all matches
// @route   GET /api/admin/matches
// @access  Admin
exports.getAllMatches = async (req, res) => {
  try {
    const { competition, matchweek, isCompleted } = req.query;
    const filter = {};

    if (competition) filter.competition = competition;
    if (matchweek) filter.matchweek = parseInt(matchweek);
    if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';

    const matches = await Match.find(filter)
      .populate({
        path: 'pair1',
        populate: { path: 'player1 player2', select: 'name surname' }
      })
      .populate({
        path: 'pair2',
        populate: { path: 'player1 player2', select: 'name surname' }
      })
      .populate('winner', 'player1 player2')
      .populate('competition', 'name')
      .sort({ matchDate: -1, matchweek: -1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Get Matches Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching matches'
    });
  }
};

// @desc    Get single match
// @route   GET /api/admin/matches/:id
// @access  Admin
exports.getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'pair1',
        populate: { path: 'player1 player2', select: 'name surname gender' }
      })
      .populate({
        path: 'pair2',
        populate: { path: 'player1 player2', select: 'name surname gender' }
      })
      .populate('winner', 'player1 player2')
      .populate('competition', 'name');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Get Match Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching match'
    });
  }
};

// @desc    Update match results
// @route   PUT /api/admin/matches/:id/results
// @access  Admin
exports.updateMatchResults = async (req, res) => {
  try {
    const { scores, winner } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (scores) {
      match.scores = scores;
    }

    if (winner) {
      // Validate winner is one of the pairs
      if (winner.toString() !== match.pair1.toString() && 
          winner.toString() !== match.pair2.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Winner must be one of the competing pairs'
        });
      }
      match.winner = winner;
    }

    match.isCompleted = true;
    await match.save();

    // Calculate points for players
    await calculateMatchPoints(match._id);

    res.status(200).json({
      success: true,
      message: 'Match results updated and points calculated',
      data: await Match.findById(match._id)
        .populate({
          path: 'pair1',
          populate: { path: 'player1 player2', select: 'name surname' }
        })
        .populate({
          path: 'pair2',
          populate: { path: 'player1 player2', select: 'name surname' }
        })
        .populate('winner', 'player1 player2')
    });
  } catch (error) {
    console.error('Update Match Results Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating match results'
    });
  }
};

// Helper function to calculate points for a match
async function calculateMatchPoints(matchId) {
  try {
    const match = await Match.findById(matchId)
      .populate('pair1')
      .populate('pair2')
      .populate('competition');

    if (!match || !match.isCompleted || !match.winner) {
      return;
    }

    const competition = match.competition;
    const gameRules = await GameRules.findOne({ competition: competition._id });
    if (!gameRules) {
      console.error('Game rules not found for competition');
      return;
    }

    const pair1Won = match.winner.toString() === match.pair1._id.toString();
    const pair2Won = !pair1Won;

    // Calculate sets won
    const pair1SetsWon = calculateSetsWon(match.scores, 1);
    const pair2SetsWon = calculateSetsWon(match.scores, 2);

    // Points for each player in pair1
    const pair1Player1Points = calculatePlayerPoints(
      pair1Won,
      pair1SetsWon,
      pair2SetsWon,
      gameRules
    );
    const pair1Player2Points = calculatePlayerPoints(
      pair1Won,
      pair1SetsWon,
      pair2SetsWon,
      gameRules
    );

    // Points for each player in pair2
    const pair2Player1Points = calculatePlayerPoints(
      pair2Won,
      pair2SetsWon,
      pair1SetsWon,
      gameRules
    );
    const pair2Player2Points = calculatePlayerPoints(
      pair2Won,
      pair2SetsWon,
      pair1SetsWon,
      gameRules
    );

    // Save points for each player
    const players = [
      { id: match.pair1.player1, points: pair1Player1Points, won: pair1Won, setsWon: pair1SetsWon, setsLost: pair2SetsWon },
      { id: match.pair1.player2, points: pair1Player2Points, won: pair1Won, setsWon: pair1SetsWon, setsLost: pair2SetsWon },
      { id: match.pair2.player1, points: pair2Player1Points, won: pair2Won, setsWon: pair2SetsWon, setsLost: pair1SetsWon },
      { id: match.pair2.player2, points: pair2Player2Points, won: pair2Won, setsWon: pair2SetsWon, setsLost: pair1SetsWon }
    ];

    for (const playerData of players) {
      await PlayerPoints.findOneAndUpdate(
        {
          player: playerData.id,
          match: match._id,
          competition: competition._id,
          matchweek: match.matchweek
        },
        {
          player: playerData.id,
          match: match._id,
          competition: competition._id,
          matchweek: match.matchweek,
          points: playerData.points.total,
          breakdown: {
            winPoints: playerData.points.winPoints,
            lossPoints: playerData.points.lossPoints,
            setWinPoints: playerData.points.setWinPoints,
            setLossPoints: playerData.points.setLossPoints
          }
        },
        { upsert: true, new: true }
      );
    }

    match.pointsCalculated = true;
    await match.save();

    // Update fantasy teams
    await updateFantasyTeamsForMatch(match.matchweek, competition._id);
  } catch (error) {
    console.error('Calculate Match Points Error:', error);
    throw error;
  }
}

function calculateSetsWon(scores, pairNumber) {
  let setsWon = 0;
  const sets = ['set1', 'set2', 'set3'];
  
  for (const set of sets) {
    if (scores[set]) {
      const pairScore = pairNumber === 1 ? scores[set].pair1Score : scores[set].pair2Score;
      const opponentScore = pairNumber === 1 ? scores[set].pair2Score : scores[set].pair1Score;
      if (pairScore > opponentScore) {
        setsWon++;
      }
    }
  }
  
  return setsWon;
}

function calculatePlayerPoints(won, setsWon, setsLost, gameRules) {
  const winPoints = won ? (gameRules.scoringRules.winPoints || 10) : 0;
  const lossPoints = !won ? (gameRules.scoringRules.lossPoints || 5) : 0;
  const setWinPoints = setsWon * (gameRules.scoringRules.setWinPoints || 3);
  const setLossPoints = setsLost * (gameRules.scoringRules.setLossPoints || 1);

  return {
    winPoints,
    lossPoints,
    setWinPoints,
    setLossPoints,
    total: winPoints + lossPoints + setWinPoints + setLossPoints
  };
}

async function updateFantasyTeamsForMatch(matchweek, competitionId) {
  try {
    const fantasyTeams = await FantasyTeam.find({ competition: competitionId });
    
    for (const team of fantasyTeams) {
      const playerPoints = await PlayerPoints.find({
        competition: competitionId,
        matchweek: matchweek,
        player: { $in: [...team.starters, ...team.bench] }
      });

      let weeklyPoints = 0;
      let startersPoints = 0;
      let benchPoints = 0;

      for (const pp of playerPoints) {
        weeklyPoints += pp.points;
        if (team.starters.some(s => s.toString() === pp.player.toString())) {
          startersPoints += pp.points;
        } else if (team.bench.some(b => b.toString() === pp.player.toString())) {
          benchPoints += pp.points;
        }
      }

      // Update or create weekly points entry
      const weekIndex = team.weeklyPoints.findIndex(wp => wp.matchweek === matchweek);
      if (weekIndex >= 0) {
        team.weeklyPoints[weekIndex].points = weeklyPoints;
        team.weeklyPoints[weekIndex].startersPoints = startersPoints;
        team.weeklyPoints[weekIndex].benchPoints = benchPoints;
      } else {
        team.weeklyPoints.push({
          matchweek,
          points: weeklyPoints,
          startersPoints,
          benchPoints
        });
      }

      team.totalPoints = team.weeklyPoints.reduce((sum, wp) => sum + wp.points, 0);
      await team.save();
    }
  } catch (error) {
    console.error('Update Fantasy Teams Error:', error);
    throw error;
  }
}

// @desc    Recalculate match points
// @route   POST /api/admin/matches/:id/recalculate
// @access  Admin
exports.recalculateMatchPoints = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Delete existing points
    await PlayerPoints.deleteMany({ match: match._id });

    // Recalculate
    await calculateMatchPoints(match._id);

    res.status(200).json({
      success: true,
      message: 'Match points recalculated successfully'
    });
  } catch (error) {
    console.error('Recalculate Match Points Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error recalculating match points'
    });
  }
};

// @desc    Delete match
// @route   DELETE /api/admin/matches/:id
// @access  Admin
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Delete associated points
    await PlayerPoints.deleteMany({ match: match._id });

    await Match.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Delete Match Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting match'
    });
  }
};

