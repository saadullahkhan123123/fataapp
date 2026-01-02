const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      trim: true,
      unique: true,
      minlength: 3
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      trim: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    profilePicture: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
     credits: { type: Number, default: 0 },
  freePlayers: { type: Number, default: 0 },
    // Mark when user verified via OTP
    isVerified: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    // Team-management module: user upgraded to "Player"
    isPlayer: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Hide password in responses
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
