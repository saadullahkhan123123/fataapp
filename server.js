const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');


const app = express();




// Load env
dotenv.config();

// Connect DB (async - will be awaited in request handlers if needed)
// For serverless, connection will be established on first request
connectDB().catch(err => {
  console.error('Initial DB connection failed (will retry on first request):', err.message);
});


// Middleware - CORS configuration for admin panel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://admin-panal-fatabeach.vercel.app',
  'https://admin-panal-fatabeach.vercel.app/',
  'https://fataapp-delta.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production') {
      // In production, allow all origins from vercel
      if (origin.includes('vercel.app') || origin.includes('admin-panal-fatabeach')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in production for now
      }
    } else {
      // Development: only allow localhost origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  // Skip health check and diagnostic endpoints
  if (req.path === '/' || req.path === '/api' || req.path === '/api/health' || req.path === '/api/db-check') {
    return next();
  }
  
  // Ensure MongoDB is connected
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('DB not connected, attempting connection...');
      console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
      await connectDB();
      // Wait a bit to ensure connection is fully established
      let retries = 0;
      while (mongoose.connection.readyState !== 1 && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }
      
      if (mongoose.connection.readyState !== 1) {
        const errorMsg = process.env.MONGO_URI 
          ? 'MongoDB connection failed to establish. Check connection string and network access.'
          : 'MONGO_URI environment variable is not set. Please configure it in Vercel.';
        throw new Error(errorMsg);
      }
      console.log('DB connection established in middleware');
    }
    next();
  } catch (error) {
    console.error('DB connection failed in middleware:', error.message);
    console.error('Full error:', error);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again.',
      error: error.message,
      hint: !process.env.MONGO_URI ? 'MONGO_URI environment variable is not set in Vercel.' : 'Check MongoDB connection string and network access.'
    });
  }
});

// Routes
const leagueRoutes = require("./routes/leagueRoutes");
const creditsRoutes = require('./routes/creditsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes');
const adminRoutes = require('./routes/adminRoutes');
const playerProfileRoutes = require('./routes/playerProfileRoutes');
const teamRoutes = require('./routes/teamRoutes');
const managedLeagueRoutes = require('./routes/managedLeagueRoutes');
const leagueMatchRoutes = require('./routes/leagueMatchRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/credits', creditsRoutes);
app.use("/api/league", leagueRoutes);
app.use('/api/player-profiles', playerProfileRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/managed-leagues', managedLeagueRoutes);
app.use('/api/league-matches', leagueMatchRoutes);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', adminRoutes);






// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'FantaBeach API is running' });
});

// Database connection check endpoint
app.get('/api/db-check', async (req, res) => {
  try {
    const hasMongoUri = !!process.env.MONGO_URI;
    const connectionState = mongoose.connection.readyState;
    const stateNames = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (!hasMongoUri) {
      return res.status(500).json({
        success: false,
        message: 'MONGO_URI environment variable is not set',
        connectionState: stateNames[connectionState] || 'unknown',
        fix: 'Add MONGO_URI in Vercel Dashboard → Settings → Environment Variables'
      });
    }
    
    if (connectionState !== 1) {
      // Try to connect
      try {
        await connectDB();
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Database connection failed',
          connectionState: stateNames[connectionState] || 'unknown',
          error: error.message,
          mongoUriSet: hasMongoUri,
          fix: 'Check MongoDB connection string and network access in MongoDB Atlas'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Database connection is healthy',
      connectionState: stateNames[mongoose.connection.readyState] || 'unknown',
      mongoUriSet: hasMongoUri
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database check failed',
      error: error.message
    });
  }
});

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Export app for Vercel serverless
// For Vercel, export the app directly - @vercel/node will wrap it as a handler
module.exports = app;

// Only listen when not in serverless environment (local development)
// Vercel sets VERCEL env variable, and AWS Lambda sets LAMBDA_TASK_ROOT
if (!process.env.VERCEL && !process.env.LAMBDA_TASK_ROOT) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'production'} on port ${PORT}`);
  });
}
