// Vercel Serverless Function entry point
// This file handles all requests starting with /api/*
const app = require('../server');

// Export the app as a handler for Vercel
// Vercel will automatically wrap Express apps
module.exports = app;

