const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminMiddleware = require('../middleware/adminMiddleware');

// Configure multer for CSV upload
const upload = multer({ storage: multer.memoryStorage() });

// Player Management Routes
const playerController = require('../controllers/admin/playerController');
router.post('/players', adminMiddleware, playerController.createPlayer);
router.get('/players', adminMiddleware, playerController.getAllPlayers);
router.get('/players/:id', adminMiddleware, playerController.getPlayer);
router.put('/players/:id', adminMiddleware, playerController.updatePlayer);
router.delete('/players/:id', adminMiddleware, playerController.deletePlayer);
router.post('/players/upload-csv', adminMiddleware, upload.single('file'), playerController.uploadPlayersCSV);
router.post('/players/:playerId/assign-competition', adminMiddleware, playerController.assignPlayerToCompetition);
router.delete('/players/:playerId/competitions/:competitionId', adminMiddleware, playerController.removePlayerFromCompetition);

// Season Management Routes
const seasonController = require('../controllers/admin/seasonController');
router.post('/seasons', adminMiddleware, seasonController.createSeason);
router.get('/seasons', adminMiddleware, seasonController.getAllSeasons);
router.get('/seasons/:id', adminMiddleware, seasonController.getSeason);
router.put('/seasons/:id', adminMiddleware, seasonController.updateSeason);
router.delete('/seasons/:id', adminMiddleware, seasonController.deleteSeason);

// Competition Management Routes
const competitionController = require('../controllers/admin/competitionController');
router.post('/competitions', adminMiddleware, competitionController.createCompetition);
router.get('/competitions', adminMiddleware, competitionController.getAllCompetitions);
router.get('/competitions/:id', adminMiddleware, competitionController.getCompetition);
router.put('/competitions/:id', adminMiddleware, competitionController.updateCompetition);
router.delete('/competitions/:id', adminMiddleware, competitionController.deleteCompetition);
router.post('/competitions/:id/matchweeks', adminMiddleware, competitionController.addMatchweek);
router.put('/competitions/:id/matchweeks/:weekNumber', adminMiddleware, competitionController.updateMatchweek);

// Pair Management Routes
const pairController = require('../controllers/admin/pairController');
router.post('/pairs', adminMiddleware, pairController.createPair);
router.post('/pairs/bulk', adminMiddleware, pairController.createBulkPairs);
router.get('/pairs', adminMiddleware, pairController.getAllPairs);
router.get('/pairs/:id', adminMiddleware, pairController.getPair);
router.put('/pairs/:id', adminMiddleware, pairController.updatePair);
router.delete('/pairs/:id', adminMiddleware, pairController.deletePair);

// Match Management Routes
const matchController = require('../controllers/admin/matchController');
router.post('/matches', adminMiddleware, matchController.createMatch);
router.get('/matches', adminMiddleware, matchController.getAllMatches);
router.get('/matches/:id', adminMiddleware, matchController.getMatch);
router.put('/matches/:id/results', adminMiddleware, matchController.updateMatchResults);
router.post('/matches/:id/recalculate', adminMiddleware, matchController.recalculateMatchPoints);
router.delete('/matches/:id', adminMiddleware, matchController.deleteMatch);

// Game Rules Routes
const gameRulesController = require('../controllers/admin/gameRulesController');
router.get('/game-rules', adminMiddleware, gameRulesController.getAllGameRules);
router.get('/game-rules/:competitionId', adminMiddleware, gameRulesController.getGameRules);
router.put('/game-rules/:competitionId', adminMiddleware, gameRulesController.updateGameRules);

// User Monitoring Routes
const userMonitoringController = require('../controllers/admin/userMonitoringController');
router.get('/users', adminMiddleware, userMonitoringController.getAllUsers);
router.get('/users/:id', adminMiddleware, userMonitoringController.getUserProfile);
router.get('/users/:id/fantasy-teams', adminMiddleware, userMonitoringController.getUserFantasyTeams);
router.get('/users/:userId/fantasy-teams/:teamId', adminMiddleware, userMonitoringController.getFantasyTeamDetails);
router.post('/users/:userId/fantasy-teams/:teamId/reset', adminMiddleware, userMonitoringController.resetFantasyTeam);
router.put('/users/:userId/fantasy-teams/:teamId/change-player', adminMiddleware, userMonitoringController.changePlayerInTeam);
router.put('/users/:id/block', adminMiddleware, userMonitoringController.blockUser);
router.get('/competitions/:competitionId/leaderboard', adminMiddleware, userMonitoringController.getLeaderboard);

// Price Management Routes
const priceController = require('../controllers/admin/priceController');
router.get('/prices', adminMiddleware, priceController.getAllPrices);
router.get('/prices/:playerId/history', adminMiddleware, priceController.getPriceHistory);
router.put('/prices/:playerId', adminMiddleware, priceController.updatePlayerPrice);
router.post('/prices/recalculate', adminMiddleware, priceController.recalculatePrices);
router.post('/prices/bulk-update', adminMiddleware, priceController.bulkUpdatePrices);

