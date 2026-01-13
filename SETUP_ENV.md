
# Environment Variables Setup

## Important: Move Your API Keys to .env File

Your API keys are currently hardcoded in `backend/main.py`. For security, you need to move them to a `.env` file.

## Step 1: Create .env File

1. Go to the `backend/` directory
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your actual API keys:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   
   RESEND_API_KEY=your-resend-api-key-here
   
   # Add your SMTP credentials if using email
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

## Step 2: Verify .env is in .gitignore

The `.env` file is already in `.gitignore`, so it won't be committed to Git.

## Step 3: Restart Backend

After creating the `.env` file, restart your backend server:
```bash
# Stop the current backend
# Then start it again
cd backend
python main.py
# or
uvicorn main:app --reload
```

## Security Notes

- ✅ `.env` files are already in `.gitignore`
- ✅ Never commit `.env` files to Git
- ✅ The backend now reads from environment variables
- ✅ Hardcoded keys in `main.py` have been removed

## Troubleshooting

If you get "OpenAI API key not configured" error:
1. Make sure `.env` file exists in `backend/` directory
2. Make sure `OPENAI_API_KEY` is set in the `.env` file
3. Restart the backend server
