# Fix: "Header name must be a valid HTTP token" Error

## Problem
Error: `Header name must be a valid HTTP token ["Content-Type "]`

This error occurs when there's **extra whitespace** (spaces) in the header name or value in Postman.

## Solution

### Method 1: Fix in Postman UI

1. **Open your request in Postman**
2. **Go to Headers tab**
3. **Check the header name:**
   - Look for `Content-Type ` (with trailing space) ❌
   - Should be `Content-Type` (no trailing space) ✅
4. **Delete the header and re-add it:**
   - Click the **X** to remove the header
   - Click **Add Header**
   - Type: `Content-Type` (carefully, no spaces)
   - Value: `application/json`
5. **Check the value too:**
   - Make sure `application/json` has no leading/trailing spaces

### Method 2: Use the Collection (Recommended)

Instead of manual setup, **import the collection**:

1. **Import Collection:**
   - Click **Import** in Postman
   - Select `FantaBeach-Auth.postman_collection.json`
   - This will have headers pre-configured correctly

2. **Use the "Login" request** from the collection
   - Headers are already set correctly
   - No manual typing needed

### Method 3: Copy-Paste Headers

If typing manually, copy these **exactly** (no extra spaces):

**Header Name:**
```
Content-Type
```

**Header Value:**
```
application/json
```

## Common Mistakes to Avoid

❌ `Content-Type ` (trailing space)  
❌ ` Content-Type` (leading space)  
❌ `Content-Type  ` (multiple spaces)  
❌ `Content-Type:` (with colon - Postman adds this automatically)  
✅ `Content-Type` (correct)

## Quick Test Request

**Method:** POST  
**URL:** `https://fataapp-delta.vercel.app/api/auth/login`

**Headers:**
- Key: `Content-Type`
- Value: `application/json`

**Body (raw JSON):**
```json
{
  "email": "muhammadsaadullah093@gmail.com",
  "password": "admin123!@"
}
```

## Verification

After fixing, the header should look like this in Postman:

```
Content-Type: application/json
```

Not like this:
```
Content-Type : application/json  (spaces around colon)
Content-Type :application/json   (space before colon)
Content-Type: application/json   (trailing space in value)
```

## Still Having Issues?

1. **Clear all headers** and add them one by one
2. **Use the imported collection** instead of manual setup
3. **Check for invisible characters** - delete and retype
4. **Restart Postman** if the issue persists

