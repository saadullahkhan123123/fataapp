const mongoose = require('mongoose');

const pairSchema = new mongoose.Schema(
  {
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player 1 is required']
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player 2 is required']
    },
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: [true, 'Competition is required']
    },
    matchweek: {
      type: Number,
      required: [true, 'Matchweek is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes
pairSchema.index({ competition: 1, matchweek: 1 });
pairSchema.index({ player1: 1, player2: 1 });

module.exports = mongoose.models.Pair || mongoose.model('Pair', pairSchema);

