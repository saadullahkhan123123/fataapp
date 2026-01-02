# Removing Secrets from Git History

## ⚠️ IMPORTANT: Your Stripe API keys were committed to Git

Your `.env` file with sensitive Stripe API keys has been committed to Git. Follow these steps to remove them:

## Step 1: Remove .env from Git Tracking

```bash
# Remove .env from git tracking (but keep the local file)
git rm --cached .env

# Commit the removal
git commit -m "Remove .env file from git tracking"
```

## Step 2: Remove .env from Git History (IMPORTANT)

If you've already pushed to GitHub, you need to remove the secrets from the entire git history:

### Option A: Using git filter-branch (if you haven't pushed to main/master yet)

```bash
# Remove .env from entire git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### Option B: Using BFG Repo-Cleaner (Recommended - Faster)

1. Install BFG: Download from https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
```bash
# Make a backup first!
git clone --mirror your-repo-url.git repo-backup.git

# Remove .env from history
java -jar bfg.jar --delete-files .env your-repo.git

# Clean up
cd your-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### Option C: If the repo is new and has few commits

If this is a new repository with minimal commits, you can:
1. Create a new repository
2. Copy your code (except .env)
3. Start fresh with proper .gitignore

## Step 3: Revoke and Regenerate Stripe Keys

**CRITICAL:** Since your keys were exposed, you MUST revoke them:

1. Go to https://dashboard.stripe.com/test/apikeys
2. Revoke the exposed API keys
3. Generate new API keys
4. Update your local `.env` file with the new keys
5. Never commit `.env` again!

## Step 4: Verify .gitignore is Working

```bash
# Check if .env is being tracked
git ls-files | grep .env

# Should return nothing. If .env appears, it's still being tracked.

# Check if .env is ignored
git status

# .env should NOT appear in untracked files
```

## Step 5: Set Up Your Local .env File

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your actual values in `.env` (this file will NOT be committed)

## Prevention for Future

✅ `.gitignore` is now created with `.env` in it
✅ `.env.example` template is created for reference
✅ Never commit `.env` file again
✅ Always check `git status` before committing

## Note

If your repository is public and the keys were exposed:
- Revoke them immediately
- Monitor your Stripe dashboard for any unauthorized activity
- Consider enabling Stripe's fraud detection features

