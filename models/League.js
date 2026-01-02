const mongoose = require("mongoose");

const LeagueSchema = new mongoose.Schema(
  {
    leagueName: { type: String, required: true },
    description: { type: String },
    teamName: { type: String, required: true },
    coachName: { type: String, required: true },
    teamImage: { type: String, default: null }, // ⭐ NEW FIELD ⭐

    credits: { type: Number, default: 0 },

    type: { type: String, enum: ["public", "private"], required: true },

    // PUBLIC ONLY
    typology: { type: String, default: null },

    // PRIVATE ONLY
    playerAvailability: { type: String, default: null },
    gameMode: { type: String, default: null },

    joinCode: { type: String, default: null, index: false },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now }
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("League", LeagueSchema);
