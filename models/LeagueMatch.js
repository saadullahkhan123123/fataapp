const mongoose = require('mongoose');

const leagueMatchSchema = new mongoose.Schema(
  {
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedLeague', required: true, index: true },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },

    scheduledAt: { type: Date, required: true, index: true },
    lockAt: { type: Date, default: null },
    status: { type: String, enum: ['upcoming', 'locked', 'completed'], default: 'upcoming', index: true },

    // Exactly 4 active players per team for the match lineup (set by team creators, locked before start)
    lineupA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile' }],
    lineupB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile' }],

    // Optional results (admin controlled)
    score: { type: String, default: '' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    isCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

leagueMatchSchema.index({ league: 1, scheduledAt: 1 });

module.exports = mongoose.models.LeagueMatch || mongoose.model('LeagueMatch', leagueMatchSchema);


