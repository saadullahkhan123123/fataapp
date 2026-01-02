const mongoose = require('mongoose');

const leagueJoinRequestSchema = new mongoose.Schema(
  {
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedLeague', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

// One request per team per league (prevents spam)
leagueJoinRequestSchema.index({ league: 1, team: 1 }, { unique: true });

module.exports =
  mongoose.models.LeagueJoinRequest || mongoose.model('LeagueJoinRequest', leagueJoinRequestSchema);


