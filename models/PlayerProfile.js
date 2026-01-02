const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    playerName: { type: String, required: true, trim: true },
    country: { type: String, default: '', trim: true },
    profilePicture: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.PlayerProfile || mongoose.model('PlayerProfile', playerProfileSchema);


