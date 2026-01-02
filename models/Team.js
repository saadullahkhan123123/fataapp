const mongoose = require('mongoose');

const teamPlayerSchema = new mongoose.Schema(
  {
    playerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayerProfile', required: true },
    status: { type: String, enum: ['active', 'reserve'], default: 'reserve' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    teamName: { type: String, required: true, trim: true },
    teamCountry: { type: String, default: '', trim: true },
    teamLogo: { type: String, default: '' },

    // Team creation requires an approved pack purchase
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'PackPurchase', required: true, index: true },
    packageKey: { type: String, enum: ['starter', 'medium', 'premium'], required: true },
    maxPlayersAllowed: { type: Number, required: true, min: 1 },

    players: { type: [teamPlayerSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);


