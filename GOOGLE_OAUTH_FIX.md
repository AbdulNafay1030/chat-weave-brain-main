# Fix Google OAuth Error on Vercel

## Error Message
```
Error 400: origin_mismatch
The given origin is not allowed for the given client ID.
```

## Your Vercel URL
`https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app`

## Fix: Add URL to Google Cloud Console

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com
2. Sign in with your Google account
3. Select your project (or create one if needed)

### Step 2: Find Your OAuth Client
1. Go to **APIs & Services** → **Credentials**
2. Look for OAuth 2.0 Client ID: `247700297312-dp23ut34tsnd6lclvrg1ggg89h6rn7t5`
3. Click on it to edit

### Step 3: Add Authorized JavaScript Origins
1. Scroll to **Authorized JavaScript origins**
2. Click **+ ADD URI**
3. Add your Vercel URL:
   ```
   https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app
   ```
4. Also add your custom domain if you have one:
   ```
   https://chat-weave-brain-main.vercel.app
   ```

### Step 4: Add Authorized Redirect URIs
1. Scroll to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Add the same URLs:
   ```
   https://chat-weave-brain-main-35yzkw4hu-abdulnafay1030s-projects.vercel.app
   https://chat-weave-brain-main.vercel.app
   ```

### Step 5: Save
1. Click **SAVE** (bottom of page)
2. Wait 5-10 minutes for changes to propagate

### Step 6: Test
1. Go back to your Vercel URL
2. Clear browser cache
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Try Google sign-in again

## Additional Notes

- Changes can take 5-10 minutes to take effect
- Make sure you're using the correct OAuth Client ID
- The URL must match exactly (including https://)
- No trailing slashes

## For Production Domain

When you add a custom domain to Vercel, add it to Google OAuth as well:
- Add both the Vercel URL and custom domain
- Example: `https://yourdomain.com`
