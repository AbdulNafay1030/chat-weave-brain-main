#!/bin/bash
echo "Starting backend..." > backend_startup.log
which python >> backend_startup.log
python --version >> backend_startup.log
cd backend
python main.py >> ../backend_startup.log 2>&1 &
echo "Backend started in background" >> backend_startup.log
