const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Season name is required'],
      trim: true,
      unique: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Season || mongoose.model('Season', seasonSchema);

