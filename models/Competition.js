const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Competition name is required'],
      trim: true
    },
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season',
      required: [true, 'Season is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'finished'],
      default: 'upcoming'
    },
    weight: {
      type: String,
      enum: ['Gold', 'Platinum', 'Silver', 'Bronze'],
      default: 'Silver'
    },
    multiplier: {
      type: Number,
      default: 1.0,
      min: 0.1
    },
    deadlineForChanges: {
      type: Date,
      required: [true, 'Deadline for squad changes is required']
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: 0
    },
    totalSquadSize: {
      type: Number,
      required: [true, 'Total squad size is required'],
      min: 1
    },
    startersCount: {
      type: Number,
      required: [true, 'Number of starters is required'],
      min: 1
    },
    benchCount: {
      type: Number,
      required: [true, 'Number of bench players is required'],
      min: 0
    },
    genderRules: {
      type: String,
      enum: ['men', 'women', 'mixed'],
      default: 'mixed'
    },
    matchweeks: [{
      weekNumber: {
        type: Number,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      formationDeadline: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ['upcoming', 'in_progress', 'finished'],
        default: 'upcoming'
      }
    }],
    maxTopPlayers: {
      type: Number,
      default: null // null means no limit
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
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }]
  },
  { timestamps: true }
);

// Indexes
competitionSchema.index({ season: 1 });
competitionSchema.index({ status: 1 });
competitionSchema.index({ startDate: 1 });

module.exports = mongoose.models.Competition || mongoose.model('Competition', competitionSchema);

