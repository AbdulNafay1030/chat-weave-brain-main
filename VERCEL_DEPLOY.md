# Vercel Deployment Guide

## Issue: Page Not Opening

The problem is that **Vercel only deployed your frontend**. Your backend (FastAPI) needs to be deployed separately.

## Solution Options

### Option 1: Deploy Backend to Render/Railway/Fly.io (Recommended)

1. **Deploy Backend to Render:**
   - Go to https://render.com
   - Create a new **Web Service**
   - Connect your GitHub repo
   - Settings:
     - **Environment:** Docker
     - **Dockerfile Path:** `backend/Dockerfile`
     - **Docker Context:** `backend`
   - Add environment variables (from your `.env` file)
   - Get the backend URL: `https://your-backend-name.onrender.com`

2. **Update Vercel Environment Variables:**
   - Go to your Vercel project settings
   - Add environment variable:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://your-backend-name.onrender.com`
   - Redeploy your frontend

### Option 2: Use Vercel Serverless Functions (Advanced)

This requires converting your FastAPI backend to Vercel serverless functions.

### Option 3: Deploy Backend to Railway

1. Go to https://railway.app
2. Create new project from GitHub
3. Add Python service
4. Point to `backend/` directory
5. Set environment variables
6. Get the backend URL

## Quick Fix: Update API URL

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com`
   - Redeploy

2. **Or create `vercel.json` with proper config:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "env": {
       "VITE_API_URL": "https://your-backend-url.com"
     }
   }
   ```

## Current Status

- ✅ Frontend deployed to Vercel
- ❌ Backend not deployed (needs separate hosting)
- ❌ API URL pointing to `localhost:8000` (won't work)

## Next Steps

1. Deploy backend to Render/Railway/Fly.io
2. Update `VITE_API_URL` in Vercel environment variables
3. Redeploy frontend
