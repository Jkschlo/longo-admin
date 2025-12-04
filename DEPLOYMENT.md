# Deployment Guide

This guide covers deploying the Longo Admin Dashboard to various platforms.

## Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Ensure all environment variables are documented in `.env.example`

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (or `longo-admin` if in monorepo)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Add Environment Variables

In the Vercel project settings:

1. Go to **Settings** > **Environment Variables**
2. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Set them for all environments (Production, Preview, Development)
4. Click "Save"

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** > **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Netlify

### Step 1: Build Settings

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" > "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Base directory**: `longo-admin` (if in monorepo)

### Step 2: Environment Variables

1. Go to **Site settings** > **Environment variables**
2. Add all required environment variables
3. Save

### Step 3: Deploy

Netlify will automatically deploy on every push to your main branch.

## Railway

### Step 1: Create Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Configure

1. Railway will auto-detect Next.js
2. Add environment variables in the **Variables** tab
3. Deploy

## Render

### Step 1: Create Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click "New" > "Web Service"
3. Connect your GitHub repository

### Step 2: Configure

- **Name**: longo-admin
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Step 3: Environment Variables

Add all required environment variables in the **Environment** section.

## Environment Variables for Production

Make sure to set these in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Test login functionality
- [ ] Verify API routes work
- [ ] Check image uploads
- [ ] Test on mobile devices
- [ ] Set up custom domain (if applicable)
- [ ] Configure email templates in Supabase
- [ ] Update password reset redirect URL in Supabase

## Troubleshooting

### Vercel Not Auto-Deploying on GitHub Commits

If your changes aren't automatically deploying when you push to GitHub, try these steps:

#### 1. Check GitHub Integration

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Git**
3. Verify that your GitHub repository is connected
4. If disconnected or incorrect:
   - Click "Disconnect" or "Change Repository"
   - Reconnect your GitHub repository
   - Ensure you grant Vercel the necessary permissions

#### 2. Verify Production Branch

1. Go to **Settings** > **Git**
2. Check the **Production Branch** setting
3. Ensure it matches your main branch (`main` or `master`)
4. If incorrect, update it and save

#### 3. Check GitHub Webhooks

1. Go to your GitHub repository on GitHub.com
2. Navigate to **Settings** > **Webhooks**
3. Look for a webhook pointing to `vercel.com`
4. If missing or shows errors:
   - Go back to Vercel
   - Disconnect and reconnect the GitHub integration
   - This will recreate the webhook

#### 4. Verify Repository Access

1. In Vercel, go to **Settings** > **Git**
2. Ensure the correct GitHub account/organization is connected
3. Check that Vercel has access to the repository:
   - Go to GitHub repository settings
   - Navigate to **Settings** > **Integrations** > **Vercel**
   - Ensure permissions are granted

#### 5. Manual Deployment Test

1. In Vercel dashboard, go to **Deployments** tab
2. Click the "..." menu on your latest deployment
3. Select "Redeploy" to test if manual deployment works
4. If manual works but auto-deploy doesn't, it's a webhook/integration issue

#### 6. Check Deployment Settings

1. Go to **Settings** > **Git**
2. Verify **Automatic deployments from Git** is enabled
3. Check **Production Branch** matches your actual branch name
4. Review **Ignore Build Step** - ensure it's not blocking deployments

#### 7. Common Fix: Reconnect Repository

If none of the above works:

1. Go to **Settings** > **Git**
2. Click "Disconnect" for the current repository
3. Go to your project overview
4. Click "Connect Git Repository"
5. Select your repository again
6. This will refresh the integration and recreate webhooks

#### 8. Check GitHub Repository Settings

On GitHub:
1. Go to repository **Settings** > **Webhooks**
2. Look for Vercel webhook (URL should contain `vercel.com`)
3. Check recent deliveries for any errors
4. If you see 401/403 errors, reconnect the integration

### Build Fails

- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check build logs for specific errors

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart the deployment after adding variables
- Check for typos in variable names

### API Routes Not Working

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project is active
- Review server logs for errors

## Continuous Deployment

All platforms support automatic deployments:

- **Vercel**: Automatic on push to main branch
- **Netlify**: Automatic on push to main branch
- **Railway**: Automatic on push to main branch
- **Render**: Automatic on push to main branch

Configure branch protection and preview deployments as needed.

## Security Notes

- Never commit `.env.local` or `.env` files
- Use environment variables in your deployment platform
- Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically
- Enable 2FA on your deployment accounts
- Review access logs regularly

---

For more help, see the main [README.md](README.md) or open an issue.
