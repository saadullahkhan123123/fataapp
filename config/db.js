const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Skip if already connected (for serverless cold starts)
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not defined in env');
    await mongoose.connect(uri, {
      // options not required for mongoose 6+ but safe to include:
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit process in serverless (Vercel) - let it retry on next request
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