// Monitoring & Error Control Routes
const monitoringController = require('../controllers/admin/monitoringController');
router.get('/monitoring/squads', adminMiddleware, monitoringController.getAllSquads);
router.get('/monitoring/player-scores', adminMiddleware, monitoringController.getPlayerScores);
router.get('/monitoring/anomalies', adminMiddleware, monitoringController.detectAnomalies);
router.post('/monitoring/fix-errors', adminMiddleware, monitoringController.fixErrors);
router.get('/monitoring/dashboard', adminMiddleware, monitoringController.getDashboard);

// Private League Management Routes
const privateLeagueController = require('../controllers/admin/privateLeagueController');
router.get('/private-leagues', adminMiddleware, privateLeagueController.getAllPrivateLeagues);
router.get('/private-leagues/:id', adminMiddleware, privateLeagueController.getPrivateLeague);
router.get('/private-leagues/:id/participants', adminMiddleware, privateLeagueController.getLeagueParticipants);
router.put('/private-leagues/:id', adminMiddleware, privateLeagueController.updatePrivateLeague);
router.delete('/private-leagues/:id', adminMiddleware, privateLeagueController.deletePrivateLeague);
router.delete('/private-leagues/:leagueId/users/:userId', adminMiddleware, privateLeagueController.removeUserFromLeague);
router.put('/users/:userId/block-account', adminMiddleware, privateLeagueController.blockUserAccount);

// Public League Management Routes
const publicLeagueController = require('../controllers/admin/publicLeagueController');
router.get('/public-leagues', adminMiddleware, publicLeagueController.getAllPublicLeagues);
router.get('/public-leagues/:id', adminMiddleware, publicLeagueController.getPublicLeague);
router.get('/public-leagues/:id/participants', adminMiddleware, publicLeagueController.getLeagueParticipants);
router.put('/public-leagues/:id', adminMiddleware, publicLeagueController.updatePublicLeague);
router.delete('/public-leagues/:id', adminMiddleware, publicLeagueController.deletePublicLeague);
router.delete('/public-leagues/:leagueId/users/:userId', adminMiddleware, publicLeagueController.removeUserFromLeague);

// Purchase/Package Management Routes (REAL approval flow)
const packPurchaseAdminController = require('../controllers/admin/packPurchaseController');
router.get('/purchases', adminMiddleware, packPurchaseAdminController.getAllPurchases);
router.post('/purchases/:id/approve', adminMiddleware, packPurchaseAdminController.approvePurchase);
router.post('/purchases/:id/reject', adminMiddleware, packPurchaseAdminController.rejectPurchase);

// Team-management module (v2)
const adminTeamV2 = require('../controllers/admin/teamControllerV2');
router.get('/teams-v2', adminMiddleware, adminTeamV2.getAllTeams);
router.get('/teams-v2/:id', adminMiddleware, adminTeamV2.getTeam);
router.post('/teams-v2/:id/assign-player', adminMiddleware, adminTeamV2.assignPlayer);
router.post('/teams-v2/:id/remove-player', adminMiddleware, adminTeamV2.removePlayer);

const adminPlayerProfilesV2 = require('../controllers/admin/playerProfileControllerV2');
router.get('/player-profiles', adminMiddleware, adminPlayerProfilesV2.getAllPlayerProfiles);

const adminManagedLeaguesV2 = require('../controllers/admin/managedLeagueControllerV2');
router.post('/managed-leagues', adminMiddleware, adminManagedLeaguesV2.createLeague);
router.get('/managed-leagues', adminMiddleware, adminManagedLeaguesV2.getAllLeagues);
router.get('/managed-leagues/:id', adminMiddleware, adminManagedLeaguesV2.getLeague);
router.put('/managed-leagues/:id', adminMiddleware, adminManagedLeaguesV2.updateLeague);
router.delete('/managed-leagues/:id', adminMiddleware, adminManagedLeaguesV2.deleteLeague);

router.get('/league-join-requests', adminMiddleware, adminManagedLeaguesV2.getJoinRequests);
router.post('/league-join-requests/:id/approve', adminMiddleware, adminManagedLeaguesV2.approveJoinRequest);
router.post('/league-join-requests/:id/reject', adminMiddleware, adminManagedLeaguesV2.rejectJoinRequest);

const adminLeagueMatchesV2 = require('../controllers/admin/leagueMatchControllerV2');
router.post('/league-matches', adminMiddleware, adminLeagueMatchesV2.createMatch);
router.get('/league-matches', adminMiddleware, adminLeagueMatchesV2.getAllMatches);
router.post('/league-matches/:id/lock', adminMiddleware, adminLeagueMatchesV2.lockMatch);
router.put('/league-matches/:id/result', adminMiddleware, adminLeagueMatchesV2.updateResult);

module.exports = router;

