# Reset Password API Documentation

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-production-url.com`

---

## Reset Password Flow

Reset password ka flow 2 steps mein hota hai:

### Step 1: Request Password Reset OTP

Email par OTP bhejne ke liye request karein.

**Endpoint:** `POST /api/otp/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email (valid for 5 minutes)"
}
```

**Error Responses:**

- **400 Bad Request** - Email missing
```json
{
  "success": false,
  "message": "Email is required"
}
```

- **404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

- **500 Server Error** - Email send failed
```json
{
  "success": false,
  "message": "Failed to send OTP email"
}
```

---

### Step 2: Reset Password with OTP

OTP verify karke naya password set karein.

**Endpoint:** `POST /api/otp/reset`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**

- **400 Bad Request** - Missing fields
```json
{
  "success": false,
  "message": "All fields are required"
}
```

- **400 Bad Request** - Invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

- **400 Bad Request** - OTP expired
```json
{
  "success": false,
  "message": "OTP expired"
}
```

- **404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Complete Example

### Using cURL

**Step 1: Request OTP**
```bash
curl -X POST http://localhost:5000/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Step 2: Reset Password**
```bash
curl -X POST http://localhost:5000/api/otp/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "newSecurePassword123"
  }'
```

### Using JavaScript/Fetch

**Step 1: Request OTP**
```javascript
const response = await fetch('http://localhost:5000/api/otp/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

const data = await response.json();
console.log(data);
```

**Step 2: Reset Password**
```javascript
const response = await fetch('http://localhost:5000/api/otp/reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456',
    newPassword: 'newSecurePassword123'
  })
});

const data = await response.json();
console.log(data);
```

### Using Axios

**Step 1: Request OTP**
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:5000/api/otp/request', {
  email: 'user@example.com'
});

console.log(response.data);
```

**Step 2: Reset Password**
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:5000/api/otp/reset', {
  email: 'user@example.com',
  otp: '123456',
  newPassword: 'newSecurePassword123'
});

console.log(response.data);
```

---

## Important Notes

1. **OTP Expiry:** OTP 5 minutes ke liye valid hota hai
2. **OTP One-time Use:** Har OTP sirf ek baar use ho sakta hai
3. **Email Required:** User ka email database mein hona chahiye
4. **Password Requirements:** 
   - Minimum 6 characters
   - Strong password recommend kiya jata hai
5. **Security:** OTP verify hone ke baad automatically delete ho jata hai

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/request` | Request password reset OTP |
| POST | `/api/otp/reset` | Reset password with OTP |

---

## Testing

1. **Request OTP:**
   - Email bhejein
   - Email check karein for OTP code

2. **Reset Password:**
   - Email, OTP, aur naya password bhejein
   - Success message aana chahiye
   - Naye password se login try karein

---

## Error Handling

Sabhi errors ko properly handle karein:

```javascript
try {
  const response = await fetch('http://localhost:5000/api/otp/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });

  const data = await response.json();

  if (!response.ok) {
    // Error handle karein
    console.error('Error:', data.message);
    return;
  }

  // Success
  console.log('Success:', data.message);
} catch (error) {
  console.error('Network error:', error);
}
```

