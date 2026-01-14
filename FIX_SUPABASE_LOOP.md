# Fix Supabase Read Receipts Loop

## Problem
Supabase errors are stuck in a loop:
- `POST https://cltpxruldnzbrltadnwo.supabase.co/rest/v1/message_reads 400 (Bad Request)`
- `Error: invalid input syntax for type uuid: "user-12c81846-c109-4c49-ab98-787f5fa51e5b"`

## Root Cause
The app uses FastAPI backend, not Supabase, but the old code was trying to use Supabase for read receipts. The user IDs have a "user-" prefix which doesn't match Supabase's UUID format.

## Solution Applied
The `useReadReceipts.ts` file has been **completely disabled**. All Supabase calls have been removed:

1. ✅ `useMessageReadReceipts` - markAsRead function now just returns (no Supabase calls)
2. ✅ `useSideThreadReadReceipts` - markAsRead function now just returns (no Supabase calls)
3. ✅ All `useEffect` hooks in these functions are disabled

## Status
- **Local Code**: ✅ Fixed (Supabase calls disabled)
- **Vercel Deployment**: ❌ **NOT DEPLOYED YET** - The errors will stop once you deploy

## To Fix the Errors You're Seeing:

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Fix: Disable Supabase read receipts to stop error loop"
git push origin main
```

### Step 2: Wait for Vercel Deployment
- Vercel will automatically rebuild and deploy
- Check Vercel dashboard for deployment status
- Usually takes 1-2 minutes

### Step 3: Hard Refresh Browser
- After deployment completes, hard refresh your browser:
  - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
  - Mac: `Cmd + Shift + R`
- Or clear browser cache

## Why Errors Are Still Showing
The errors you're seeing (`index-BLkWKvhO.js:487`) are from the **old bundled JavaScript** that's still deployed on Vercel. Once you deploy the new code, these errors will stop.

## Verification
After deployment, you should see:
- ✅ No more Supabase `message_reads` POST errors
- ✅ No more UUID syntax errors
- ✅ Console will be clean (only normal app logs)

## Note
The read receipts feature is now disabled. If you want read receipts in the future, you'll need to implement them using the FastAPI backend instead of Supabase.
