# Postman Login Test Guide

## Quick Start - Testing Login in Postman

### Option 1: Using Postman Collection (Recommended)

1. **Import Collection and Environment:**
   - Open Postman
   - Click **Import** button
   - Import these files:
     - `FantaBeach-Auth.postman_collection.json`
     - `FantaBeach.postman_environment.json`

2. **Select Environment:**
   - Click on the environment dropdown (top right)
   - Select **"FantaBeach (Local/Prod)"**

3. **Test Login:**
   - Open the collection **"FantaBeach Auth API"**
   - Click on **"Login"** request
   - Click **Send**

4. **Check Response:**
   - If successful (200), you'll get a token
   - The token is automatically saved to the `authToken` environment variable
   - You can use this token for authenticated requests

### Option 2: Manual Setup

#### Step 1: Create New Request

1. Open Postman
2. Click **New** → **HTTP Request**
3. Name it: "Login"

#### Step 2: Configure Request

**Method:** `POST`

**URL:** 
- Production: `https://fataapp-delta.vercel.app/api/auth/login`
- Local: `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "admin123!@"
}
```

#### Step 3: Send Request

Click **Send** button

#### Step 4: Expected Responses

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "muhammadsaadullah093@gmail.com",
    "isAdmin": true,
    "isVerified": true,
    ...
  }
}
```

**If User Not Verified (200):**
```json
{
  "success": true,
  "message": "OTP sent to email. Verify to complete login.",
  "otp": "123456"
}
```
*Note: OTP is returned in response for testing purposes*

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Testing Different Scenarios

### 1. Test with Valid Credentials
```json
{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "admin123!@"
}
```

### 2. Test with Invalid Email
```json
{
  "email": "wrong@example.com",
  "password": "admin123!@"
}
```
Expected: `401 - Invalid credentials`

### 3. Test with Invalid Password
```json
{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "wrongpassword"
}
```
Expected: `401 - Invalid credentials`

### 4. Test with Missing Fields
```json
{
  "email": "muhammadsaadullah093@gmail.com"
}
```
Expected: `400 - Please provide email and password`

## Using the Token

After successful login, copy the `token` from the response and use it in other requests:

**Header:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Environment Variables

The Postman environment includes:
- `baseUrl`: Production URL (`https://fataapp-delta.vercel.app`)
- `baseUrlLocal`: Local URL (`http://localhost:5000`)
- `adminEmail`: Admin email
- `adminPassword`: Admin password
- `authToken`: Automatically saved after login (if using collection)

## Troubleshooting

### Issue: Connection Refused
- **Local:** Make sure backend is running on port 5000
- **Production:** Check if `https://fataapp-delta.vercel.app` is accessible

### Issue: CORS Error
- Backend CORS is configured to allow all origins
- If issue persists, check backend server logs

### Issue: Invalid Credentials
- Verify email and password are correct
- Check if user exists in database
- Ensure password is not hashed incorrectly

### Issue: OTP Required
- If user is not verified, OTP will be sent
- Use the OTP from response to call `/api/auth/verify-otp`
- Or verify the user in database first

## Next Steps

After successful login:
1. Copy the token from response
2. Use it in Authorization header for protected routes
3. Test other endpoints like `/api/auth/logout`

