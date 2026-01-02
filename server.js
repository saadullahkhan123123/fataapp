const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');


const app = express();




// Load env
dotenv.config();

// Connect DB
connectDB();


// Middleware - CORS configuration for admin panel
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://admin-panal-fatabeach.vercel.app',
  'https://admin-panal-fatabeach.vercel.app/'
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

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} on port ${PORT}`);
});
