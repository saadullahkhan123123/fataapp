const FantasyTeam = require('../../models/FantasyTeam');
const PlayerPoints = require('../../models/PlayerPoints');
const Match = require('../../models/Match');
const Competition = require('../../models/Competition');
const Player = require('../../models/Player');

// @desc    Get all squads for a matchweek
// @route   GET /api/admin/monitoring/squads
// @access  Admin
exports.getAllSquads = async (req, res) => {
  try {
    const { competition, matchweek } = req.query;

    if (!competition || !matchweek) {
      return res.status(400).json({
        success: false,
        message: 'Please provide competition and matchweek'
      });
    }

    const teams = await FantasyTeam.find({ competition })
      .populate('user', 'username email')
      .populate('starters', 'name surname gender category')
      .populate('bench', 'name surname gender category');

    const weeklyPoints = await PlayerPoints.find({
      competition,
      matchweek: parseInt(matchweek)
    }).populate('player', 'name surname');

    const squads = teams.map(team => {
      const teamWeeklyPoints = weeklyPoints.filter(pp =>
        team.starters.some(s => s._id.toString() === pp.player._id.toString()) ||
        team.bench.some(b => b._id.toString() === pp.player._id.toString())
      );

      const weekEntry = team.weeklyPoints.find(wp => wp.matchweek === parseInt(matchweek));

      return {
        user: team.user,
        starters: team.starters,
        bench: team.bench,
        weeklyPoints: weekEntry ? weekEntry.points : 0,
        startersPoints: weekEntry ? weekEntry.startersPoints : 0,
        benchPoints: weekEntry ? weekEntry.benchPoints : 0,
        playerPoints: teamWeeklyPoints
      };
    });

    res.status(200).json({
      success: true,
      count: squads.length,
      data: squads
    });
  } catch (error) {
    console.error('Get All Squads Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching squads'
    });
  }
};

// @desc    Get player scores and total points
// @route   GET /api/admin/monitoring/player-scores
// @access  Admin
exports.getPlayerScores = async (req, res) => {
  try {
    const { competition, matchweek } = req.query;
    const filter = {};

    if (competition) filter.competition = competition;
    if (matchweek) filter.matchweek = parseInt(matchweek);

    const playerPoints = await PlayerPoints.find(filter)
      .populate('player', 'name surname gender category')
      .populate('match', 'matchDate')
      .sort({ points: -1 });

    // Aggregate total points per player
    const playerTotals = {};
    for (const pp of playerPoints) {
      const playerId = pp.player._id.toString();
      if (!playerTotals[playerId]) {
        playerTotals[playerId] = {
          player: pp.player,
          totalPoints: 0,
          matches: [],
          breakdown: {
            winPoints: 0,
            lossPoints: 0,
            setWinPoints: 0,
            setLossPoints: 0
          }
        };
      }
      playerTotals[playerId].totalPoints += pp.points;
      playerTotals[playerId].matches.push({
        match: pp.match,
        points: pp.points,
        breakdown: pp.breakdown
      });
      playerTotals[playerId].breakdown.winPoints += pp.breakdown.winPoints;
      playerTotals[playerId].breakdown.lossPoints += pp.breakdown.lossPoints;
      playerTotals[playerId].breakdown.setWinPoints += pp.breakdown.setWinPoints;
      playerTotals[playerId].breakdown.setLossPoints += pp.breakdown.setLossPoints;
    }

    const result = Object.values(playerTotals).sort((a, b) => b.totalPoints - a.totalPoints);

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Get Player Scores Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching player scores'
    });
  }
};

