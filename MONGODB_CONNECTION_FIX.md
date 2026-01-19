# MongoDB Connection Timeout Fix

## Problem
Getting error: `Operation users.findOne() buffering timed out after 10000ms`

This happens because:
1. MongoDB connection isn't established before the request is handled
2. In serverless (Vercel), connections need special handling
3. Connection timeout settings need adjustment

## Solution Applied

### 1. Updated Database Connection (`config/db.js`)
- Added connection caching to prevent multiple connection attempts
- Reduced `serverSelectionTimeoutMS` to 5 seconds
- Added proper connection pooling settings
- Disabled mongoose buffering (important for serverless)

### 2. Updated Server Initialization (`server.js`)
- Made DB connection non-blocking
- Connection will be established on first request if needed

## Additional Steps Required

### Step 1: Verify Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Make sure these are set:
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret
- `NODE_ENV` - Set to `production`

### Step 2: Check MongoDB Atlas Network Access

If using MongoDB Atlas:

1. Go to **MongoDB Atlas Dashboard**
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add Vercel's IP ranges if you prefer
5. Save

### Step 3: Verify MongoDB Connection String

Your `MONGO_URI` should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Make sure:
- Username and password are correct
- Database name is specified
- Connection string includes `?retryWrites=true&w=majority`

### Step 4: Test Connection

After redeploying, test the health endpoint:
```
GET https://fataapp-delta.vercel.app/
```

Then test login:
```
POST https://fataapp-delta.vercel.app/api/auth/login
Content-Type: application/json

{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "admin123!@"
}
```

## Common Issues

### Issue: Still Getting Timeout

**Check 1: MongoDB Atlas IP Whitelist**
- Make sure `0.0.0.0/0` is allowed (or Vercel IPs)
- Wait 1-2 minutes after adding IP for changes to propagate

**Check 2: Connection String**
- Verify username/password are correct
- Check if database name exists
- Ensure connection string is properly URL encoded

**Check 3: Vercel Environment Variables**
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify `MONGO_URI` is set correctly
- Make sure it's set for **Production** environment
- Redeploy after adding/changing variables

**Check 4: MongoDB Atlas Cluster Status**
- Check if cluster is running (not paused)
- Verify cluster tier supports connections (free tier works fine)

### Issue: Connection Works Locally But Not on Vercel

This usually means:
1. **Environment variable not set in Vercel** - Add `MONGO_URI` in Vercel dashboard
2. **IP not whitelisted** - Add `0.0.0.0/0` in MongoDB Atlas Network Access
3. **Connection string format** - Make sure it's the same format as local

### Issue: Intermittent Timeouts

This is normal in serverless:
- First request after cold start may be slower
- Connection is cached for subsequent requests
- If timeout persists, check MongoDB Atlas cluster performance

## MongoDB Atlas Setup (If Not Already Done)

1. **Create Account**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Free tier (M0) works fine
3. **Create Database User**:
   - Database Access → Add New Database User
   - Username and password
   - Save credentials
4. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with your database name
5. **Network Access**:
   - Network Access → Add IP Address
   - Allow from anywhere: `0.0.0.0/0`

## Testing Locally

To test if connection works locally:

```bash
cd fantabeach
# Make sure .env file has MONGO_URI
npm run dev
```

Then test:
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "admin123!@"
}
```

## Vercel Logs

Check Vercel deployment logs:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on latest deployment
5. Click **Functions** tab
6. Click on `api/index.js`
7. Check **Logs** for MongoDB connection messages

Look for:
- `MongoDB connected successfully` ✅
- `MongoDB connection error:` ❌

## Next Steps

1. ✅ Code updated (connection handling improved)
2. ⏳ Verify `MONGO_URI` is set in Vercel
3. ⏳ Check MongoDB Atlas Network Access
4. ⏳ Redeploy on Vercel
5. ⏳ Test the API endpoints

After completing these steps, the connection timeout should be resolved.

