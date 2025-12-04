# Longo Admin Dashboard

Admin dashboard for managing the Longo Training App, including user management, training modules, analytics, and content creation.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase project with the following setup:
  - Authentication enabled
  - Database tables: `profiles`, `modules`, `categories`, `module_progress`, `quiz_attempts`, `user_roles`, `roles`
  - Storage buckets configured for images and PDFs

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jkschlo/Longo-Admin.git
   cd Longo-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Then fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the "service_role" key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
longo-admin/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── delete-user/   # Admin user deletion endpoint
│   │   ├── delete-own-account/ # User self-deletion endpoint
│   │   └── upload-image/  # Image upload endpoint
│   ├── dashboard/         # Admin dashboard pages
│   │   ├── modules/       # Module management
│   │   ├── reports/       # Analytics and reports
│   │   └── users/         # User management
│   ├── login/            # Admin login page
│   ├── privacy/           # Privacy policy page
│   ├── reset-password/    # Password reset page
│   └── terms/             # Terms of service page
├── lib/                   # Utility functions
│   ├── api-client.ts      # Authenticated API client
│   ├── auth-utils.ts     # Server-side auth utilities
│   └── supabaseClient.ts # Supabase client configuration
├── public/                # Static assets
└── supabase-email-templates/ # Email templates
```

## 🔐 Authentication

The admin dashboard uses Supabase authentication with role-based access control:

1. **Admin Access**: Only users with `is_admin: true` in the `profiles` table can access the dashboard
2. **Login**: Navigate to `/login` and use your admin credentials
3. **Session Management**: Sessions are automatically managed and refreshed
4. **Security**: All API routes verify admin status before processing requests

## 🛠️ Features

### User Management
- View all users and their progress
- Assign roles to users
- Toggle admin access (admins cannot remove their own access)
- Reset user passwords
- Delete user accounts

### Module Management
- Create and edit training modules
- Organize modules by categories
- Upload cover images
- Add rich content (text, images, videos, PDFs)
- Reorder modules and content blocks

### Analytics & Reports
- View user progress statistics
- Track module completion rates
- Leaderboard with filtering
- User-specific analytics

### Content Creation
- Rich text editor for module content
- Image upload and management
- PDF upload support
- Video embedding (YouTube)
- Drag-and-drop content ordering

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |

### Supabase Storage Buckets

The app expects the following storage buckets:
- `module-images` - Cover images for modules
- `category-images` - Cover images for categories
- `module-content` - PDFs and other content files

## 📝 API Routes

### `/api/delete-user`
Deletes a user account (admin only).
- **Method**: POST
- **Auth**: Admin required
- **Body**: `{ userId: string }`

### `/api/delete-own-account`
Allows users to delete their own account (mobile app).
- **Method**: POST
- **Auth**: User authentication required
- **Body**: `{ confirmName: string }`

### `/api/upload-image`
Uploads images to Supabase storage (admin only).
- **Method**: POST
- **Auth**: Admin required
- **Body**: FormData with `file` and `folder`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

Make sure to set all environment variables in your deployment platform.

## 🔒 Security Features

- ✅ Admin-only access control
- ✅ Server-side authentication verification
- ✅ Input validation and sanitization
- ✅ Rate limiting on login
- ✅ Secure password reset flow
- ✅ Session timeout management
- ✅ API route protection

## 📧 Email Templates

Custom email templates are located in `supabase-email-templates/`:
- `reset-password.html` - Password reset email template

To use these templates:
1. Copy the HTML content
2. Go to Supabase Dashboard > Authentication > Email Templates
3. Paste into the appropriate template
4. Keep `{{ .ConfirmationURL }}` placeholder

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists and contains all required variables
- Restart the development server after adding environment variables

### "Unauthorized" errors
- Verify your user has `is_admin: true` in the `profiles` table
- Check that your session is valid (try logging out and back in)

### Image upload fails
- Verify Supabase storage buckets exist
- Check bucket policies allow uploads
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📚 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **UI Components**: Headless UI, Lucide Icons
- **Charts**: Recharts
- **Animations**: Framer Motion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [Your Contact Email]

## 🔗 Related Projects

- [Longo Training App](https://github.com/Jkschlo/Longo_App) - Mobile training app

---

**Made with ❤️ for Longo Carpet Cleaning**
