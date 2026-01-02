const mongoose = require('mongoose');

const gameRulesSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: [true, 'Competition is required'],
      unique: true
    },
    initialBudget: {
      type: Number,
      required: [true, 'Initial budget is required'],
      min: 0
    },
    minPlayers: {
      type: Number,
      default: 1,
      min: 1
    },
    maxPlayers: {
      type: Number,
      default: null // null means no limit
    },
    maxTopPlayers: {
      type: Number,
      default: null
    },
    perGenderLimits: {
      male: {
        type: Number,
        default: null
      },
      female: {
        type: Number,
        default: null
      }
    },
    transferRules: {
      changesAllowed: {
        type: Number,
        default: -1 // -1 means unlimited
      },
      transferWindowOpen: {
        type: Date,
        default: null
      },
      transferWindowClose: {
        type: Date,
        default: null
      }
    },
    scoringRules: {
      winPoints: {
        type: Number,
        default: 10
      },
      lossPoints: {
        type: Number,
        default: 5
      },
      setWinPoints: {
        type: Number,
        default: 3
      },
      setLossPoints: {
        type: Number,
        default: 1
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.GameRules || mongoose.model('GameRules', gameRulesSchema);

