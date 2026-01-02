# FantaBeach — Mobile/App Frontend API Integration Guide

This document is for the **mobile/app frontend developer** to integrate the app with the backend APIs.

---

## Base URLs

- **Local**: `http://localhost:5000`
- **Production**: `https://fantabeach-backend-code.vercel.app`

> Frontend should keep `BASE_URL` configurable (env/remote config).

---

## Common rules

### Auth header
Most protected endpoints require:

`Authorization: Bearer <JWT_TOKEN>`

### Content-Type
- JSON endpoints:
  - `Content-Type: application/json`
- Multipart (images):
  - use `multipart/form-data` (browser/mobile SDK will set boundary automatically)

### Response format
Backend responses are generally:
- `success: boolean`
- `message?: string`
- sometimes `data: ...` (objects/arrays)

---

## 1) Authentication + OTP

### 1.1 Register
**POST** `/api/auth/register`

Body:
```json
{ "username": "u1", "email": "u1@test.com", "password": "Pass12345!" }
```

Response (currently returns OTP for testing):
```json
{ "success": true, "message": "User registered...", "otp": "123456" }
```

### 1.2 Verify OTP (activate account / complete login)
**POST** `/api/auth/verify-otp`

Body:
```json
{ "email": "u1@test.com", "otp": "123456" }
```

Response:
```json
{ "success": true, "token": "JWT_TOKEN", "user": { "email": "u1@test.com" } }
```

### 1.3 Login
**POST** `/api/auth/login`

Body:
```json
{ "email": "u1@test.com", "password": "Pass12345!" }
```

Behavior:
- If user is **not verified**: backend returns `otp` (for testing) and requires `/verify-otp`.
- If verified: backend returns `token` + `user`.

---

## 2) Password reset (OTP)

> This is separate from `/api/auth/verify-otp` (registration/login OTP).

### 2.1 Request password reset OTP
**POST** `/api/otp/request`

Body:
```json
{ "email": "u1@test.com" }
```

### 2.2 Verify password reset OTP
**POST** `/api/otp/verify`

Body:
```json
{ "email": "u1@test.com", "otp": "123456" }
```

### 2.3 Reset password
**POST** `/api/otp/reset`

Body:
```json
{ "email": "u1@test.com", "otp": "123456", "newPassword": "NewPass123!" }
```

---

## 3) User profile

### 3.1 Get current user
**GET** `/api/users/me` (Auth required)

### 3.2 Profile details
- **GET** `/api/users/profile` (Auth required)
- **PUT** `/api/users/profile` (Auth required)
- **PUT** `/api/users/profile/change-password` (Auth required)

### 3.3 Upload profile picture
**POST** `/api/users/profile/picture` (Auth required, multipart)

FormData key: `profilePicture` (file)

### 3.4 Delete profile picture
**DELETE** `/api/users/profile/picture` (Auth required)

---

## 4) Team System (V2) — Packs → Team → Players → League → Matches

> This is the new flow for: **one team per user**, admin-approved packs, admin assigns players to teams, team creator sets max 4 active.

### 4.1 Packages
**GET** `/api/credits/packages`

### 4.2 Buy package (creates pending request; DOES NOT give credits instantly)
**POST** `/api/credits/buy` (Auth required)

Body:
```json
{ "package": "starter", "method": "google" }
```

Response contains purchaseId:
```json
{ "success": true, "data": { "_id": "PURCHASE_ID", "status": "pending" } }
```

### 4.3 My purchases (show pending/approved)
**GET** `/api/credits/my-purchases` (Auth required)

App behavior:
- If latest purchase is `pending`: show “Waiting for admin approval”
- If `approved`: allow team creation

---

## 5) Player role (Normal user → Player)

### 5.1 Upgrade to Player (create PlayerProfile)
**POST** `/api/player-profiles/upgrade` (Auth required)

Body:
```json
{ "playerName": "Player One", "country": "IT", "profilePicture": "" }
```

### 5.2 Get my PlayerProfile
**GET** `/api/player-profiles/me` (Auth required)

---

## 6) Team (V2)

### 6.1 Create my team (requires approved pack)
**POST** `/api/teams` (Auth required)

Body:
```json
{ "teamName": "My Team", "teamCountry": "PK", "teamLogo": "" }
```

Rules:
- Team creation blocked if no **approved** purchase exists.
- Only **one team per user**.

### 6.2 Get my team
**GET** `/api/teams/me` (Auth required)

Team includes roster (`players[]`) with each player status: `active` or `reserve`.

### 6.3 Update my team
**PUT** `/api/teams/me` (Auth required)

### 6.4 Set active lineup (max 4 active)
**PATCH** `/api/teams/me/lineup` (Auth required)

Body:
```json
{ "activePlayerProfileIds": ["P1", "P2", "P3", "P4"] }
```

---

## 7) Leagues (V2) — request join + admin approval

### 7.1 List leagues
**GET** `/api/managed-leagues`

### 7.2 Request join (team creator)
**POST** `/api/managed-leagues/:leagueId/request-join` (Auth required)

### 7.3 My join requests
**GET** `/api/managed-leagues/my-join-requests` (Auth required)

---

## 8) Matches (V2)

### 8.1 My matches
**GET** `/api/league-matches/my` (Auth required)

### 8.2 Set match lineup (exactly 4 players)
**PATCH** `/api/league-matches/:matchId/lineup` (Auth required)

Body:
```json
{ "playerProfileIds": ["P1", "P2", "P3", "P4"] }
```

Rules:
- Exactly 4 unique players.
- Must belong to your team roster.
- Cannot change after `lockAt` / when match is locked.

---

## 9) Admin-only endpoints (for admin panel, NOT for mobile users)

These are used by the admin web panel only:
- Purchases approve/reject: `/api/admin/purchases`
- Assign players to teams: `/api/admin/teams-v2`
- League CRUD + join request approvals: `/api/admin/managed-leagues`, `/api/admin/league-join-requests`
- Schedule matches + lock + result: `/api/admin/league-matches`

---

## Frontend recommended flow (screens)

1. **Auth**: Register/Login → OTP verify → store JWT
2. **Buy Pack**: show packages → buy → show “pending approval”
3. **Team Create** (after approval): create team → show roster
4. **Roster**: show active/reserve, allow switching (max 4 active)
5. **Leagues**: list → request join → show pending/approved
6. **Matches**: list my matches → set lineup before lock → show results after completed

---

## Related docs
- `fantabeach/TEAM_SYSTEM_V2_API.md` (same APIs, shorter)
- `fantabeach/RESET_PASSWORD_API.md`
- `fantabeach/PROFILE_API_DOCUMENTATION.md`


