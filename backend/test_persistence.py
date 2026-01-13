import requests
import uuid
import sys

BASE_URL = "http://0.0.0.0:8000"

def log(msg):
    with open("result.txt", "a") as f:
        f.write(str(msg) + "\n")

def test_persistence():
    try:
        # 1. Register
        email = f"test_{uuid.uuid4()}@example.com"
        password = "password123"
        log(f"Registering {email}...")
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": password,
            "name": "Test User"
        }, timeout=5)
        log(f"Register status: {res.status_code}")
        if res.status_code != 200:
            log(res.text)
            return
        
        user = res.json()["user"]
        user_id = user["id"]
        log(f"User ID: {user_id}")
        log(f"Initial Avatar: {user.get('avatar')}")

        # 2. Update Avatar
        new_avatar = "https://example.com/new_avatar.png"
        log(f"Updating avatar to {new_avatar}...")
        res = requests.put(f"{BASE_URL}/users/{user_id}", json={
            "avatar": new_avatar
        }, timeout=5)
        log(f"Update status: {res.status_code}")
        log(f"Update response: {res.json()}")

        # 3. Fetch User
        log("Fetching user from DB...")
        res = requests.get(f"{BASE_URL}/users/{user_id}", timeout=5)
        log(f"Fetch status: {res.status_code}")
        
        fetched_user = res.json()
        log(f"Fetched Avatar: {fetched_user.get('avatar')}")

        if fetched_user.get("avatar") == new_avatar:
            log("SUCCESS: Avatar persisted!")
        else:
            log("FAILURE: Avatar did not persist.")

    except Exception as e:
        log(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_persistence()
