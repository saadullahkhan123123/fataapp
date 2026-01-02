const mongoose = require('mongoose');

const packPurchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    packageKey: { type: String, enum: ['starter', 'medium', 'premium'], required: true, index: true },

    // Payment info (simulated or Stripe)
    gateway: { type: String, enum: ['google', 'apple', 'stripe', 'manual'], required: true },
    transactionId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },

    // What user will receive after approval
    credits: { type: Number, required: true, min: 0 },
    freePlayers: { type: Number, required: true, min: 0 },

    // Approval workflow
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }
  },
  { timestamps: true }
);

// Prevent duplicate purchase records for the same gateway transaction (idempotency)
packPurchaseSchema.index({ gateway: 1, transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.PackPurchase || mongoose.model('PackPurchase', packPurchaseSchema);


