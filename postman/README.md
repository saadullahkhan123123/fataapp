## Postman Testing (Team/Player/League/Match Management - V2)

### Files
- `FantaBeach-TeamManagement.postman_collection.json`
- `FantaBeach.postman_environment.json`

### Import
1. Postman -> **Import** -> select the 2 JSON files above.
2. Select environment **"FantaBeach (Local/Prod)"**.
3. Set `baseUrl`:
   - Local: `http://localhost:5000`
   - Production: `https://fantabeach-backend-code.vercel.app`

### Admin credentials note (dotenv)
If your `.env` has `ADMIN_PASSWORD=admin123!@#` **without quotes**, dotenv will treat `#` as a comment and the real password becomes `admin123!@`.
Recommended:
`ADMIN_PASSWORD="admin123!@#"`

### Suggested run order
1. **Auth (Admin)** -> login (stores `adminToken`)
2. **Auth (Team Creator User)** -> register -> verify (stores `teamCreatorToken`)
3. **Auth (Team Creator User 2)** -> register -> verify (stores `teamCreator2Token`)
4. **Packs (purchase approval)** -> buy (both users) -> admin approve (both)
5. **Team** -> create team (both users)
6. **Player (from user)**:
   - Run the folder 4 times to create **4 Player Profiles**
   - Each run appends to `playerProfileIdsCsv`
   - Then run **Lineup (Team Creator)** to set 4 actives
7. **League** -> admin create -> both users request join -> admin approves both
8. **Match** -> admin create match -> team creator sets lineup -> admin lock -> admin result


