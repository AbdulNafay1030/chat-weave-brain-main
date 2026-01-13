# GitHub Repository Setup Guide

## Quick Setup (Recommended)

### Step 1: Initialize Git (if not already done)
```bash
cd /Users/abdulnafay/Downloads/chat-weave-brain-main
git init
```

### Step 2: Add Your GitHub Remote
```bash
# Replace with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/sidechat.git
```

### Step 3: Verify .gitignore
Make sure these are in `.gitignore`:
- `node_modules/` ✅ (already there)
- `.env` ✅ (already there)
- `dist/` ✅ (already there)
- `backend/data/` (database files)
- `backend/uploads/` (uploaded files)

### Step 4: Add and Commit Files
```bash
# Add all files (node_modules will be ignored)
git add .

# Commit
git commit -m "Initial commit: Chat Weave Brain application"

# Push to GitHub
git branch -M main
git push -u origin main
```

## What Gets Uploaded

✅ **Will be uploaded:**
- Source code (`src/`, `backend/`)
- Configuration files (`package.json`, `requirements.txt`)
- Documentation
- `.env.example` (template, safe to commit)

❌ **Will NOT be uploaded (ignored):**
- `node_modules/` (dependencies - too large)
- `.env` files (contains secrets)
- `dist/` (build output)
- `backend/data/` (database)
- `backend/uploads/` (user uploads)

## If node_modules is Still Being Uploaded

If Git is trying to upload node_modules:

1. **Remove from Git cache:**
   ```bash
   git rm -r --cached node_modules
   git rm -r --cached backend/data
   git rm -r --cached backend/uploads
   ```

2. **Verify .gitignore:**
   ```bash
   cat .gitignore | grep node_modules
   ```

3. **Add and commit again:**
   ```bash
   git add .
   git commit -m "Remove node_modules and data files from tracking"
   git push
   ```

## Recommended .gitignore Additions

Add these to `.gitignore` if not already there:
```
# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist/
build/
.venv/
venv/
ENV/

# Database
*.db
*.sqlite
*.sqlite3
backend/data/
backend/uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo
```

## After Pushing to GitHub

### For Others to Clone and Run:
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/sidechat.git
cd sidechat

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys

# Run backend
uvicorn main:app --reload

# Run frontend (in another terminal)
npm run dev
```

## Troubleshooting

### "Repository not found" error
- Check your GitHub username and repo name
- Make sure the repo exists on GitHub
- Verify you have push access

### "Large files" warning
- Make sure `node_modules` is in `.gitignore`
- Use `git rm -r --cached node_modules` if already tracked

### Slow upload
- Only source code should be uploaded (not node_modules)
- If still slow, check file size: `du -sh .`
- Should be < 50MB without node_modules
