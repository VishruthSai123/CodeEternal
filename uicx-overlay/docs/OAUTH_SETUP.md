# OAuth Setup Guide for Code Eternal

This guide will help you set up Google and GitHub authentication for Code Eternal.

## Prerequisites
- A Supabase project (you should already have this)
- Google Cloud Console account (for Google OAuth)
- GitHub account (for GitHub OAuth)

---

## Step 1: Run the Database Migration

First, run the OAuth migration in Supabase to update your database schema:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **New query**
5. Copy and paste the contents of `supabase/migrations/010_oauth_setup.sql`
6. Click **Run** to execute the migration

This adds OAuth-specific columns to the profiles table and updates the triggers to handle OAuth users.

---

## Step 2: Configure Supabase Auth Settings

### 2.1 Site URL Configuration

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set the following:
   - **Site URL**: `https://codeeternal.vercel.app`
   - **Redirect URLs** (add all of these):
     ```
     https://codeeternal.vercel.app
     https://codeeternal.vercel.app/auth/callback
     https://codeeternal.vercel.app/**
     http://localhost:5173
     http://localhost:5173/auth/callback
     ```

---

## Step 3: Set Up Google OAuth

### 3.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - **App name**: Code Eternal
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

6. Create OAuth Client ID:
   - **Application type**: Web application
   - **Name**: Code Eternal Web
   - **Authorized JavaScript origins**:
     ```
     https://codeeternal.vercel.app
     http://localhost:5173
     ```
   - **Authorized redirect URIs**:
     ```
     https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     (Replace `<YOUR-SUPABASE-PROJECT-REF>` with your actual Supabase project reference)

7. Click **Create** and save your:
   - **Client ID**
   - **Client Secret**

### 3.2 Enable Google in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. Enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click **Save**

---

## Step 4: Set Up GitHub OAuth

### 4.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: Code Eternal
   - **Homepage URL**: `https://codeeternal.vercel.app`
   - **Authorization callback URL**: 
     ```
     https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     (Replace `<YOUR-SUPABASE-PROJECT-REF>` with your actual Supabase project reference)

4. Click **Register application**
5. On the next page:
   - Copy the **Client ID**
   - Click **Generate a new client secret** and copy it

### 4.2 Enable GitHub in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Toggle **Enable Sign in with GitHub**
4. Enter:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
5. Click **Save**

---

## Step 5: Find Your Supabase Callback URL

Your Supabase callback URL is in this format:
```
https://<PROJECT-REF>.supabase.co/auth/v1/callback
```

To find your PROJECT-REF:
1. Go to Supabase Dashboard → **Settings** → **General**
2. Look for **Reference ID** - this is your PROJECT-REF

Example: If your Reference ID is `abcdefghijklmnop`, your callback URL is:
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

---

## Step 6: Test the Integration

### Web App Testing
1. Go to https://codeeternal.vercel.app
2. Click "Google" or "GitHub" button on the login page
3. Complete the OAuth flow in the popup
4. You should be redirected back and logged in

### Desktop App Testing
1. Open the Code Eternal desktop app
2. Click "Google" or "GitHub" button
3. Your default browser will open for authentication
4. Complete the login in the browser
5. Return to the desktop app - it will detect your session automatically

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the callback URL in Google/GitHub matches exactly:
  `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
- Check for trailing slashes

### "invalid_client" Error
- Verify your Client ID and Client Secret are correct
- Make sure you're using the right credentials (not mixing up Google/GitHub)

### User Not Created in Database
- Check that the `010_oauth_setup.sql` migration was run
- Verify the trigger `on_auth_user_created` exists in Supabase

### Session Not Persisting
- Clear browser cache and try again
- Check browser console for errors
- Verify Supabase URL and Anon Key are set correctly in Vercel env vars

---

## Security Notes

1. **Never expose your Client Secrets** - they should only be in Supabase settings
2. **Keep redirect URLs specific** - don't use wildcards in production OAuth apps
3. **Use HTTPS** - OAuth only works on HTTPS in production

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Site URL | `https://codeeternal.vercel.app` |
| Redirect URLs | `https://codeeternal.vercel.app/**` |
| Google Callback | `https://<PROJECT-REF>.supabase.co/auth/v1/callback` |
| GitHub Callback | `https://<PROJECT-REF>.supabase.co/auth/v1/callback` |

---

## Need Help?

If you're still having issues:
1. Check Supabase logs: **Dashboard** → **Logs** → **Auth Logs**
2. Check browser console for JavaScript errors
3. Verify all environment variables are set in Vercel
