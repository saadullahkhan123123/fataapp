# Vercel Serverless Function Fix

## Issues Fixed

### 1. Server Export for Serverless ✅
**Problem**: `server.js` was calling `app.listen()` which doesn't work in serverless environments.

**Fix**: 
- Added conditional `app.listen()` that only runs in non-serverless environments
- Export the app for Vercel: `module.exports = app;`
- Created `api/index.js` as the Vercel serverless function entry point

### 2. Stripe Initialization ✅
**Problem**: Stripe was initialized at module level with `process.env.STRIPE_SECRET_KEY`, causing crashes if env var is missing.

**Fix**:
- Changed to lazy initialization with `getStripe()` function
- Stripe is only initialized when actually needed (in request handlers)
- Proper error handling if `STRIPE_SECRET_KEY` is not configured

### 3. Database Connection ✅
**Problem**: DB connection was calling `process.exit(1)` on error, which crashes serverless functions.

**Fix**:
- Added check to skip connection if already connected (for serverless cold starts)
- Removed `process.exit(1)` in serverless mode (Vercel sets `VERCEL` env variable)
- Allows serverless functions to retry on next request instead of crashing

## Files Changed

1. **`server.js`**
   - Export app for serverless: `module.exports = app;`
   - Conditional `app.listen()` only for local development

2. **`controllers/paymentsController.js`**
   - Lazy Stripe initialization with `getStripe()` function
   - Updated all Stripe API calls to use `getStripe()`

3. **`config/db.js`**
   - Skip connection if already connected
   - Don't exit process in serverless mode

4. **`api/index.js`** (NEW)
   - Vercel serverless function entry point
   - Requires and exports the Express app from `server.js`

## How Vercel Routes Work

- Vercel automatically routes `/api/*` requests to `api/index.js`
- Our Express routes already have `/api` prefix (e.g., `/api/auth/login`)
- So a request to `https://your-domain.vercel.app/api/auth/login` is handled by `api/index.js`
- Which then routes internally to the Express route `/api/auth/login`

## Environment Variables Required

Make sure these are set in Vercel Environment Variables:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key (if using payments)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (if using payments)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (if using webhooks)
- `EMAIL_USER` - Email account (if using email)
- `EMAIL_PASS` - Email password (if using email)
- `NODE_ENV` - Set to `production` (optional, defaults to production on Vercel)

## Testing

After deploying to Vercel:

1. Check the deployment logs for any errors
2. Test the health endpoint: `GET https://your-domain.vercel.app/`
3. Test an API endpoint: `GET https://your-domain.vercel.app/api/auth/login` (should return 400/401, not crash)

## Local Development

Local development still works the same way:
```bash
npm run dev
```

The server will listen on port 5000 as before, because `VERCEL` env variable is not set.

