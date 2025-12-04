# Setup Guide for Longo Admin Dashboard

This guide will help you set up the Longo Admin Dashboard from scratch.

## Step 1: Prerequisites

Before you begin, make sure you have:

- ✅ Node.js 18 or higher installed ([Download](https://nodejs.org/))
- ✅ A Supabase account and project ([Sign up](https://supabase.com))
- ✅ Git installed ([Download](https://git-scm.com/))

## Step 2: Clone the Repository

```bash
git clone https://github.com/Jkschlo/Longo-Admin.git
cd Longo-Admin
```

## Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Supabase client, and other dependencies.

## Step 4: Set Up Supabase

### 4.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Longo Admin (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region
4. Click "Create new project"
5. Wait for the project to be created (takes 1-2 minutes)

### 4.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. You'll see three important values:
   - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key - This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### 4.3 Set Up Database Tables

Your Supabase database needs the following tables. If you're migrating from an existing setup, these should already exist. If not, you'll need to create them:

**Required Tables:**
- `profiles` - User profiles with `is_admin` field
- `modules` - Training modules
- `categories` - Module categories
- `module_progress` - User progress tracking
- `quiz_attempts` - Quiz results
- `user_roles` - User role assignments
- `roles` - Available roles

**Storage Buckets:**
- `module-images` - For module cover images
- `category-images` - For category cover images
- `module-content` - For PDFs and content files

## Step 5: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Save the file

## Step 6: Create Your First Admin User

You need at least one user with admin privileges to access the dashboard.

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Create a new user or use an existing one
4. Note the user's UUID (found in the users table)

5. Go to **Table Editor** > **profiles**
6. Create a new profile or update existing one:
   - `id`: The user's UUID from step 3
   - `email`: The user's email
   - `is_admin`: Set to `true`
   - `first_name`: Your first name
   - `last_name`: Your last name

### Option B: Using SQL

1. Go to **SQL Editor** in Supabase
2. Run this query (replace with your email and user ID):
   ```sql
   -- First, create the user in auth.users (or use existing)
   -- Then update/create their profile
   INSERT INTO profiles (id, email, is_admin, first_name, last_name)
   VALUES (
     'your-user-uuid-here',
     'admin@example.com',
     true,
     'Admin',
     'User'
   )
   ON CONFLICT (id) DO UPDATE
   SET is_admin = true;
   ```

## Step 7: Run the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Step 8: Access the Dashboard

1. Open your browser and go to [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to the login page
3. Log in with your admin credentials
4. You should now see the dashboard!

## Step 9: Configure Storage Buckets (If Needed)

If you haven't set up storage buckets yet:

1. Go to **Storage** in Supabase dashboard
2. Create the following buckets:
   - `module-images` (Public)
   - `category-images` (Public)
   - `module-content` (Public)

3. Set up bucket policies to allow uploads (if needed)

## Troubleshooting

### "Cannot connect to Supabase"
- Check that your `.env.local` file has the correct values
- Verify your Supabase project is active
- Check your internet connection

### "Unauthorized" when logging in
- Verify your user has `is_admin: true` in the profiles table
- Check that the user exists in both `auth.users` and `profiles` tables
- Try logging out and back in

### "Missing environment variables"
- Ensure `.env.local` exists (not just `.env.example`)
- Restart the development server after changing environment variables
- Check for typos in variable names

### Build errors
- Clear the `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Next Steps

Once everything is set up:

1. ✅ Explore the dashboard features
2. ✅ Create your first training module
3. ✅ Add categories
4. ✅ Set up user roles
5. ✅ Configure email templates (see `supabase-email-templates/README.md`)

## Need Help?

- Check the main [README.md](README.md) for more information
- Open an issue on GitHub
- Contact support

---

**Happy Admin-ing! 🚀**
