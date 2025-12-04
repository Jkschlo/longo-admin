# Quick Fix: Vercel Auto-Deployment Issue

## Immediate Steps to Fix Auto-Deployment

### Option 1: Quick Fix (5 minutes)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your project

2. **Check Git Integration**
   - Click **Settings** → **Git**
   - Verify your GitHub repository is connected
   - Check that **Production Branch** is set to `main` (or `master` if that's your branch)

3. **Reconnect if Needed**
   - If anything looks off, click **"Disconnect"** or **"Change Repository"**
   - Click **"Connect Git Repository"**
   - Select your repository again
   - Grant necessary permissions

4. **Test**
   - Make a small change (add a comment to any file)
   - Commit and push to GitHub
   - Check Vercel dashboard - you should see a new deployment start automatically

### Option 2: Check GitHub Webhooks (If Option 1 doesn't work)

1. **On GitHub**
   - Go to your repository on GitHub.com
   - Click **Settings** → **Webhooks**
   - Look for a webhook to `vercel.com`
   - Check "Recent Deliveries" for any errors

2. **If webhook is missing or broken**
   - Go back to Vercel
   - Disconnect and reconnect the repository (as in Option 1)
   - This will recreate the webhook

### Option 3: Manual Trigger (To verify Vercel is working)

1. In Vercel dashboard, go to **Deployments**
2. Find your latest deployment
3. Click the **"..."** menu → **"Redeploy"**
4. If this works but auto-deploy doesn't, it confirms it's a webhook/integration issue

## Common Causes

- ❌ GitHub integration disconnected or lost permissions
- ❌ Production branch set incorrectly (e.g., `master` vs `main`)
- ❌ Webhook expired or deleted from GitHub
- ❌ Repository moved or renamed on GitHub
- ❌ GitHub organization permissions changed

## Still Not Working?

1. Check Vercel project **Settings** → **Git** → **Automatic deployments from Git** is enabled
2. Verify you're pushing to the correct branch (check git status)
3. Check Vercel deployment logs for any errors
4. Try making a commit with a clear message to trigger deployment

## Need More Help?

See the full troubleshooting guide in [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)
