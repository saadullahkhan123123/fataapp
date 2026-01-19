const mongoose = require('mongoose');

// Cache the connection promise to avoid multiple connection attempts
let cachedConnection = null;

const connectDB = async () => {
  try {
    // Skip if already connected (for serverless cold starts)
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return mongoose.connection;
    }

    // If connection is in progress, wait for it
    if (cachedConnection) {
      console.log('MongoDB connection in progress, waiting...');
      return await cachedConnection;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI not defined in env');
    }

    // Create connection promise and cache it
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Increased to 30s for serverless
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Increased to 30s for serverless
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
    }).then((conn) => {
      console.log('MongoDB connected successfully');
      cachedConnection = null; // Clear cache on success
      return conn;
    }).catch((error) => {
      console.error('MongoDB connection error:', error.message);
      cachedConnection = null; // Clear cache on error to allow retry
      throw error;
    });

    return await cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    cachedConnection = null; // Clear cache on error
    // Don't exit process in serverless (Vercel) - let it retry on next request
    if (!process.env.VERCEL && !process.env.LAMBDA_TASK_ROOT) {
      process.exit(1);
    }
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

module.exports = connectDB;
