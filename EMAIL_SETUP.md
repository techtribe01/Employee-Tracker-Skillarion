# Email Configuration for Password Reset

## Problem
The "Forgot Password" feature requires Supabase email configuration. By default, Supabase doesn't send emails unless you set up an email provider.

## Solution: Enable Email in Supabase

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Select your project: **Employee-Tracker-Skillarion**
3. Go to **Settings** → **Authentication** → **Email**

### Step 2: Configure Email Provider (Choose One)

#### Option A: Use Supabase's Built-in Email (Recommended for Testing)
1. Under "Email provider", select **Supabase**
2. Enable "Email Confirmations"
3. Enable "Enable email change"
4. Save changes

#### Option B: Use Custom SMTP (Production)
1. Select **Custom SMTP**
2. Enter your email service details:
   - **Host**: Your SMTP server (e.g., smtp.gmail.com)
   - **Port**: 587 (TLS) or 465 (SSL)
   - **Username**: Your email
   - **Password**: App-specific password
   - **From Email**: noreply@skillariondevelopment.in
3. Save changes

#### Option C: Use SendGrid
1. Select **SendGrid**
2. Enter your SendGrid API Key
3. Click "Test configuration"
4. Save changes

### Step 3: Customize Email Templates
1. In Supabase Dashboard, go to **Auth** → **Email Templates**
2. Customize the "Reset Password" template with your branding
3. The email will include a reset link that redirects to `/auth/callback`

### Step 4: Test Password Reset
1. Visit http://localhost:3000/forgot-password (or your deployment URL)
2. Enter a registered user's email
3. Check the inbox for the password reset email
4. Click the link to reset password

## Troubleshooting

### "Invalid password reset token"
- The token has expired (valid for 24 hours)
- Request a new password reset email

### Email not arriving
- Check spam/junk folder
- Verify email address exists in the system
- Ensure SMTP credentials are correct (if using custom)

### "Email provider not configured"
- You need to complete Step 2 above
- Check that email provider is enabled in Supabase settings

## Development Tip
For local development without setting up SMTP, you can:
1. Use Supabase's built-in email service
2. Check Supabase logs to see the reset link
3. Manually construct the link: `http://localhost:3000/auth/callback?token=YOUR_TOKEN&type=recovery`

## For Production
Always use a reliable email service provider like SendGrid, Mailgun, or AWS SES to ensure deliverability.
