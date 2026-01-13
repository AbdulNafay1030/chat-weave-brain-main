#!/bin/bash
# Quick GitHub Upload Script

echo "🚀 Setting up GitHub repository..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Check if remote exists
if ! git remote | grep -q origin; then
    echo ""
    echo "📝 Please add your GitHub remote:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/sidechat.git"
    echo ""
    read -p "Press Enter after adding the remote..."
fi

# Remove node_modules from tracking if it was added
echo "🧹 Cleaning up tracked files..."
git rm -r --cached node_modules 2>/dev/null
git rm -r --cached backend/data 2>/dev/null
git rm -r --cached backend/uploads 2>/dev/null
git rm -r --cached dist 2>/dev/null

# Add all files (node_modules will be ignored)
echo "📦 Adding files..."
git add .

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short | head -20
echo "..."

# Commit
echo ""
read -p "Commit message (default: Initial commit): " commit_msg
commit_msg=${commit_msg:-Initial commit}
git commit -m "$commit_msg"

# Push
echo ""
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your code is on GitHub (without node_modules)"
