# Troubleshoot API Errors (Summarization & Messages)

## Issue
- Summarization fails with "failed to fetch" error
- Messages are not sending

## Most Likely Causes

### 1. VITE_API_URL Not Set Correctly in Vercel

The frontend needs `VITE_API_URL` environment variable to point to your Render backend.

**Check in Vercel:**
1. Go to https://vercel.com/dashboard
2. Click your project: `chat-weave-brain-main`
3. Go to **Settings** → **Environment Variables**
4. Check if `VITE_API_URL` exists
5. Value should be: `https://chat-weave-brain-main-vwzy.onrender.com`
6. Make sure it's set for **Production**, **Preview**, and **Development**

**Fix:**
- If missing or wrong, add/update it
- Then **redeploy** your frontend

### 2. Backend Not Running

**Check if backend is accessible:**
```bash
curl https://chat-weave-brain-main-vwzy.onrender.com/docs
```

Should return the FastAPI docs page.

**If backend is down:**
- Go to https://dashboard.render.com
- Check your backend service status
- Check logs for errors
- Restart if needed

### 3. CORS Issues

The backend should allow all origins. Check `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Browser Console Errors

**Check browser console (F12):**
1. Open https://chat-weave-brain-main.vercel.app/app
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Look for red error messages
5. Go to **Network** tab
6. Try sending a message
7. Look for failed requests (red)
8. Click on failed request to see details

**Common errors:**
- `Failed to fetch` → Network/CORS issue
- `404 Not Found` → Wrong API URL
- `500 Internal Server Error` → Backend error
- `CORS policy` → CORS misconfiguration

### 5. Environment Variable Not Applied

After setting `VITE_API_URL` in Vercel:
1. **Must redeploy** for it to take effect
2. Go to **Deployments** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**
5. Or push a new commit

### 6. Check Network Tab

In browser DevTools → Network tab:
1. Filter by "Fetch/XHR"
2. Try sending a message
3. Look for request to `/ask-ai` (summarization) or `/messages` (message sending)
4. Check:
   - Request URL (should include Render backend URL)
   - Status code (should be 200)
   - Response (should be JSON)

## Quick Test

Test your backend directly:
```bash
# Test if backend is accessible
curl https://chat-weave-brain-main-vwzy.onrender.com/docs

# Test ask-ai endpoint (will fail without auth, but should return error, not connection error)
curl -X POST https://chat-weave-brain-main-vwzy.onrender.com/ask-ai \
  -H "Content-Type: application/json" \
  -d '{"question":"test","chatContext":"test"}'
```

## Most Common Fix

**99% of the time**, the issue is:
1. `VITE_API_URL` not set in Vercel
2. Or not redeployed after setting it

**Solution:**
1. Set `VITE_API_URL=https://chat-weave-brain-main-vwzy.onrender.com` in Vercel
2. Redeploy frontend
3. Test again
