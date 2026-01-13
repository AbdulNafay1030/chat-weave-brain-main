# Fix Vercel Deployment Issues

## Issue 1: Google OAuth Error

**Error:** `origin_mismatch` - The given origin is not allowed for the given client ID.

### Fix: Add Vercel URL to Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `247700297312-dp23ut34tsnd6lclvrg1ggg89h6rn7t5`
5. Click **Edit**
6. Under **Authorized JavaScript origins**, click **Add URI**
7. Add these URLs:
   ```
   https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app
   https://chat-weave-brain-main.vercel.app
   ```
8. Under **Authorized redirect URIs**, add:
   ```
   https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app
   https://chat-weave-brain-main.vercel.app
   ```
9. Click **Save**
10. Wait 5-10 minutes for changes to propagate

## Issue 2: Supabase Environment Variables

**Error:** `Supabase environment variables are missing. Please check your .env file.`

### Fix: Add Supabase Environment Variables (if using Supabase)

If you're using Supabase, add these to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add (if you have Supabase):
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Redeploy

**Note:** Your app seems to use a custom backend (FastAPI), not Supabase. The Supabase error might be from old code. Check if you're actually using Supabase.

## Quick Checklist

- [ ] Added Vercel URL to Google OAuth authorized origins
- [ ] Added Vercel URL to Google OAuth redirect URIs  
- [ ] Added `VITE_API_URL` environment variable in Vercel
- [ ] Redeployed frontend after changes
- [ ] Waited 5-10 minutes after Google OAuth changes

## Test

After fixing:
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R)
3. Try Google sign-in again
