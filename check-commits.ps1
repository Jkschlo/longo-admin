# Quick diagnostic script to check commit status
# Run this to verify your commits are pushed to GitHub

Write-Host "=== Git Commit Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check current branch
$branch = git branch --show-current
Write-Host "Current Branch: $branch" -ForegroundColor Yellow

# Check if we're on main
if ($branch -ne "main" -and $branch -ne "master") {
    Write-Host "⚠️  WARNING: You're not on main/master branch!" -ForegroundColor Red
    Write-Host "   Vercel only auto-deploys from the production branch" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Local Commits (Last 5) ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host ""
Write-Host "=== Remote Commits on origin/$branch (Last 5) ===" -ForegroundColor Cyan

# Check if remote exists
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "Remote: $remote" -ForegroundColor Gray
    Write-Host ""
    
    # Fetch latest from remote
    Write-Host "Fetching latest from GitHub..." -ForegroundColor Gray
    git fetch origin 2>&1 | Out-Null
    
    # Show remote commits
    git log origin/$branch --oneline -5 2>$null
    
    # Compare local vs remote
    Write-Host ""
    Write-Host "=== Comparison ===" -ForegroundColor Cyan
    
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse "origin/$branch" 2>$null
    
    if ($remoteCommit) {
        Write-Host "Local HEAD:  $localCommit" -ForegroundColor Gray
        Write-Host "Remote HEAD: $remoteCommit" -ForegroundColor Gray
        
        if ($localCommit -eq $remoteCommit) {
            Write-Host "✅ Local and remote are in sync" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Local and remote differ!" -ForegroundColor Yellow
            Write-Host "   Checking if local is ahead..." -ForegroundColor Gray
            
            $commitsAhead = (git rev-list "origin/$branch..HEAD" 2>$null | Measure-Object).Count
            $commitsBehind = (git rev-list "HEAD..origin/$branch" 2>$null | Measure-Object).Count
            
            if ($commitsAhead -gt 0) {
                Write-Host "⚠️  You have $commitsAhead commit(s) that haven't been pushed!" -ForegroundColor Red
                Write-Host "   Run: git push origin $branch" -ForegroundColor Yellow
            }
            
            if ($commitsBehind -gt 0) {
                Write-Host "ℹ️  Remote has $commitsBehind commit(s) you don't have locally" -ForegroundColor Blue
            }
        }
    } else {
        Write-Host "⚠️  Could not fetch remote branch. Check your connection." -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== Check for deb40c8 commit ===" -ForegroundColor Cyan
    $hasDeb40c8 = git log --oneline --all | Select-String "deb40c8"
    if ($hasDeb40c8) {
        Write-Host "Found deb40c8 in commit history" -ForegroundColor Yellow
        $deb40c8Date = git log -1 --format="%ci" deb40c8 2>$null
        if ($deb40c8Date) {
            Write-Host "Commit date: $deb40c8Date" -ForegroundColor Gray
        }
        
        # Check if we're ahead of it
        $commitsSince = (git rev-list "deb40c8..HEAD" 2>$null | Measure-Object).Count
        if ($commitsSince -gt 0) {
            Write-Host "✅ You have $commitsSince commit(s) newer than deb40c8" -ForegroundColor Green
            Write-Host ""
            Write-Host "These commits should be on Vercel but aren't:" -ForegroundColor Yellow
            git log deb40c8..HEAD --oneline | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "ℹ️  deb40c8 appears to be your latest commit (or ahead)" -ForegroundColor Blue
        }
    } else {
        Write-Host "⚠️  deb40c8 not found in local git history" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No remote 'origin' configured" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Verify commits are pushed: git push origin $branch" -ForegroundColor White
Write-Host "2. Check GitHub: https://github.com/Jkschlo/Longo-Admin/commits/main" -ForegroundColor White
Write-Host "3. Check Vercel webhook: GitHub repo → Settings → Webhooks" -ForegroundColor White
Write-Host "4. See VERCEL-WEBHOOK-FIX.md for detailed fix instructions" -ForegroundColor White
