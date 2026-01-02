# Quick Fix for Exposed Stripe Secrets

## 🚨 URGENT: Your Stripe API keys are in Git!

## Immediate Actions Required

### 1. Revoke Stripe Keys (DO THIS FIRST!)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click on each exposed key → "Revoke"
3. Generate new test keys

### 2. Remove .env from Git (Run this now)

**Option A: Use the PowerShell script (Windows)**
```powershell
.\fix-git-secrets.ps1
```

**Option B: Manual commands**
```bash
# Remove .env from git tracking (keeps local file)
git rm --cached .env

# Commit the removal
git add .gitignore
git commit -m "Remove .env from git tracking and add .gitignore"
```

### 3. Remove from Git History (if already pushed)

**If you haven't pushed yet:**
```bash
# Just push normally after step 2
git push
```

**If you already pushed to GitHub:**
```bash
# Remove from entire history (WARNING: Rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first!)
git push origin --force --all
```

### 4. Update Your Local .env
1. Copy `env.example.txt` to `.env`
2. Fill in your NEW Stripe keys (after revoking old ones)
3. `.env` will now be ignored by git (thanks to .gitignore)

### 5. Verify Fix
```bash
# Check .env is no longer tracked
git ls-files | grep ".env"

# Should only show files in node_modules, NOT your .env
```

## What I Fixed

✅ Created `.gitignore` - Now `.env` will be ignored
✅ Created `env.example.txt` - Template for environment variables
✅ Created `fix-git-secrets.ps1` - Automated fix script

## Prevention

- ✅ Always check `git status` before committing
- ✅ Never commit `.env` file
- ✅ Use `.env.example` or `env.example.txt` as templates
- ✅ Keep all secrets in `.env` which is now in `.gitignore`

---

**Remember:** Revoke your Stripe keys NOW, before continuing!

