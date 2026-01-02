// controllers/creditsController.js
const PackPurchase = require('../models/PackPurchase');
const { PACKAGES } = require('../config/packages');

// ===============================
// GET /api/credits/packages
// ===============================
exports.getPackages = async (req, res) => {
  try {
    const packages = Object.entries(PACKAGES).map(([key, value]) => ({
      id: key,
      credits: value.credits,
      freePlayers: value.freePlayers,
      price: value.price
    }));
    res.json({ success: true, packages });
  } catch (err) {
    console.error('Get packages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===============================
// POST /api/credits/buy
// body: { package: 'starter'|'medium'|'premium', method: 'google'|'apple' }
//
// NEW BEHAVIOR:
// - creates a pending purchase request (admin must approve)
// - credits are NOT added immediately
// ===============================
exports.buyCredits = async (req, res) => {
  try {
    const { package: pkgKey, method } = req.body;
    const user = req.user;

    if (!pkgKey || !PACKAGES[pkgKey]) {
      return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }
    if (!['google', 'apple'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const pkg = PACKAGES[pkgKey];
    const purchase = await PackPurchase.create({
      user: user._id,
      packageKey: pkgKey,
      gateway: method,
      transactionId: `sim_${method}_${Date.now()}_${user._id}`,
      amount: pkg.price,
      currency: 'usd',
      credits: pkg.credits,
      freePlayers: pkg.freePlayers,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Purchase request sent to admin for approval',
      data: purchase
    });
  } catch (err) {
    console.error('Buy credits error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/credits/my-purchases
exports.getMyPurchases = async (req, res) => {
  try {
    const user = req.user;
    const purchases = await PackPurchase.find({ user: user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    console.error('Get purchases error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
