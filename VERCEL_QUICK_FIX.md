# Quick Fix: Vercel Page Not Opening

## The Problem

Your frontend is deployed on Vercel, but:
1. **Backend is not deployed** - Vercel only hosts frontend by default
2. **API URL is `localhost:8000`** - This won't work on Vercel

## Immediate Fix

### Step 1: Deploy Backend (Choose One)

#### Option A: Render (Easiest)
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Name:** `chat-weave-backend`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `backend`
5. Environment Variables (add from your `.env`):
   ```
   OPENAI_API_KEY=your-key
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```
6. Deploy and get URL: `https://chat-weave-backend-xxxx.onrender.com`

#### Option B: Railway
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add Python service
4. Root Directory: `backend`
5. Add environment variables
6. Deploy

### Step 2: Update Vercel Environment Variable

1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (from Step 1)
4. Save
5. Go to Deployments → Redeploy latest

### Step 3: Verify

After redeploy, your Vercel URL should work!

## Why This Happens

- Vercel = Frontend hosting only
- Backend needs separate hosting (Render, Railway, Fly.io, etc.)
- Frontend needs to know where backend is (via `VITE_API_URL`)

## Alternative: Check Vercel Build Logs

If the page shows a blank screen:
1. Go to Vercel Dashboard
2. Click on your deployment
3. Check "Build Logs" for errors
4. Common issues:
   - Build failed
   - Missing environment variables
   - API connection errors
