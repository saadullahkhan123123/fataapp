# Profile Management API Documentation

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-production-url.com`

## Authentication
All profile endpoints require:
- Header: `Authorization: Bearer <jwt_token>`
- User must be logged in

---

## 1. Get User Profile

**GET** `/api/users/profile`

Get the current logged-in user's profile information.

### Response
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "location": "New York, USA",
    "profilePicture": "/uploads/profile-pictures/image-1234567890.jpg",
    "credits": 100,
    "freePlayers": 0,
    "isVerified": true,
    "isAdmin": false,
    "onboardingCompleted": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## 2. Update Profile

**PUT** `/api/users/profile`

Update user profile information (name, email, username, phone, location).

### Request Body
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com",
  "username": "newusername",
  "phone": "+1234567890",
  "location": "Los Angeles, USA"
}
```

**Note:** 
- All fields are optional
- If email is changed, user will need to verify the new email (`isVerified` will be set to `false`)
- If username is changed, it must be unique
- If email is changed, it must be unique

### Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id",
    "username": "newusername",
    "email": "newemail@example.com",
    "name": "John Doe Updated",
    "phone": "+1234567890",
    "location": "Los Angeles, USA",
    ...
  }
}
```

### Error Responses

**Email already in use:**
```json
{
  "success": false,
  "message": "Email already in use"
}
```

**Username already taken:**
```json
{
  "success": false,
  "message": "Username already taken"
}
```

---

## 3. Change Password

**PUT** `/api/users/profile/change-password`

Change user password. After changing password, user must login again with the new password.

### Request Body
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Response
```json
{
  "success": true,
  "message": "Password changed successfully. Please login with your new password."
}
```

### Error Responses

**Missing fields:**
```json
{
  "success": false,
  "message": "Please provide current password and new password"
}
```

**Incorrect current password:**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

**Password too short:**
```json
{
  "success": false,
  "message": "New password must be at least 6 characters"
}
```

---

## 4. Upload Profile Picture

**POST** `/api/users/profile/picture`

Upload a profile picture. Old picture will be automatically deleted.

### Request
- Content-Type: `multipart/form-data`
- Field name: `profilePicture`
- File types allowed: `jpeg, jpg, png, gif, webp`
- Max file size: `5MB`

### Example (using curl)
```bash
curl -X POST http://localhost:5000/api/users/profile/picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

### Example (using FormData in JavaScript)
```javascript
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);

fetch('http://localhost:5000/api/users/profile/picture', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

### Response
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile-pictures/image-1234567890.jpg",
    "fullUrl": "http://localhost:5000/uploads/profile-pictures/image-1234567890.jpg"
  }
}
```

### Error Responses

**No file provided:**
```json
{
  "success": false,
  "message": "Please upload an image file"
}
```

**Invalid file type:**
```json
{
  "success": false,
  "message": "Only image files are allowed (jpeg, jpg, png, gif, webp)"
}
```

**File too large:**
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

---

## 5. Delete Profile Picture

**DELETE** `/api/users/profile/picture`

Delete the current profile picture.

### Response
```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

---

## Complete Workflow Example

### 1. Login and get token
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Get profile
```bash
GET /api/users/profile
Authorization: Bearer <token>
```

### 3. Update profile
```bash
PUT /api/users/profile
Authorization: Bearer <token>
{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": "New York, USA"
}
```

### 4. Change password
```bash
PUT /api/users/profile/change-password
Authorization: Bearer <token>
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 5. Upload profile picture
```bash
POST /api/users/profile/picture
Authorization: Bearer <token>
Content-Type: multipart/form-data
profilePicture: <file>
```

### 6. Login with new password/email
```bash
POST /api/auth/login
{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

---

## Important Notes

1. **Email Change:** When email is changed, `isVerified` is set to `false`. User needs to verify the new email via OTP.

2. **Password Change:** After changing password, the old token becomes invalid. User must login again with the new password.

3. **Profile Picture:**
   - Images are stored in `public/uploads/profile-pictures/`
   - Old images are automatically deleted when a new one is uploaded
   - Access images via: `http://your-domain.com/uploads/profile-pictures/filename.jpg`

4. **Username/Email Uniqueness:** System checks for duplicates before updating.

5. **File Upload:** 
   - Maximum file size: 5MB
   - Allowed formats: jpeg, jpg, png, gif, webp
   - Files are automatically renamed with timestamp to avoid conflicts

---

## Thunder Client / Postman Setup

### Environment Variables
- `baseUrl`: `http://localhost:5000`
- `token`: Your JWT token (get from login)

### Headers for all requests
```
Authorization: Bearer {{token}}
```

### For file upload (Profile Picture)
- Method: POST
- URL: `{{baseUrl}}/api/users/profile/picture`
- Body: form-data
- Key: `profilePicture` (type: File)
- Value: Select your image file

