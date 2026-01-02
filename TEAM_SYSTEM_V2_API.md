# Team / Player / League / Match System (V2) - API (Mobile/App Frontend)

Base URL (local): `http://localhost:5000`  
Base URL (prod): `https://fantabeach-backend-code.vercel.app`

Auth: `Authorization: Bearer <token>`

---

## 1) Auth + OTP

### Register
**POST** `/api/auth/register`

Body:
```json
{ "username": "u1", "email": "u1@test.com", "password": "Pass12345!" }
```

Response (testing):
```json
{ "success": true, "otp": "123456" }
```

### Verify OTP (activate account / complete login)
**POST** `/api/auth/verify-otp`

Body:
```json
{ "email": "u1@test.com", "otp": "123456" }
```

Response:
```json
{ "success": true, "token": "JWT_TOKEN", "user": { "email": "u1@test.com" } }
```

### Login
**POST** `/api/auth/login`

Body:
```json
{ "email": "u1@test.com", "password": "Pass12345!" }
```

If not verified, response includes `otp` for testing. If verified, response includes `token`.

---

## 2) Credit Packs (purchase request + admin approval required)

### List packages
**GET** `/api/credits/packages`

### Buy package (creates **pending** purchase request)
**POST** `/api/credits/buy` (Auth required)

Body:
```json
{ "package": "starter", "method": "google" }
```

Response:
```json
{ "success": true, "data": { "_id": "PURCHASE_ID", "status": "pending" } }
```

### My purchases
**GET** `/api/credits/my-purchases` (Auth required)

---

## 3) Player role (User → Player)

### Upgrade to Player (create Player Profile)
**POST** `/api/player-profiles/upgrade` (Auth required)

Body:
```json
{ "playerName": "Player One", "country": "IT", "profilePicture": "" }
```

### Get my Player Profile
**GET** `/api/player-profiles/me` (Auth required)

---

## 4) Team (one per user, requires approved pack)

### Create my team
**POST** `/api/teams` (Auth required)

Body:
```json
{ "teamName": "My Team", "teamCountry": "PK", "teamLogo": "" }
```

Rules:
- Team creation is blocked until a pack purchase is **approved** by admin.
- Only **one team per user**.

### Get my team
**GET** `/api/teams/me` (Auth required)

### Update my team
**PUT** `/api/teams/me` (Auth required)

Body (any fields):
```json
{ "teamName": "New Name", "teamCountry": "IT", "teamLogo": "" }
```

### Set lineup (max 4 active)
**PATCH** `/api/teams/me/lineup` (Auth required)

Body:
```json
{ "activePlayerProfileIds": ["P1", "P2", "P3", "P4"] }
```

---

## 5) Leagues (team requests join, admin approves)

### List leagues
**GET** `/api/managed-leagues`

### Request to join a league (uses your team)
**POST** `/api/managed-leagues/:leagueId/request-join` (Auth required)

### My join requests
**GET** `/api/managed-leagues/my-join-requests` (Auth required)

---

## 6) Matches (admin schedules; team sets 4-player lineup)

### My matches
**GET** `/api/league-matches/my` (Auth required)

### Set my lineup for a match (exactly 4)
**PATCH** `/api/league-matches/:matchId/lineup` (Auth required)

Body:
```json
{ "playerProfileIds": ["P1", "P2", "P3", "P4"] }
```

Rules:
- Exactly 4 unique players.
- Must belong to your team roster.
- Cannot change after match lock time.

---

## 7) Admin APIs (for admin panel)

### Purchases approval
- **GET** `/api/admin/purchases?status=pending|approved|rejected`
- **POST** `/api/admin/purchases/:id/approve`
- **POST** `/api/admin/purchases/:id/reject` body: `{ "reason": "..." }`

### Player Profiles list
- **GET** `/api/admin/player-profiles`

### Teams (V2)
- **GET** `/api/admin/teams-v2`
- **GET** `/api/admin/teams-v2/:id`
- **POST** `/api/admin/teams-v2/:id/assign-player` body: `{ "playerProfileId": "...", "status": "reserve" }`
- **POST** `/api/admin/teams-v2/:id/remove-player` body: `{ "playerProfileId": "..." }`

### Leagues (V2)
- **POST** `/api/admin/managed-leagues`
- **GET** `/api/admin/managed-leagues`
- **PUT** `/api/admin/managed-leagues/:id`
- **DELETE** `/api/admin/managed-leagues/:id`

### Join Requests (V2)
- **GET** `/api/admin/league-join-requests?status=pending|approved|rejected`
- **POST** `/api/admin/league-join-requests/:id/approve`
- **POST** `/api/admin/league-join-requests/:id/reject` body: `{ "note": "..." }`

### League Matches (V2)
- **POST** `/api/admin/league-matches`
- **GET** `/api/admin/league-matches`
- **POST** `/api/admin/league-matches/:id/lock`
- **PUT** `/api/admin/league-matches/:id/result` body: `{ "score": "2-0", "winnerTeamId": "...", "isCompleted": true }`


