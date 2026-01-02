const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: [true, 'Competition is required']
    },
    matchweek: {
      type: Number,
      required: [true, 'Matchweek is required']
    },
    pair1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pair',
      required: [true, 'Pair 1 is required']
    },
    pair2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pair',
      required: [true, 'Pair 2 is required']
    },
    scores: {
      set1: {
        pair1Score: { type: Number, default: 0 },
        pair2Score: { type: Number, default: 0 }
      },
      set2: {
        pair1Score: { type: Number, default: 0 },
        pair2Score: { type: Number, default: 0 }
      },
      set3: {
        pair1Score: { type: Number, default: 0 },
        pair2Score: { type: Number, default: 0 }
      }
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pair',
      default: null
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    matchDate: {
      type: Date,
      required: [true, 'Match date is required']
    },
    pointsCalculated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes
matchSchema.index({ competition: 1, matchweek: 1 });
matchSchema.index({ isCompleted: 1, pointsCalculated: 1 });

module.exports = mongoose.models.Match || mongoose.model('Match', matchSchema);

