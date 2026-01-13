#!/bin/bash
echo "1. Registering..."
curl -s -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"curl_user_v2@example.com", "password":"password", "name":"Curl User"}' > register.json
cat register.json
echo ""

# Extract ID (simple grep since no jq)
USER_ID=$(cat register.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "User ID: $USER_ID"

echo "2. Updating Avatar..."
curl -s -X PUT http://127.0.0.1:8000/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"avatar":"https://example.com/custom_avatar.png"}' > update.json
cat update.json
echo ""

echo "3. Fetching User..."
curl -s -X GET http://127.0.0.1:8000/users/$USER_ID > fetch.json
cat fetch.json
echo ""
