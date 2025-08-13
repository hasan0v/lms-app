# Vercel Environment Variables Setup

## After Deployment Completes

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project** (likely named "suni-intellekt")
3. **Click on the project** → **Settings** → **Environment Variables**

## Add These Variables

### Variable 1: Supabase URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://dcsshjzqyysqpzhgewtx.supabase.co`
- **Environment**: All (Production, Preview, Development)

### Variable 2: Supabase Anonymous Key
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc3NoanpxeXlzcXB6aGdld3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjI4NDAsImV4cCI6MjA2ODUzODg0MH0.T6XENoNnc51FheYggYd213A1sfKH9yFoZv-uV_k-C38`
- **Environment**: All (Production, Preview, Development)

### Variable 3: Service Role Key (Optional - for email features)
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: [Get from Supabase Dashboard → Settings → API → service_role key]
- **Environment**: All (Production, Preview, Development)

## After Adding Variables

1. **Redeploy**: Run `vercel --prod` again or trigger a new deployment in the dashboard
2. **Update Supabase**: Go to [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration
   - **Site URL**: Your Vercel URL (e.g., `https://suni-intellekt-xyz.vercel.app`)
   - **Redirect URLs**: Your Vercel URL with wildcard (e.g., `https://suni-intellekt-xyz.vercel.app/**`)

## Test the Application

Once configured, your LMS app will be fully functional with:
- ✅ User authentication
- ✅ Live chat system
- ✅ Course management
- ✅ Task submissions
- ✅ User profiles
- ✅ Admin functions

## Troubleshooting

If you see "Authentication service not configured" errors:
1. Check that environment variables are set correctly
2. Make sure you redeployed after adding them
3. Verify the Supabase URL and key are correct
