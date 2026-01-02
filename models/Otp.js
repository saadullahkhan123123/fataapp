const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    // Optional: if you’re using email-based OTP (for forgot password)
    email: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: Date.now,
      // Automatically remove OTP from DB after 5 minutes
      expires: 300, // 300 seconds = 5 minutes
    },
  },
  { timestamps: true }
);

// Ensure we’re not redefining the model in dev (avoids OverwriteModelError)
module.exports = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
