const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true
    },
    surname: {
      type: String,
      required: [true, 'Player surname is required'],
      trim: true
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    initialPrice: {
      type: Number,
      required: [true, 'Initial price is required'],
      min: 0
    },
    currentPrice: {
      type: Number,
      default: function() {
        return this.initialPrice;
      },
      min: 0
    },
    initialRating: {
      type: Number,
      required: [true, 'Initial rating is required'],
      min: 0,
      max: 100
    },
    currentRating: {
      type: Number,
      default: function() {
        return this.initialRating;
      },
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    position: {
      type: Number,
      default: null // Position in the ordered list (weakest → strongest)
    },
    competitions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition'
    }],
    totalPoints: {
      type: Number,
      default: 0
    },
    matchesPlayed: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Index for efficient queries
playerSchema.index({ position: 1 });
playerSchema.index({ isActive: 1 });
playerSchema.index({ competitions: 1 });

module.exports = mongoose.models.Player || mongoose.model('Player', playerSchema);

