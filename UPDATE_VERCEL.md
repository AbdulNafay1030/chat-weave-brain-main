# Update Vercel Frontend to Use Render Backend

## Your Backend URL
✅ Backend is running at: `https://chat-weave-brain-main-vwzy.onrender.com`

## Step 1: Update Vercel Environment Variable

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on your project: `chat-weave-brain-main`
3. Go to **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://chat-weave-brain-main-vwzy.onrender.com`
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
7. Click **Save**

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://chat-weave-brain-main-vwzy.onrender.com

vercel env add VITE_API_URL preview
# Enter: https://chat-weave-brain-main-vwzy.onrender.com

vercel env add VITE_API_URL development
# Enter: https://chat-weave-brain-main-vwzy.onrender.com
```

## Step 2: Redeploy Frontend

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Find your latest deployment
5. Click the **"..."** menu (three dots)
6. Click **"Redeploy"**
7. Confirm redeployment

**OR** push a new commit to trigger automatic redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy with new API URL"
git push
```

## Step 3: Verify

1. Open your Vercel URL: `https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app`
2. Open browser console (F12)
3. Check Network tab - API calls should go to `chat-weave-brain-main-vwzy.onrender.com`
4. Try logging in or using the app

## Troubleshooting

### Still showing localhost?
- Make sure you redeployed after adding the environment variable
- Check Vercel build logs to see if `VITE_API_URL` is being used
- Clear browser cache and hard refresh (Cmd+Shift+R)

### CORS Errors?
- Backend CORS is already configured for `*`
- Should work automatically

### API Connection Failed?
- Check if backend is running: https://chat-weave-brain-main-vwzy.onrender.com/docs
- Should show FastAPI documentation page
- Check Render logs if backend is down

## Quick Test

Test your backend directly:
```bash
curl https://chat-weave-brain-main-vwzy.onrender.com/docs
```

Should return HTML for the API documentation page.
