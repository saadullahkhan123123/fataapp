# Logout API - Testing Documentation

## Overview
Backend logout endpoint for user authentication logout. Since JWT tokens are stateless, logout is primarily handled client-side (by removing the token from storage). This endpoint validates the token and confirms successful logout.

---

## Endpoint Details

### **POST** `/api/auth/logout`

**Description**: Logout user and invalidate session (client-side token removal)

**Authentication**: ✅ Required (Bearer Token)

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**: None (empty body)

**Response Success** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response Error** (401 - Unauthorized):
```json
{
  "success": false,
  "message": "No token provided ?"
}
```

**Response Error** (401 - Invalid Token):
```json
{
  "success": false,
  "message": "Not authorized"
}
```

---

## Testing Instructions

### 1. Using Postman / Thunder Client

#### Step 1: Get a valid token
First, login to get a JWT token:

**POST** `http://localhost:5000/api/auth/login`

Body:
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

Response will contain:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Step 2: Test Logout
**POST** `http://localhost:5000/api/auth/logout`

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

Body: (empty or `{}`)

Expected Response (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Step 3: Verify token is invalid (optional)
Try calling the logout endpoint again with the same token. It should still work (since JWT is stateless), but if you try to access other protected endpoints, they should fail after the token expires or if you've removed it client-side.

---

### 2. Using cURL

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'

# Copy the token from response, then logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Using JavaScript (Fetch API)

```javascript
// Logout function
async function logout() {
  const token = localStorage.getItem('adminToken'); // or your token storage
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Remove token from storage (IMPORTANT!)
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Redirect to login
      window.location.href = '/login';
      console.log('Logout successful');
    } else {
      console.error('Logout failed:', data.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Call logout
logout();
```

---

### 4. Using React / Frontend Integration

```typescript
import { logout as logoutUtil } from './utils/auth';

// In your component
const handleLogout = async () => {
  try {
    const token = getToken(); // Your token getter function
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear local storage
      logoutUtil(); // This should remove token and user from localStorage
      
      // Redirect
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API fails, clear local storage
    logoutUtil();
    window.location.href = '/login';
  }
};
```

---

## Important Notes

1. **Client-Side Token Removal**: After calling the logout endpoint, the client MUST remove the token from storage (localStorage, sessionStorage, cookies, etc.). The backend endpoint only validates the token and returns success.

2. **JWT Stateless Nature**: JWT tokens are stateless, meaning the backend doesn't maintain a session. The token remains valid until it expires (based on `JWT_EXPIRES_IN` env variable, default is 7 days).

3. **Token Validation**: The logout endpoint requires a valid token. If the token is invalid or expired, you'll get a 401 error.

4. **Production URL**: For production testing, use:
   ```
   https://fantabeach-backend-code.vercel.app/api/auth/logout
   ```

5. **Error Handling**: Always handle network errors and API errors. Even if the logout API call fails, you should still clear the token from client-side storage.

---

## Test Cases

### ✅ Test Case 1: Successful Logout
- **Precondition**: User is logged in with valid token
- **Action**: Call `/api/auth/logout` with valid token
- **Expected**: 200 response with `success: true`
- **Post-action**: Token removed from client storage

### ✅ Test Case 2: Logout without Token
- **Precondition**: No token provided
- **Action**: Call `/api/auth/logout` without Authorization header
- **Expected**: 401 response with `"No token provided ?"`

### ✅ Test Case 3: Logout with Invalid Token
- **Precondition**: Invalid/expired token
- **Action**: Call `/api/auth/logout` with invalid token
- **Expected**: 401 response with `"Not authorized"`

### ✅ Test Case 4: Logout with Expired Token
- **Precondition**: Token expired (wait for expiration or use old token)
- **Action**: Call `/api/auth/logout` with expired token
- **Expected**: 401 response with `"Not authorized"`

---

## Integration Checklist

- [ ] Backend endpoint implemented (`/api/auth/logout`)
- [ ] Endpoint requires authentication (authMiddleware)
- [ ] Returns success message on valid token
- [ ] Frontend calls logout endpoint before clearing token
- [ ] Frontend removes token from storage after logout
- [ ] Frontend redirects to login page after logout
- [ ] Error handling implemented in frontend
- [ ] Tested with valid token
- [ ] Tested without token (should fail)
- [ ] Tested with invalid token (should fail)

---

## Production Testing

For production environment:

**Base URL**: `https://fantabeach-backend-code.vercel.app`

**Endpoint**: `POST https://fantabeach-backend-code.vercel.app/api/auth/logout`

All other details remain the same. Make sure to use production credentials for login before testing logout.

