const mongoose = require('mongoose');

const playerPointsSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player is required']
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: [true, 'Match is required']
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
    points: {
      type: Number,
      default: 0
    },
    breakdown: {
      winPoints: { type: Number, default: 0 },
      lossPoints: { type: Number, default: 0 },
      setWinPoints: { type: Number, default: 0 },
      setLossPoints: { type: Number, default: 0 }
    },
    isRecalculated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes
playerPointsSchema.index({ player: 1, matchweek: 1 });
playerPointsSchema.index({ match: 1 });
playerPointsSchema.index({ competition: 1, matchweek: 1 });

module.exports = mongoose.models.PlayerPoints || mongoose.model('PlayerPoints', playerPointsSchema);

