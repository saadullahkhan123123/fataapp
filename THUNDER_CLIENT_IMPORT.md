# Thunder Client Collection Import Guide

## How to Import

1. Open Thunder Client extension in VS Code
2. Click on "Collections" tab
3. Click the "+" button or "New Collection"
4. Copy the JSON from `thunder-client-collection.json`
5. Paste it into the collection editor
6. Save the collection

## Environment Variables Setup

Create an environment in Thunder Client with these variables:

- `baseUrl`: `http://localhost:5000` (or your production URL)
- `adminToken`: Your admin JWT token (get it by logging in as an admin user)

## Using the Collection

1. Set the environment variables
2. Navigate through the folders to find the API you need
3. Replace URL parameters (like `:id`, `:playerId`, etc.) with actual IDs
4. Update request bodies with your data
5. Click "Send" to test the API

## Important Notes

- All requests require the `Authorization: Bearer {{adminToken}}` header
- Make sure your user has `isAdmin: true` in the database
- Replace all placeholder IDs in URLs and request bodies
- For CSV upload, use the file upload option in Thunder Client

## Quick Test Flow

1. **Create a Season**
   - POST `/api/admin/seasons`
   - Save the season ID

2. **Create a Competition**
   - POST `/api/admin/competitions`
   - Use the season ID from step 1
   - Save the competition ID

3. **Create Players**
   - POST `/api/admin/players` (individual)
   - OR POST `/api/admin/players/upload-csv` (bulk)

4. **Assign Players to Competition**
   - POST `/api/admin/players/:playerId/assign-competition`

5. **Create Pairs**
   - POST `/api/admin/pairs` or `/api/admin/pairs/bulk`

6. **Create Matches**
   - POST `/api/admin/matches`

7. **Update Match Results**
   - PUT `/api/admin/matches/:id/results`
   - Points are automatically calculated

8. **Monitor**
   - GET `/api/admin/monitoring/dashboard`
   - GET `/api/admin/monitoring/anomalies`

