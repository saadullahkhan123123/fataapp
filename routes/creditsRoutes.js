// routes/creditsRoutes.js
const express = require('express');
const router = express.Router();
const { getPackages, buyCredits, getMyPurchases } = require('../controllers/creditsController');
const protect = require('../middleware/auth');

// Public route: list available packages
router.get('/packages', getPackages);

// Protected route: buy a package (requires JWT)
router.post('/buy', protect, buyCredits);

// Protected route: view my purchase requests
router.get('/my-purchases', protect, getMyPurchases);

module.exports = router;
