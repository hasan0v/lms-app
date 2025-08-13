# Vercel Deployment Guide for LMS App

## Pre-deployment Setup

### 1. Environment Variables
The following environment variables need to be configured in Vercel:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://dcsshjzqyysqpzhgewtx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc3NoanpxeXlzcXB6aGdld3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjI4NDAsImV4cCI6MjA2ODUzODg0MH0.T6XENoNnc51FheYggYd213A1sfKH9yFoZv-uV_k-C38`

**Optional Variables (get from Supabase Dashboard > Settings > API):**
- `SUPABASE_SERVICE_ROLE_KEY` = [Your service role key - needed for email functions]

### 2. Project Configuration
- Framework: Next.js
- Node.js Version: 18.x or higher
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next`

## Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd "c:\Users\alien\Desktop\AI\Kurs\lms-app"
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new one
   - Confirm framework detection (Next.js)
   - Set up environment variables when prompted

### Method 2: GitHub Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import project from GitHub
   - Configure environment variables
   - Deploy

### Method 3: Direct Upload

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag and drop the project folder
3. Configure settings and environment variables
4. Deploy

## Environment Variables Setup in Vercel

1. **In Vercel Dashboard:**
   - Go to Project Settings
   - Navigate to Environment Variables
   - Add each variable with appropriate values

2. **Variable Configuration:**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://dcsshjzqyysqpzhgewtx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
   ```

## Post-deployment Configuration

### 1. Update Supabase Site URL
In your Supabase project settings:
- Go to Authentication > Settings
- Add your Vercel domain to Site URL
- Add to Redirect URLs: `https://your-app.vercel.app/**`

### 2. CORS Configuration
Ensure Supabase allows requests from your Vercel domain.

### 3. Database URL Updates
Update any hardcoded localhost URLs in your application to use relative paths.

## Domain Configuration

### Custom Domain (Optional)
1. In Vercel Dashboard > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Supabase settings with new domain

## Troubleshooting

### Common Issues:
1. **Build Failures:** Check Node.js version compatibility
2. **Environment Variables:** Ensure all required vars are set
3. **Supabase Connection:** Verify URLs and keys
4. **Authentication:** Update Supabase redirect URLs

### Logs:
- Check Vercel Function logs for runtime errors
- Use `vercel logs` CLI command for detailed debugging

## Final Checklist

- [ ] Project builds successfully locally
- [ ] All environment variables configured
- [ ] Supabase settings updated with production URLs
- [ ] Domain configured (if using custom domain)
- [ ] Authentication redirect URLs updated
- [ ] Database migrations applied
- [ ] Storage policies configured for production

## Security Notes

- Never commit `.env.local` to git
- Use Vercel's environment variable system
- Rotate API keys if needed
- Configure proper CORS settings
- Enable Supabase RLS policies for production data

## Performance Optimization

- Images are optimized via Next.js Image component
- Static assets are served via Vercel CDN
- API routes are automatically serverless functions
- Database queries use connection pooling via Supabase
