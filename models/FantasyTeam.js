const mongoose = require('mongoose');

const fantasyTeamSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: [true, 'Competition is required']
    },
    starters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }],
    bench: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }],
    totalPoints: {
      type: Number,
      default: 0
    },
    weeklyPoints: [{
      matchweek: {
        type: Number,
        required: true
      },
      points: {
        type: Number,
        default: 0
      },
      startersPoints: {
        type: Number,
        default: 0
      },
      benchPoints: {
        type: Number,
        default: 0
      }
    }],
    transfersUsed: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Unique constraint: one team per user per competition
fantasyTeamSchema.index({ user: 1, competition: 1 }, { unique: true });

module.exports = mongoose.models.FantasyTeam || mongoose.model('FantasyTeam', fantasyTeamSchema);

