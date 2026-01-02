# CSV Upload Guide for Players

## CSV Format

The CSV file should have the following columns (in order):

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| name | Yes | Player's first name | John |
| surname | Yes | Player's last name | Doe |
| gender | Yes | Must be "male" or "female" | male |
| category | Yes | Player category | A |
| initialPrice | Yes | Initial price (number) | 100.50 |
| initialRating | Yes | Initial rating 0-100 | 75 |
| position | No | Position in ordered list (weakest → strongest) | 1 |
| isActive | No | true/false or 1/0 | true |

## Sample CSV

```csv
name,surname,gender,category,initialPrice,initialRating,position,isActive
John,Doe,male,A,100.50,75,1,true
Jane,Smith,female,B,90.00,70,2,true
Mike,Johnson,male,A,110.00,80,3,true
Sarah,Williams,female,A,95.00,72,4,true
```

## Notes

1. **Header Row:** The CSV must include a header row with column names
2. **Position:** If not provided, players will be added without a position. You can update positions later
3. **Ordering:** After upload, all active players are automatically sorted by position
4. **Validation:** 
   - Gender must be exactly "male" or "female" (case-insensitive)
   - Prices and ratings must be valid numbers
   - isActive can be "true"/"false" or "1"/"0"

## Upload Process

1. Prepare your CSV file with the correct format
2. Use the endpoint: `POST /api/admin/players/upload-csv`
3. Select the file in the form-data field named "file"
4. The system will:
   - Parse the CSV
   - Create all players
   - Sort them by position
   - Return a summary of created players and any errors

## Response Format

```json
{
  "success": true,
  "message": "Successfully uploaded 4 players",
  "data": {
    "created": 4,
    "errors": 0,
    "errorDetails": []
  }
}
```

## Error Handling

If some rows fail:
- The system will continue processing other rows
- Failed rows will be listed in `errorDetails` with the reason
- Successfully created players will still be saved

## Tips

1. **Test with small file first:** Upload a few players to test the format
2. **Check for duplicates:** Make sure player names don't conflict
3. **Position ordering:** Start from 1 (weakest) and increment
4. **Backup:** Keep a copy of your CSV file

