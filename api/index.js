// Vercel Serverless Function entry point
// This file handles all requests starting with /api/*
const app = require('../server');

// Export the app - Vercel will wrap it as a serverless function handler
module.exports = app;

