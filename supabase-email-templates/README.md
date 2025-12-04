# Supabase Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Reset Password Email Template

The `reset-password.html` file contains a branded email template for password reset requests.

### How to Use

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication → Email Templates
   - Select "Reset Password" template

2. **Copy the Template**
   - Open `reset-password.html` from this directory
   - Copy the entire HTML content

3. **Paste in Supabase**
   - Paste the HTML into the "Reset Password" template editor
   - Make sure to keep the `{{ .ConfirmationURL }}` variable (this is required)

4. **Save**
   - Click "Save" to apply the template

### Template Features

- ✅ Branded with Longo Training colors (#0A2C57, #093075, #6EC1E4)
- ✅ Professional gradient header
- ✅ Clear call-to-action button
- ✅ Security notice for users
- ✅ Alternative link text (for email clients that don't support buttons)
- ✅ Expiration notice
- ✅ Mobile-responsive design
- ✅ Footer with company information

### Customization

You can customize:
- Colors: Update the hex codes in the template
- Logo: Replace the text logo with an image URL if desired
- Footer text: Modify company information
- Expiration time: Update the "1 hour" text if your expiration differs

### Important Notes

- **DO NOT** remove `{{ .ConfirmationURL }}` - this is required for the reset link to work
- Test the email in different email clients (Gmail, Outlook, Apple Mail)
- The template uses inline styles for maximum email client compatibility
