const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player is required']
    },
    oldPrice: {
      type: Number,
      required: true
    },
    newPrice: {
      type: Number,
      required: true
    },
    changeReason: {
      type: String,
      enum: ['automatic', 'manual', 'performance'],
      default: 'automatic'
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null means automatic
    }
  },
  { timestamps: true }
);

// Indexes
priceHistorySchema.index({ player: 1, createdAt: -1 });

module.exports = mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);

