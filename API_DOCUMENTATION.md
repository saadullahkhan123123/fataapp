# FantaBeach Admin API Documentation

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-production-url.com`

## Authentication
All admin endpoints require:
- Header: `Authorization: Bearer <admin_jwt_token>`
- User must have `isAdmin: true` in the database

---

## 0. Reset Password API

### Request Password Reset OTP
**POST** `/api/otp/request`
```json
{
  "email": "user@example.com"
}
```

### Reset Password with OTP
**POST** `/api/otp/reset`
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Note:** Complete Reset Password API documentation: See `RESET_PASSWORD_API.md`

---

## 1. Players Management

### Create Player
**POST** `/api/admin/players`
```json
{
  "name": "John",
  "surname": "Doe",
  "gender": "male",
  "category": "A",
  "initialPrice": 100.50,
  "initialRating": 75,
  "isActive": true
}
```

### Get All Players
**GET** `/api/admin/players?isActive=true&gender=male&category=A&competition=competition_id`

### Get Single Player
**GET** `/api/admin/players/:id`

### Update Player
**PUT** `/api/admin/players/:id`
```json
{
  "name": "John Updated",
  "currentPrice": 120.00,
  "currentRating": 80,
  "isActive": true
}
```

### Delete Player
**DELETE** `/api/admin/players/:id`

### Upload Players CSV
**POST** `/api/admin/players/upload-csv`
- Content-Type: `multipart/form-data`
- Field: `file` (CSV file)
- CSV Format: `name,surname,gender,category,initialPrice,initialRating,position,isActive`

### Assign Player to Competition
**POST** `/api/admin/players/:playerId/assign-competition`
```json
{
  "competitionId": "competition_id_here"
}
```

### Remove Player from Competition
**DELETE** `/api/admin/players/:playerId/competitions/:competitionId`

---

## 2. Seasons & Competitions Management

### Create Season
**POST** `/api/admin/seasons`
```json
{
  "name": "Italian Championship 2026",
  "year": 2026,
  "isActive": true
}
```

### Get All Seasons
**GET** `/api/admin/seasons`

### Get Single Season
**GET** `/api/admin/seasons/:id`

### Update Season
**PUT** `/api/admin/seasons/:id`
```json
{
  "name": "Italian Championship 2026 Updated",
  "isActive": false
}
```

### Delete Season
**DELETE** `/api/admin/seasons/:id`

### Create Competition
**POST** `/api/admin/competitions`
```json
{
  "name": "Tournament 1",
  "season": "season_id_here",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "status": "upcoming",
  "weight": "Gold",
  "multiplier": 1.5,
  "deadlineForChanges": "2026-01-15T00:00:00Z",
  "budget": 1000,
  "totalSquadSize": 15,
  "startersCount": 10,
  "benchCount": 5,
  "genderRules": "mixed",
  "maxTopPlayers": 3,
  "perGenderLimits": {
    "male": 7,
    "female": 8
  },
  "transferRules": {
    "changesAllowed": 5,
    "transferWindowOpen": "2026-01-01T00:00:00Z",
    "transferWindowClose": "2026-12-31T23:59:59Z"
  }
}
```

### Get All Competitions
**GET** `/api/admin/competitions?season=season_id&status=upcoming`

### Get Single Competition
**GET** `/api/admin/competitions/:id`

### Update Competition
**PUT** `/api/admin/competitions/:id`
```json
{
  "status": "in_progress",
  "budget": 1200
}
```

### Delete Competition
**DELETE** `/api/admin/competitions/:id`

### Add Matchweek
**POST** `/api/admin/competitions/:id/matchweeks`
```json
{
  "weekNumber": 1,
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-07T23:59:59Z",
  "formationDeadline": "2026-01-01T12:00:00Z",
  "status": "upcoming"
}
```

### Update Matchweek
**PUT** `/api/admin/competitions/:id/matchweeks/:weekNumber`
```json
{
  "status": "in_progress",
  "formationDeadline": "2026-01-01T14:00:00Z"
}
```

---

## 3. Pairs, Matches & Results

### Create Pair
**POST** `/api/admin/pairs`
```json
{
  "player1": "player1_id",
  "player2": "player2_id",
  "competition": "competition_id",
  "matchweek": 1,
  "isActive": true
}
```

### Create Bulk Pairs
**POST** `/api/admin/pairs/bulk`
```json
{
  "competition": "competition_id",
  "matchweek": 1,
  "pairs": [
    {
      "player1": "player1_id",
      "player2": "player2_id"
    },
    {
      "player1": "player3_id",
      "player2": "player4_id"
    }
  ]
}
```

### Get All Pairs
**GET** `/api/admin/pairs?competition=competition_id&matchweek=1&isActive=true`

### Get Single Pair
**GET** `/api/admin/pairs/:id`

### Update Pair
**PUT** `/api/admin/pairs/:id`
```json
{
  "isActive": false
}
```

### Delete Pair
**DELETE** `/api/admin/pairs/:id`

### Create Match
**POST** `/api/admin/matches`
```json
{
  "competition": "competition_id",
  "matchweek": 1,
  "pair1": "pair1_id",
  "pair2": "pair2_id",
  "matchDate": "2026-01-01T15:00:00Z"
}
```

### Get All Matches
**GET** `/api/admin/matches?competition=competition_id&matchweek=1&isCompleted=false`

### Get Single Match
**GET** `/api/admin/matches/:id`

### Update Match Results
**PUT** `/api/admin/matches/:id/results`
```json
{
  "scores": {
    "set1": {
      "pair1Score": 21,
      "pair2Score": 19
    },
    "set2": {
      "pair1Score": 18,
      "pair2Score": 21
    },
    "set3": {
      "pair1Score": 15,
      "pair2Score": 12
    }
  },
  "winner": "pair1_id"
}
```

### Recalculate Match Points
**POST** `/api/admin/matches/:id/recalculate`

### Delete Match
**DELETE** `/api/admin/matches/:id`

---

## 4. Game Rules Configuration

### Get Game Rules
**GET** `/api/admin/game-rules/:competitionId`

### Get All Game Rules
**GET** `/api/admin/game-rules`

### Update Game Rules
**PUT** `/api/admin/game-rules/:competitionId`
```json
{
  "initialBudget": 1200,
  "minPlayers": 8,
  "maxPlayers": 15,
  "maxTopPlayers": 3,
  "perGenderLimits": {
    "male": 7,
    "female": 8
  },
  "transferRules": {
    "changesAllowed": 5,
    "transferWindowOpen": "2026-01-01T00:00:00Z",
    "transferWindowClose": "2026-12-31T23:59:59Z"
  },
  "scoringRules": {
    "winPoints": 10,
    "lossPoints": 5,
    "setWinPoints": 3,
    "setLossPoints": 1
  }
}
```

---

## 5. Users & Fantasy Teams Monitoring

### Get All Users
**GET** `/api/admin/users?isVerified=true&isAdmin=false`

### Get User Profile
**GET** `/api/admin/users/:id`

### Get User Fantasy Teams
**GET** `/api/admin/users/:id/fantasy-teams?competition=competition_id`

### Get Fantasy Team Details
**GET** `/api/admin/users/:userId/fantasy-teams/:teamId`

### Reset Fantasy Team
**POST** `/api/admin/users/:userId/fantasy-teams/:teamId/reset`

### Change Player in Team
**PUT** `/api/admin/users/:userId/fantasy-teams/:teamId/change-player`
```json
{
  "oldPlayerId": "old_player_id",
  "newPlayerId": "new_player_id",
  "position": "starter"
}
```

### Block User
**PUT** `/api/admin/users/:id/block`
```json
{
  "isBlocked": true
}
```

### Get Leaderboard
**GET** `/api/admin/competitions/:competitionId/leaderboard`

---

## 6. Player Prices & Price Updates

### Get All Prices
**GET** `/api/admin/prices?competition=competition_id`

### Get Price History
**GET** `/api/admin/prices/:playerId/history`

### Update Player Price
**PUT** `/api/admin/prices/:playerId`
```json
{
  "newPrice": 150.00,
  "reason": "Manual adjustment"
}
```

### Recalculate Prices
**POST** `/api/admin/prices/recalculate`
```json
{
  "competitionId": "competition_id_optional"
}
```

### Bulk Update Prices
**POST** `/api/admin/prices/bulk-update`
```json
{
  "updates": [
    {
      "playerId": "player1_id",
      "newPrice": 120.00
    },
    {
      "playerId": "player2_id",
      "newPrice": 130.00
    }
  ]
}
```

---

## 7. Real-Time Monitoring & Error Control

### Get All Squads
**GET** `/api/admin/monitoring/squads?competition=competition_id&matchweek=1`

### Get Player Scores
**GET** `/api/admin/monitoring/player-scores?competition=competition_id&matchweek=1`

### Detect Anomalies
**GET** `/api/admin/monitoring/anomalies?competition=competition_id&matchweek=1`

### Fix Errors
**POST** `/api/admin/monitoring/fix-errors`
```json
{
  "competition": "competition_id_optional",
  "matchweek": 1,
  "fixType": "both"
}
```
- `fixType`: `"recalculate_match_points"`, `"recalculate_fantasy_points"`, or `"both"`

### Get Dashboard
**GET** `/api/admin/monitoring/dashboard?competition=competition_id_optional`

---

## 8. Private Competitions Management

### Get All Private Leagues
**GET** `/api/admin/private-leagues`

### Get Single Private League
**GET** `/api/admin/private-leagues/:id`

### Get League Participants
**GET** `/api/admin/private-leagues/:id/participants`

### Update Private League
**PUT** `/api/admin/private-leagues/:id`
```json
{
  "leagueName": "Updated League Name",
  "description": "Updated description",
  "playerAvailability": "available",
  "gameMode": "standard"
}
```

### Delete Private League
**DELETE** `/api/admin/private-leagues/:id`

### Remove User from League
**DELETE** `/api/admin/private-leagues/:leagueId/users/:userId`

### Block User Account
**PUT** `/api/admin/users/:userId/block-account`
```json
{
  "isBlocked": true
}
```

---

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Notes

1. All date fields should be in ISO 8601 format (e.g., `2026-01-01T00:00:00Z`)
2. All IDs in URL parameters should be MongoDB ObjectIds
3. Query parameters are optional unless specified
4. CSV upload requires the file to have headers: `name,surname,gender,category,initialPrice,initialRating,position,isActive`
5. The system automatically calculates points when match results are updated
6. Price recalculation uses performance-based algorithm (can be customized)

