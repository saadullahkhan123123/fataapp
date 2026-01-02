const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================
// Step 1: Request OTP
// ==========================
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    // Delete existing OTPs
    await Otp.deleteMany({ userId: user._id });

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.create({ userId: user._id, otpCode, expiresAt });

    // Send OTP email
    const emailSent = await sendEmail(
      user.email,
      'Your Password Reset OTP',
      `Your OTP code is <b>${otpCode}</b>. It will expire in 5 minutes.`
    );

    if (!emailSent)
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email (valid for 5 minutes)',
    });

  } catch (err) {
    console.error('OTP Request Error:', err);
    res.status(500).json({ success: false, message: 'Server error while requesting OTP' });
  }
};

// ==========================
// Step 2: Verify OTP
// ==========================
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ userId: user._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // OTP verified, delete it
    await Otp.deleteMany({ userId: user._id });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Logged in!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error('OTP Verify Error:', err);
    res.status(500).json({ success: false, message: 'Server error while verifying OTP' });
  }
};

// ==========================
// Step 3: Reset Password
// ==========================
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ userId: user._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete OTPs after successful reset
    await Otp.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: false, message: 'Server error while resetting password' });
  }
};
