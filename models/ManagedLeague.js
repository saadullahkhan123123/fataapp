const mongoose = require('mongoose');

const managedLeagueSchema = new mongoose.Schema(
  {
    leagueName: { type: String, required: true, trim: true },
    country: { type: String, default: '', trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rules: { type: String, default: '' },
    limits: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'in_progress', 'finished'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

managedLeagueSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.models.ManagedLeague || mongoose.model('ManagedLeague', managedLeagueSchema);


