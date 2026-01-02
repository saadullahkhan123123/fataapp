const PackPurchase = require('../../models/PackPurchase');
const User = require('../../models/User');

// GET /api/admin/purchases?status=pending|approved|rejected
exports.getAllPurchases = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const purchases = await PackPurchase.find(filter)
      .populate('user', 'username email')
      .populate('approvedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/purchases/:id/approve
exports.approvePurchase = async (req, res, next) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    const purchase = await PackPurchase.findById(id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    if (purchase.status === 'approved') {
      return res.json({ success: true, message: 'Already approved', data: purchase });
    }
    if (purchase.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Purchase already rejected' });
    }

    const user = await User.findById(purchase.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Apply credits after admin approval
    user.credits = (user.credits || 0) + (purchase.credits || 0);
    user.freePlayers = (user.freePlayers || 0) + (purchase.freePlayers || 0);
    await user.save();

    purchase.status = 'approved';
    purchase.reviewedBy = admin._id;
    purchase.reviewedAt = new Date();
    purchase.approvedBy = admin._id;
    purchase.approvedAt = new Date();
    purchase.rejectionReason = null;
    await purchase.save();

    res.json({ success: true, message: 'Purchase approved', data: purchase });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/purchases/:id/reject
exports.rejectPurchase = async (req, res, next) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const purchase = await PackPurchase.findById(id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    if (purchase.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Purchase already approved' });
    }
    if (purchase.status === 'rejected') {
      return res.json({ success: true, message: 'Already rejected', data: purchase });
    }

    purchase.status = 'rejected';
    purchase.reviewedBy = admin._id;
    purchase.reviewedAt = new Date();
    purchase.rejectionReason = reason || 'Rejected by admin';
    await purchase.save();

    res.json({ success: true, message: 'Purchase rejected', data: purchase });
  } catch (err) {
    next(err);
  }
};


