# Fix Supabase Authentication in Production

## Problem
Getting POST error to `https://dcsshjzqyysqpzhgewtx.supabase.co/auth/v1/token?grant_type=password` when creating accounts in production.

## Root Cause
Supabase authentication is configured for localhost only, not for your production Vercel domain.

## Solution

### Step 1: Get Your Vercel URL
After deployment completes, your URL will be shown. It typically looks like:
- `https://suni-intellekt-xyz.vercel.app` (where xyz is random characters)

### Step 2: Update Supabase Authentication Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/dcsshjzqyysqpzhgewtx
2. **Navigate to**: Authentication → URL Configuration
3. **Update these fields**:

   **Site URL:**
   ```
   https://your-vercel-url.vercel.app
   ```

   **Redirect URLs (Add all of these):**
   ```
   https://your-vercel-url.vercel.app/**
   https://your-vercel-url.vercel.app/auth/callback
   https://your-vercel-url.vercel.app/dashboard
   https://your-vercel-url.vercel.app/login
   https://your-vercel-url.vercel.app/register
   ```

### Step 3: Additional Authentication Settings

In the same Supabase Authentication section:

1. **Enable Email Confirmations** (if you want them)
2. **Configure Email Templates** (optional)
3. **Set JWT expiry** (default is fine)

### Step 4: Test Authentication

After updating the URLs:
1. Visit your Vercel URL
2. Try creating a new account
3. Try logging in
4. Authentication should work properly

## Why This Happens

- Supabase checks the origin domain for security
- Only domains listed in "Redirect URLs" are allowed
- localhost works by default, but production domains must be explicitly configured

## Current Status
- ✅ App deployed to Vercel
- ✅ Environment variables configured
- ❌ Authentication URLs need updating (this fix)
- 🔄 Once URLs are updated, authentication will work perfectly

## Quick Test
After making these changes, the POST request to Supabase auth should succeed and users can create accounts in production.
