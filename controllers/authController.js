const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const admin = require('firebase-admin');

// Initialize Firebase Admin (for Google Sign-In)
// Using project ID from Firebase config
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'loignfatabeach' // From google-services.json and GoogleService-Info.plist
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

// Helper function: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

// ============================
// REGISTER USE
// ============================
exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide username, email and password' });

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ success: false, message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashed
    });

    // Generate and store OTP for verification
    const otpCode = generateOTP();
    await Otp.create({
      userId: user._id,
      otpCode,
      email: user.email,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // TODO: send OTP via email (for now return for testing)
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Verify OTP to activate your account.',
      otp: otpCode
    });
  } catch (err) {
    next(err);
  }
};

// ============================
// VERIFY OTP (for registration or first login)
// ============================
exports.verifyLoginOrRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otpRecord = await Otp.findOne({ userId: user._id, otpCode: otp });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ userId: user._id });
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Mark user verified & delete OTP
    user.isVerified = true;
    await user.save();
    await Otp.deleteMany({ userId: user._id });

    const token = generateToken({ id: user._id });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Login complete!',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// ============================
// LOGIN USER (with first-time OTP)
// ============================
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // if not verified, send OTP instead of token
    if (!user.isVerified) {
      const otpCode = generateOTP();
      await Otp.deleteMany({ userId: user._id });
      await Otp.create({
        userId: user._id,
        otpCode,
        email: user.email,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      return res.status(200).json({
        success: true,
        message: 'OTP sent to email. Verify to complete login.',
        otp: otpCode // for testing only
      });
    }

    const token = generateToken({ id: user._id });
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// ============================
// GOOGLE SIGN-IN
// ============================
exports.googleSignIn = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google ID token is required' 
      });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Google ID token' 
      });
    }

    const { uid: googleId, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not provided by Google' 
      });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (account linking)
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google';
        // If user was not verified, mark as verified since Google email is verified
        if (!existingUser.isVerified) {
          existingUser.isVerified = true;
        }
        user = await existingUser.save();
      } else {
        // Create new user with Google account
        // Generate username from email or name
        const baseUsername = name 
          ? name.toLowerCase().replace(/\s+/g, '') 
          : email.split('@')[0];
        
        let username = baseUsername;
        let counter = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Create user object without password field for Google users
        const userData = {
          username,
          email: email.toLowerCase(),
          name: name || '',
          profilePicture: picture || '',
          googleId,
          authProvider: 'google',
          isVerified: true // Google emails are already verified
        };
        user = await User.create(userData);
      }
    } else {
      // Update user info if changed
      if (name && user.name !== name) user.name = name;
      if (picture && user.profilePicture !== picture) user.profilePicture = picture;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({ id: user._id });

    res.status(200).json({
      success: true,
      message: 'Signed in with Google successfully',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// ============================
// LOGOUT USER
// ============================
exports.logoutUser = async (req, res, next) => {
  try {
    // Since JWT is stateless, logout is primarily handled client-side
    // This endpoint validates the token and confirms logout
    // Client should remove token from storage after calling this
    
    // Token is already validated by authMiddleware if this endpoint is protected
    // If we reach here, token is valid
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};