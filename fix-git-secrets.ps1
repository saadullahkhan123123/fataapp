# PowerShell script to remove .env from git tracking and history
# Run this script to fix the exposed secrets issue

Write-Host "========================================" -ForegroundColor Red
Write-Host "REMOVING .env FROM GIT TRACKING" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Step 1: Remove .env from git tracking (but keep local file)
Write-Host "Step 1: Removing .env from git tracking..." -ForegroundColor Yellow
git rm --cached .env

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ .env removed from git tracking" -ForegroundColor Green
} else {
    Write-Host "✗ Error removing .env from tracking" -ForegroundColor Red
    exit 1
}

# Step 2: Add .gitignore to ensure .env is ignored
Write-Host ""
Write-Host "Step 2: Ensuring .gitignore is in place..." -ForegroundColor Yellow
if (Test-Path .gitignore) {
    Write-Host "✓ .gitignore exists" -ForegroundColor Green
} else {
    Write-Host "✗ .gitignore not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Commit the changes
Write-Host ""
Write-Host "Step 3: Committing changes..." -ForegroundColor Yellow
git add .gitignore
git commit -m "Remove .env from git tracking and add .gitignore"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✗ Error committing changes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. REVOKE YOUR STRIPE KEYS IMMEDIATELY:" -ForegroundColor Red
Write-Host "   Go to: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Cyan
Write-Host "   Revoke the exposed keys and generate new ones" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. If you've already pushed to GitHub:" -ForegroundColor Yellow
Write-Host "   You need to remove .env from git history:" -ForegroundColor Yellow
Write-Host "   See REMOVE_SECRETS_FROM_GIT.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Update your local .env file with new keys" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Verify .env is now ignored:" -ForegroundColor Yellow
Write-Host "   git status (should not show .env)" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green

