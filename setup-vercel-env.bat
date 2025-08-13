@echo off
echo Setting up Vercel environment variables...

echo Adding NEXT_PUBLIC_SUPABASE_URL...
echo https://dcsshjzqyysqpzhgewtx.supabase.co | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo Adding NEXT_PUBLIC_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc3NoanpxeXlzcXB6aGdld3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NjI4NDAsImV4cCI6MjA2ODUzODg0MH0.T6XENoNnc51FheYggYd213A1sfKH9yFoZv-uV_k-C38 | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo Environment variables added successfully!
echo Now triggering a new deployment...
vercel --prod

pause