// @desc    Detect anomalies in results and points
// @route   GET /api/admin/monitoring/anomalies
// @access  Admin
exports.detectAnomalies = async (req, res) => {
  try {
    const { competition, matchweek } = req.query;
    const filter = {};

    if (competition) filter.competition = competition;
    if (matchweek) filter.matchweek = parseInt(matchweek);

    const anomalies = [];

    // Check for matches without results
    const matchesWithoutResults = await Match.find({
      ...filter,
      isCompleted: false
    }).populate('pair1 pair2', 'player1 player2');

    if (matchesWithoutResults.length > 0) {
      anomalies.push({
        type: 'matches_without_results',
        count: matchesWithoutResults.length,
        matches: matchesWithoutResults
      });
    }

    // Check for matches with results but points not calculated
    const matchesWithoutPoints = await Match.find({
      ...filter,
      isCompleted: true,
      pointsCalculated: false
    }).populate('pair1 pair2', 'player1 player2');

    if (matchesWithoutPoints.length > 0) {
      anomalies.push({
        type: 'matches_without_points',
        count: matchesWithoutPoints.length,
        matches: matchesWithoutPoints
      });
    }

    // Check for players with zero points in completed matches
    const completedMatches = await Match.find({
      ...filter,
      isCompleted: true
    }).select('_id');

    const matchIds = completedMatches.map(m => m._id);
    const playerPoints = await PlayerPoints.find({
      match: { $in: matchIds }
    });

    const playersWithZeroPoints = [];
    for (const match of completedMatches) {
      const matchPoints = playerPoints.filter(pp => pp.match.toString() === match._id.toString());
      if (matchPoints.length === 0) {
        playersWithZeroPoints.push(match._id);
      }
    }

    if (playersWithZeroPoints.length > 0) {
      anomalies.push({
        type: 'matches_without_player_points',
        count: playersWithZeroPoints.length,
        matchIds: playersWithZeroPoints
      });
    }

    // Check for fantasy teams with inconsistent points
    const teams = await FantasyTeam.find(filter.competition ? { competition: filter.competition } : {});
    const inconsistentTeams = [];

    for (const team of teams) {
      const calculatedTotal = team.weeklyPoints.reduce((sum, wp) => sum + wp.points, 0);
      if (Math.abs(calculatedTotal - team.totalPoints) > 0.01) {
        inconsistentTeams.push({
          teamId: team._id,
          userId: team.user,
          calculatedTotal,
          storedTotal: team.totalPoints,
          difference: calculatedTotal - team.totalPoints
        });
      }
    }

    if (inconsistentTeams.length > 0) {
      anomalies.push({
        type: 'inconsistent_fantasy_points',
        count: inconsistentTeams.length,
        teams: inconsistentTeams
      });
    }

    res.status(200).json({
      success: true,
      count: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    console.error('Detect Anomalies Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error detecting anomalies'
    });
  }
};

// @desc    Fix errors and recalculate
// @route   POST /api/admin/monitoring/fix-errors
// @access  Admin
exports.fixErrors = async (req, res) => {
  try {
    const { competition, matchweek, fixType } = req.body;

    if (!fixType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fixType (recalculate_match_points, recalculate_fantasy_points, or both)'
      });
    }

    const fixes = [];

    if (fixType === 'recalculate_match_points' || fixType === 'both') {
      const filter = { isCompleted: true };
      if (competition) filter.competition = competition;
      if (matchweek) filter.matchweek = parseInt(matchweek);

      const matches = await Match.find(filter);
      const GameRules = require('../../models/GameRules');

      for (const match of matches) {
        try {
          // Delete existing points
          await PlayerPoints.deleteMany({ match: match._id });
          match.pointsCalculated = false;
          await match.save();

          // Recalculate using the same logic from matchController
          const matchPopulated = await Match.findById(match._id)
            .populate('pair1')
            .populate('pair2')
            .populate('competition');

          if (matchPopulated && matchPopulated.isCompleted && matchPopulated.winner) {
            const gameRules = await GameRules.findOne({ competition: matchPopulated.competition._id });
            if (gameRules) {
              const pair1Won = matchPopulated.winner.toString() === matchPopulated.pair1._id.toString();
              const pair2Won = !pair1Won;

              // Calculate sets won
              const calculateSetsWon = (scores, pairNumber) => {
                let setsWon = 0;
                const sets = ['set1', 'set2', 'set3'];
                for (const set of sets) {
                  if (scores[set]) {
                    const pairScore = pairNumber === 1 ? scores[set].pair1Score : scores[set].pair2Score;
                    const opponentScore = pairNumber === 1 ? scores[set].pair2Score : scores[set].pair1Score;
                    if (pairScore > opponentScore) setsWon++;
                  }
                }
                return setsWon;
              };

              const pair1SetsWon = calculateSetsWon(matchPopulated.scores, 1);
              const pair2SetsWon = calculateSetsWon(matchPopulated.scores, 2);

              const calculatePlayerPoints = (won, setsWon, setsLost) => {
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
              };

              const players = [
                { id: matchPopulated.pair1.player1, points: calculatePlayerPoints(pair1Won, pair1SetsWon, pair2SetsWon) },
                { id: matchPopulated.pair1.player2, points: calculatePlayerPoints(pair1Won, pair1SetsWon, pair2SetsWon) },
                { id: matchPopulated.pair2.player1, points: calculatePlayerPoints(pair2Won, pair2SetsWon, pair1SetsWon) },
                { id: matchPopulated.pair2.player2, points: calculatePlayerPoints(pair2Won, pair2SetsWon, pair1SetsWon) }
              ];

              for (const playerData of players) {
                await PlayerPoints.findOneAndUpdate(
                  {
                    player: playerData.id,
                    match: matchPopulated._id,
                    competition: matchPopulated.competition._id,
                    matchweek: matchPopulated.matchweek
                  },
                  {
                    player: playerData.id,
                    match: matchPopulated._id,
                    competition: matchPopulated.competition._id,
                    matchweek: matchPopulated.matchweek,
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

              matchPopulated.pointsCalculated = true;
              await matchPopulated.save();

              // Update fantasy teams
              const fantasyTeams = await FantasyTeam.find({ competition: matchPopulated.competition._id });
              for (const team of fantasyTeams) {
                const playerPoints = await PlayerPoints.find({
                  competition: matchPopulated.competition._id,
                  matchweek: matchPopulated.matchweek,
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

                const weekIndex = team.weeklyPoints.findIndex(wp => wp.matchweek === matchPopulated.matchweek);
                if (weekIndex >= 0) {
                  team.weeklyPoints[weekIndex].points = weeklyPoints;
                  team.weeklyPoints[weekIndex].startersPoints = startersPoints;
                  team.weeklyPoints[weekIndex].benchPoints = benchPoints;
                } else {
                  team.weeklyPoints.push({
                    matchweek: matchPopulated.matchweek,
                    points: weeklyPoints,
                    startersPoints,
                    benchPoints
                  });
                }

                team.totalPoints = team.weeklyPoints.reduce((sum, wp) => sum + wp.points, 0);
                await team.save();
              }
            }
          }

          fixes.push({ type: 'match_points', matchId: match._id });
        } catch (error) {
          console.error(`Error fixing match ${match._id}:`, error);
        }
      }
    }

    if (fixType === 'recalculate_fantasy_points' || fixType === 'both') {
      const filter = {};
      if (competition) filter.competition = competition;

      const teams = await FantasyTeam.find(filter);

      for (const team of teams) {
        try {
          // Recalculate total from weekly points
          team.totalPoints = team.weeklyPoints.reduce((sum, wp) => sum + wp.points, 0);
          await team.save();

          fixes.push({ type: 'fantasy_points', teamId: team._id });
        } catch (error) {
          console.error(`Error fixing team ${team._id}:`, error);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed ${fixes.length} errors`,
      data: {
        fixes
      }
    });
  } catch (error) {
    console.error('Fix Errors Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fixing errors'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/monitoring/dashboard
// @access  Admin
exports.getDashboard = async (req, res) => {
  try {
    const { competition } = req.query;

    const stats = {
      competitions: await Competition.countDocuments(competition ? { _id: competition } : {}),
      players: await Player.countDocuments({ isActive: true }),
      users: await (require('../../models/User')).countDocuments(),
      fantasyTeams: await FantasyTeam.countDocuments(competition ? { competition } : {}),
      matches: await Match.countDocuments(competition ? { competition } : {}),
      completedMatches: await Match.countDocuments({
        ...(competition ? { competition } : {}),
        isCompleted: true
      })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard'
    });
  }
};

