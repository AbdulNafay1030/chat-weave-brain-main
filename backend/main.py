from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import uuid
import os
import sqlite3
import json
from datetime import datetime
import tensorflow as tf
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
import re
from duckduckgo_search import DDGS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
DB_PATH = os.getenv("DB_PATH", "chat.db")

# Get OpenAI API key from environment variable (required)
api_key = os.getenv("OPENAI_API_KEY", "")
if not api_key:
    print("WARNING: OPENAI_API_KEY not set in environment variables")
    print("Please set OPENAI_API_KEY in your .env file")
else:
    print(f"INFO: OPENAI_API_KEY loaded from environment (starts with {api_key[:8]}...)")

if api_key:
    client = OpenAI(api_key=api_key)
else:
    client = None
    print("ERROR: OpenAI client not initialized - OPENAI_API_KEY is required")

# Resend API Key for email sending (optional)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
if RESEND_API_KEY:
    print(f"INFO: Resend API Key configured (starts with {RESEND_API_KEY[:8]}...)")
else:
    print("WARNING: Resend API Key not set - emails will not be sent")

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Database Setup ---

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        avatar TEXT,
        status TEXT
    )
    ''')

    # Migration: Add password column if not exists
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN password TEXT")
    except sqlite3.OperationalError:
        pass # Column likely already exists
    
    # Groups
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TEXT,
        owner_id TEXT,
        type TEXT DEFAULT 'group'
    )
    ''')

    # Migration: Add type column if not exists
    try:
        cursor.execute("ALTER TABLE groups ADD COLUMN type TEXT DEFAULT 'group'")
    except sqlite3.OperationalError:
        pass # Column likely already exists
    
    # Group Members (Many-to-Many)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT,
        user_id TEXT,
        PRIMARY KEY (group_id, user_id)
    )
    ''')
    
    # Messages
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        user_id TEXT,
        content TEXT,
        created_at TEXT,
        is_ai BOOLEAN,
        thread_id TEXT,
        is_pinned BOOLEAN DEFAULT 0,
        reply_to_id TEXT,
        file_url TEXT,
        file_name TEXT,
        file_type TEXT,
        file_size INTEGER
    )
    ''')

    # Threads
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        name TEXT,
        created_by TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT
    )
    ''')

    # Invitations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        token TEXT UNIQUE,
        created_by TEXT,
        created_at TEXT,
        expires_at TEXT
    )
    ''')

    # Message Reactions
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS message_reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT,
        user_id TEXT,
        emoji TEXT,
        created_at TEXT,
        UNIQUE(message_id, user_id, emoji)
    )
    ''')

    # Seed Initial Data if empty
    cursor.execute("SELECT count(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Seeding initial data...")
        # Users (id, name, email, avatar, status, password)
        cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", 
                       ("user-1", "You", "you@example.com", None, "online", None))
        cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", 
                       ("ai-agent", "ChatGPT", "ai@sidechat.com", None, "online", None))
        
        # Group (id, name, created_at, owner_id, type)
        group_id = "group-1"
        cursor.execute("INSERT INTO groups VALUES (?, ?, ?, ?, ?)", 
                       (group_id, "General", datetime.now().isoformat(), "user-1", "group"))
        
        # Members
        cursor.execute("INSERT INTO group_members VALUES (?, ?)", (group_id, "user-1"))
        cursor.execute("INSERT INTO group_members VALUES (?, ?)", (group_id, "ai-agent"))
        
        conn.commit()

    conn.close()

init_db()

# --- Data Models (Pydantic) ---

class User(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    status: str = "online"

class Message(BaseModel):
    id: str
    group_id: Optional[str] = None
    user_id: str
    content: str
    created_at: str
    is_ai: bool = False
    thread_id: Optional[str] = None
    is_pinned: bool = False
    reply_to_id: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class Group(BaseModel):
    id: str
    name: str
    created_at: str
    owner_id: str
    owner_id: str
    type: Optional[str] = "group"
    members: List[User] = []

class Thread(BaseModel):
    id: str
    group_id: str
    name: str
    created_by: str
    is_active: bool
    created_at: str

class AskAIRequest(BaseModel):
    question: str
    chatContext: Optional[str] = ""

class AcceptInviteRequest(BaseModel):
    token: str
    user_id: str

class CreateDMRequest(BaseModel):
    user1_id: str
    user2_id: str

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

# --- Helper Functions ---

def row_to_dict(row):
    return dict(row)

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Chat Weave Brain Backend (SQLite) is running."}

@app.get("/groups", response_model=List[Group])
def get_groups(user_id: str = Query(..., description="The ID of the current user")):
    conn = get_db()
    cursor = conn.cursor()
    # Filter groups where user is owner OR member
    cursor.execute("""
        SELECT DISTINCT g.* FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    """, (user_id,))
    groups_data = cursor.fetchall()
    
    result = []
    for g_row in groups_data:
        g = row_to_dict(g_row)
        # Fetch members for this group
        cursor.execute("""
            SELECT u.* FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        """, (g['id'],))
        members = [row_to_dict(m) for m in cursor.fetchall()]
        
        result.append({
            "id": g['id'],
            "name": g['name'],
            "created_at": g['created_at'],
            "owner_id": g['owner_id'],
            "type": g['type'] if 'type' in g else 'group',
            "members": members
        })
    conn.close()
    return result

@app.post("/groups")
def create_group(name: str = Form(...), user_id: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute("INSERT INTO groups VALUES (?, ?, ?, ?, ?)", (new_id, name, created_at, user_id, "group"))
    cursor.execute("INSERT INTO group_members VALUES (?, ?)", (new_id, user_id))
    # Also add AI agent to every group for now
    cursor.execute("INSERT INTO group_members VALUES (?, ?)", (new_id, "ai-agent"))
    
    # System Message for Group Creation
    msg_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (msg_id, new_id, user_id, f"created the group \"{name}\"", created_at, False, None, False, None, None, None, None, None)
    )
    
    conn.commit()
    
    # Return full group object
    group = {
        "id": new_id,
        "name": name,
        "created_at": created_at,
        "owner_id": user_id,
        "members": []
    }
    conn.close()
    return group

@app.post("/dms")
def create_dm(data: CreateDMRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check for existing DM
    query = """
        SELECT g.* 
        FROM groups g
        JOIN group_members gm1 ON g.id = gm1.group_id
        JOIN group_members gm2 ON g.id = gm2.group_id
        WHERE gm1.user_id = ? AND gm2.user_id = ?
        AND (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) = 2
    """
    cursor.execute(query, (data.user1_id, data.user2_id))
    existing_group = cursor.fetchone()
    
    if existing_group:
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.avatar, u.status 
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        """, (existing_group['id'],))
        members = cursor.fetchall()
        
        group = dict(existing_group)
        group['members'] = [dict(m) for m in members]
        conn.close()
        return group

    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    # Create new DM Group
    # Note: Backend stores name as "Private Chat", frontend can rename for display if needed
    cursor.execute("INSERT INTO groups (id, name, created_at, owner_id, type) VALUES (?, ?, ?, ?, ?)",
                   (new_id, "Private Chat", created_at, data.user1_id, "dm"))

    cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
                   (new_id, data.user1_id))
    cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
                   (new_id, data.user2_id))
                   
    conn.commit()
    
    cursor.execute("SELECT * FROM groups WHERE id = ?", (new_id,))
    new_group = cursor.fetchone()
    
    cursor.execute("""
        SELECT u.id, u.name, u.email, u.avatar, u.status 
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
    """, (new_id,))
    members = cursor.fetchall()
        
    group = dict(new_group)
    group['members'] = [dict(m) for m in members]
    conn.close()
    return group

@app.post("/users")
def sync_user(user: User):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user.id,))
    existing = cursor.fetchone()
    
    if not existing:
        cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", 
                       (user.id, user.name, user.email, user.avatar, user.status))
        conn.commit()
    
    # Always return what's in the DB
    cursor.execute("SELECT * FROM users WHERE id = ?", (user.id,))
    row = cursor.fetchone()
    conn.close()
    return row_to_dict(row)



# --- Auth Models ---
class AuthRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = "User"

class AuthLogin(BaseModel):
    email: str
    password: str

class GoogleAuth(BaseModel):
    token: Optional[str] = None
    email: str
    name: str
    avatar: Optional[str] = None
    google_id: str
    mode: str = "login"

# --- Auth Endpoints ---
@app.post("/auth/register")
def register(data: AuthRegister):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check existing
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Account already exists. Please login.")
    
    new_id = f"user-{uuid.uuid4()}"
    avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.email}"
    
    cursor.execute("INSERT INTO users (id, name, email, avatar, status, password) VALUES (?, ?, ?, ?, ?, ?)", 
                   (new_id, data.name, data.email, avatar, "online", data.password))
    conn.commit()
    
    # Return User
    cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (new_id,))
    user = row_to_dict(cursor.fetchone())
    # Ensure avatar is included (even if None)
    if "avatar" not in user:
        user["avatar"] = None
    conn.close()
    return {"user": user, "token": "mock-jwt-token"}

@app.post("/auth/login")
def login(data: AuthLogin):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="User not found. Please sign up.")
    
    user = row_to_dict(row)
    if user.get("password") != data.password:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid credentials.")
    
    # Remove password from response
    user.pop("password", None)
    
    # Ensure avatar is included (even if None) - explicitly select avatar
    if "avatar" not in user or user.get("avatar") is None:
        # Re-fetch to ensure we have avatar field
        cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE email = ?", (data.email,))
        user_row = cursor.fetchone()
        if user_row:
            user = row_to_dict(user_row)
    
    conn.close()
    return {"user": user, "token": "mock-jwt-token"}

@app.post("/auth/google")
def google_auth(data: GoogleAuth):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check by email
    cursor.execute("SELECT * FROM users WHERE email = ?", (data.email,))
    row = cursor.fetchone()
    
    if data.mode == 'signup':
        if row:
            conn.close()
            raise HTTPException(status_code=400, detail="Account already exists. Please login.")
        
        # Create
        new_id = f"user-{uuid.uuid4()}"
        cursor.execute("INSERT INTO users (id, name, email, avatar, status) VALUES (?, ?, ?, ?, ?)", 
                       (new_id, data.name, data.email, data.avatar, "online"))
        conn.commit()
        
        cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (new_id,))
        user = row_to_dict(cursor.fetchone())
        # Ensure avatar is included (even if None)
        if "avatar" not in user:
            user["avatar"] = None
        conn.close()
        return {"user": user, "token": "mock-google-token"}

    elif data.mode == 'login':
        if not row:
            conn.close()
            raise HTTPException(status_code=400, detail="User not found. Please sign up.")
        
        # Explicitly select avatar to ensure it's included
        cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE email = ?", (data.email,))
        user_row = cursor.fetchone()
        user = row_to_dict(user_row)
        
        # Don't overwrite existing avatar with Google's if user already has one
        if user.get("avatar") and data.avatar:
            # Keep existing avatar, don't overwrite
            pass
        elif not user.get("avatar") and data.avatar:
            # Only set Google avatar if user doesn't have one
            cursor.execute("UPDATE users SET avatar = ? WHERE id = ?", (data.avatar, user["id"]))
            conn.commit()
            # Re-fetch to get updated avatar
            cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (user["id"],))
            user = row_to_dict(cursor.fetchone())
        
        conn.close()
        return {"user": user, "token": "mock-google-token"}
    
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid auth mode")

@app.post("/auth/forgot-password")
def forgot_password(email: str = Form(...)):
    # Mock sending email
    print(f"PASSWORD RESET LINK SENT TO: {email}")
    return {"status": "success", "message": "Reset link sent (check console)"}
@app.get("/messages")
def get_messages(group_id: Optional[str] = None, thread_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM messages WHERE 1=1"
    params = []
    
    if group_id:
        query += " AND group_id = ?"
        params.append(group_id)
    if thread_id:
        query += " AND thread_id = ?"
        params.append(thread_id)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    messages = []
    for r in rows:
        msg = row_to_dict(r)
        # Convert 1/0 to bool
        msg['is_ai'] = bool(msg.get('is_ai', False))
        msg['is_pinned'] = bool(msg.get('is_pinned', False))
        messages.append(msg)
        
    conn.close()
    return messages

@app.post("/messages")
def send_message(
    content: str = Form(...),
    group_id: Optional[str] = Form(None),
    user_id: str = Form(...),
    is_ai: bool = Form(False),
    reply_to_id: Optional[str] = Form(None),
    thread_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    file_url = None
    file_name = None
    file_type = None
    file_size = None

    if file:
        file_name = file.filename
        file_path = f"uploads/{uuid.uuid4()}_{file_name}"
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        file_url = f"http://localhost:8000/{file_path}"
        file_type = file.content_type
        file_size = os.path.getsize(file_path)

    conn = get_db()
    cursor = conn.cursor()
    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (new_id, group_id, user_id, content, created_at, is_ai, thread_id, False, reply_to_id, file_url, file_name, file_type, file_size)
    )
    conn.commit()
    
    # Return full message object
    msg = {
        "id": new_id,
        "group_id": group_id,
        "user_id": user_id,
        "content": content,
        "created_at": created_at,
        "is_ai": is_ai,
        "thread_id": thread_id,
        "is_pinned": False,
        "reply_to_id": reply_to_id,
        "file_url": file_url,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size
    }
    conn.close()
    return msg

@app.delete("/groups/{group_id}")
def delete_group(group_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM groups WHERE id = ?", (group_id,))
    cursor.execute("DELETE FROM group_members WHERE group_id = ?", (group_id,))
    cursor.execute("DELETE FROM messages WHERE group_id = ?", (group_id,))
    cursor.execute("DELETE FROM threads WHERE group_id = ?", (group_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "id": group_id}

@app.delete("/messages/{message_id}")
def delete_message(message_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE id = ?", (message_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "id": message_id}

@app.delete("/threads/{thread_id}")
def delete_thread(thread_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM threads WHERE id = ?", (thread_id,))
    cursor.execute("DELETE FROM messages WHERE thread_id = ?", (thread_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "id": thread_id}

@app.put("/groups/{group_id}/name")
def rename_group(group_id: str, name: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE groups SET name = ? WHERE id = ?", (name, group_id))
    conn.commit()
    conn.close()
    return {"status": "success", "id": group_id, "name": name}

@app.put("/threads/{thread_id}/name")
def rename_thread(thread_id: str, name: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE threads SET name = ? WHERE id = ?", (name, thread_id))
    conn.commit()
    conn.close()
    return {"status": "success", "id": thread_id, "name": name}

@app.put("/messages/{message_id}/pin")
def toggle_pin_message(message_id: str):
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current pin status
    cursor.execute("SELECT is_pinned FROM messages WHERE id = ?", (message_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Message not found")
    
    current_pin = bool(row['is_pinned'])
    new_pin = not current_pin
    
    # Update pin status
    cursor.execute("UPDATE messages SET is_pinned = ? WHERE id = ?", (1 if new_pin else 0, message_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "id": message_id, "is_pinned": new_pin}

@app.get("/messages/{message_id}/reactions")
def get_message_reactions(message_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM message_reactions WHERE message_id = ?", (message_id,))
    rows = cursor.fetchall()
    reactions = [row_to_dict(r) for r in rows]
    conn.close()
    return reactions

@app.get("/reactions")
def get_reactions(message_ids: str = Query(..., description="Comma-separated message IDs")):
    conn = get_db()
    cursor = conn.cursor()
    ids = [id.strip() for id in message_ids.split(',') if id.strip()]
    if not ids:
        conn.close()
        return []
    
    placeholders = ','.join(['?'] * len(ids))
    cursor.execute(f"SELECT * FROM message_reactions WHERE message_id IN ({placeholders})", ids)
    rows = cursor.fetchall()
    reactions = [row_to_dict(r) for r in rows]
    conn.close()
    return reactions

@app.post("/messages/{message_id}/reactions")
def add_reaction(message_id: str, user_id: str = Form(...), emoji: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if reaction already exists
    cursor.execute(
        "SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?",
        (message_id, user_id, emoji)
    )
    existing = cursor.fetchone()
    
    if existing:
        conn.close()
        return {"status": "exists", "id": existing['id']}
    
    # Add reaction
    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO message_reactions (id, message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?, ?)",
        (new_id, message_id, user_id, emoji, created_at)
    )
    conn.commit()
    conn.close()
    
    return {"status": "success", "id": new_id}

@app.delete("/messages/{message_id}/reactions")
def remove_reaction(message_id: str, user_id: str = Query(...), emoji: str = Query(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?",
        (message_id, user_id, emoji)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/users/{user_id}")
def get_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user = row_to_dict(row)
    # Ensure avatar is always included (even if None)
    if "avatar" not in user:
        user["avatar"] = None
    
    conn.close()
    return user

@app.post("/users/{user_id}/avatar")
def upload_avatar(user_id: str, file: UploadFile = File(...)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        conn.close()
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 2MB)
    file_content = file.file.read()
    if len(file_content) > 2 * 1024 * 1024:
        conn.close()
        raise HTTPException(status_code=400, detail="File size must be less than 2MB")
    
    # Save file
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    file_name = f"avatar_{user_id}_{uuid.uuid4()}.{file_ext}"
    file_path = f"uploads/avatars/{file_name}"
    
    # Create avatars directory if it doesn't exist
    os.makedirs("uploads/avatars", exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Generate URL
    avatar_url = f"http://localhost:8000/{file_path}"
    
    # Update user avatar in database
    cursor.execute("UPDATE users SET avatar = ? WHERE id = ?", (avatar_url, user_id))
    conn.commit()
    
    # Get updated user
    cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (user_id,))
    updated_user = row_to_dict(cursor.fetchone())
    conn.close()
    
    return {"url": avatar_url, "user": updated_user}

@app.put("/users/{user_id}")
def update_user(user_id: str, data: UpdateUserRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if data.name is not None:
        updates.append("name = ?")
        params.append(data.name)
    
    if data.avatar is not None:
        updates.append("avatar = ?")
        params.append(data.avatar)
        
    if not updates:
        conn.close()
        return {"status": "no changes"}
        
    params.append(user_id)
    query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
    
    cursor.execute(query, params)
    conn.commit()
    
    # Return updated user
    cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE id = ?", (user_id,))
    updated_user = row_to_dict(cursor.fetchone())
    conn.close()
    
    return {"status": "success", "id": user_id, "user": updated_user, "updates": data.dict(exclude_unset=True)}

@app.get("/users")
def get_users(query: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if query:
        cursor.execute("SELECT id, name, email, avatar, status FROM users WHERE name LIKE ? OR email LIKE ?", (f"%{query}%", f"%{query}%"))
    else:
        cursor.execute("SELECT id, name, email, avatar, status FROM users")
    
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.post("/groups/{group_id}/invitations")
def create_invitation(group_id: str, user_id: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    
    token = str(uuid.uuid4())
    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute("INSERT INTO invitations VALUES (?, ?, ?, ?, ?, ?)", 
                   (new_id, group_id, token, user_id, created_at, None))
    conn.commit()
    conn.close()
    
    return {"token": token, "link": f"/invite/{token}"}

class SendEmailRequest(BaseModel):
    emails: List[str]
    subject: str
    body: str
    invite_link: str

class EmailTestRequest(BaseModel):
    to_email: str
    subject: Optional[str] = "Sidechat SMTP Test"
    body: Optional[str] = "This is a test email from Sidechat."

@app.get("/email-config")
def email_config_status():
    """
    Returns which email provider is configured (no secrets).
    Useful for verifying Render env vars after deploy.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    resend_api_key = os.getenv("RESEND_API_KEY", RESEND_API_KEY)
    resend_from_email = os.getenv("RESEND_FROM_EMAIL", "Onboarding <onboarding@resend.dev>")

    use_smtp = bool(smtp_server and smtp_user and smtp_password)
    use_resend = bool(resend_api_key and resend_api_key != "")

    provider = "smtp" if use_smtp else ("resend" if use_resend else "none")

    return {
        "provider": provider,
        "smtp": {
            "configured": use_smtp,
            "server": smtp_server,
            "port": smtp_port,
            "user_set": bool(smtp_user),
            "from_email": smtp_from_email,
        },
        "resend": {
            "configured": use_resend,
            "from_email": resend_from_email,
        },
    }

@app.post("/email-test")
def send_test_email(data: EmailTestRequest):
    """
    Sends a test email to verify SMTP/Resend configuration.
    Returns provider and detailed status (no secrets).
    """
    # SMTP Configuration
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    # Resend API Configuration (fallback)
    resend_api_key = os.getenv("RESEND_API_KEY", RESEND_API_KEY)

    use_smtp = smtp_server and smtp_user and smtp_password
    use_resend = resend_api_key and resend_api_key != ""

    if not use_smtp and not use_resend:
        return {
            "provider": "none",
            "status": "error",
            "error": "No email service configured. Set SMTP credentials or RESEND_API_KEY.",
        }

    if use_smtp:
        # SMTP send
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_from_email
        msg['To'] = data.to_email
        msg['Subject'] = data.subject or "Sidechat SMTP Test"

        text_part = MIMEText(data.body or "This is a test email from Sidechat.", 'plain')
        html_part = MIMEText(f"<p>{(data.body or 'This is a test email from Sidechat.').replace(chr(10), '<br>')}</p>", 'html')
        msg.attach(text_part)
        msg.attach(html_part)

        try:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            return {
                "provider": "smtp",
                "status": "success",
                "to": data.to_email,
                "from": smtp_from_email,
            }
        except smtplib.SMTPAuthenticationError as e:
            return {
                "provider": "smtp",
                "status": "error",
                "error": f"SMTP Authentication failed: {str(e)}",
            }
        except smtplib.SMTPException as e:
            return {
                "provider": "smtp",
                "status": "error",
                "error": f"SMTP Error: {str(e)}",
            }
        except Exception as e:
            return {
                "provider": "smtp",
                "status": "error",
                "error": f"Connection error: {str(e)}",
            }

    # Resend fallback
    resend_url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }
    from_email = os.getenv("RESEND_FROM_EMAIL", "Onboarding <onboarding@resend.dev>")
    payload = {
        "from": from_email,
        "to": [data.to_email],
        "subject": data.subject or "Sidechat SMTP Test",
        "html": f"<p>{(data.body or 'This is a test email from Sidechat.').replace(chr(10), '<br>')}</p>",
    }

    try:
        response = requests.post(resend_url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            return {"provider": "resend", "status": "success", "to": data.to_email, "from": from_email}
        try:
            error_data = response.json()
            error_msg = error_data.get('message', str(error_data))
        except Exception:
            error_msg = response.text or f"HTTP {response.status_code}"
        return {"provider": "resend", "status": "error", "error": error_msg}
    except Exception as e:
        return {"provider": "resend", "status": "error", "error": str(e)}

@app.post("/invitations/send-email")
def send_invitation_email(data: SendEmailRequest):
    """
    Send invitation emails to multiple recipients.
    Supports both SMTP and Resend API.
    
    SMTP Configuration (Recommended):
    - SMTP_SERVER (e.g., "smtp.gmail.com")
    - SMTP_PORT (default: 587)
    - SMTP_USER (your email)
    - SMTP_PASSWORD (your email password or app password)
    - SMTP_FROM_EMAIL (optional, defaults to SMTP_USER)
    
    Resend API Configuration:
    - RESEND_API_KEY
    - RESEND_FROM_EMAIL (optional, defaults to onboarding@resend.dev)
    """
    results = []
    
    # SMTP Configuration (checked first - more reliable)
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)  # Can be different from login
    
    # Resend API Configuration (fallback)
    resend_api_key = os.getenv("RESEND_API_KEY", RESEND_API_KEY)
    
    use_smtp = smtp_server and smtp_user and smtp_password
    use_resend = resend_api_key and resend_api_key != ""  # Use Resend if API key is provided
    
    if not use_smtp and not use_resend:
        error_msg = "No email service configured. Set SMTP credentials (SMTP_SERVER, SMTP_USER, SMTP_PASSWORD) or RESEND_API_KEY"
        print(f"ERROR: {error_msg}")
        return {
            "results": [{"email": email, "status": "error", "error": error_msg} for email in data.emails],
            "sent": 0
        }
    
    print(f"Using {'SMTP' if use_smtp else 'Resend API'} for email sending")
    
    # Extract group name from subject if possible
    group_name = data.subject.replace("Join ", "").strip()
    
    for email in data.emails:
        try:
            if use_smtp:
                # Use SMTP to send emails
                print(f"Attempting to send email to {email} using SMTP ({smtp_server})...")
                
                # Create HTML email
                html_body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
                    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">You're Invited!</h1>
                        </div>
                        
                        <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Join "{group_name}"</h2>
                        
                        <p style="color: #3f3f46; line-height: 1.6; margin-bottom: 24px;">
                            {data.body.replace(chr(10), '<br>')}
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="{data.invite_link}" 
                               style="display: inline-block; background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Accept Invitation
                            </a>
                        </div>
                        
                        <p style="color: #71717a; font-size: 12px; margin-top: 24px; text-align: center;">
                            Or copy and paste this link: <br>
                            <a href="{data.invite_link}" style="color: #8B5CF6; word-break: break-all;">{data.invite_link}</a>
                        </p>
                    </div>
                </body>
                </html>
                """
                
                # Create message
                msg = MIMEMultipart('alternative')
                msg['From'] = smtp_from_email
                msg['To'] = email
                msg['Subject'] = data.subject
                
                # Add both plain text and HTML versions
                text_part = MIMEText(data.body, 'plain')
                html_part = MIMEText(html_body, 'html')
                
                msg.attach(text_part)
                msg.attach(html_part)
                
                # Send via SMTP
                try:
                    with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_password)
                        server.send_message(msg)
                    
                    print(f"✓ Email sent successfully via SMTP to {email}")
                    results.append({"email": email, "status": "success"})
                except smtplib.SMTPAuthenticationError as e:
                    error_msg = f"SMTP Authentication failed: {str(e)}"
                    print(f"✗ {error_msg}")
                    results.append({"email": email, "status": "error", "error": error_msg})
                except smtplib.SMTPException as e:
                    error_msg = f"SMTP Error: {str(e)}"
                    print(f"✗ {error_msg}")
                    results.append({"email": email, "status": "error", "error": error_msg})
                except Exception as e:
                    error_msg = f"Connection error: {str(e)}"
                    print(f"✗ {error_msg}")
                    results.append({"email": email, "status": "error", "error": error_msg})
                    
            elif use_resend:
                # Use Resend API to send emails
                html_body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
                    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">You're Invited!</h1>
                        </div>
                        
                        <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Join "{group_name}"</h2>
                        
                        <p style="color: #3f3f46; line-height: 1.6; margin-bottom: 24px;">
                            {data.body.replace(chr(10), '<br>')}
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="{data.invite_link}" 
                               style="display: inline-block; background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Accept Invitation
                            </a>
                        </div>
                        
                        <p style="color: #71717a; font-size: 12px; margin-top: 24px; text-align: center;">
                            Or copy and paste this link: <br>
                            <a href="{data.invite_link}" style="color: #8B5CF6; word-break: break-all;">{data.invite_link}</a>
                        </p>
                    </div>
                </body>
                </html>
                """
                
                resend_url = "https://api.resend.com/emails"
                headers = {
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                }
                
                # Use your verified domain email, or fallback to onboarding@resend.dev (test only)
                # IMPORTANT: onboarding@resend.dev only works for test emails (delivered@resend.dev, etc.)
                # To send to real emails, you must verify your domain in Resend dashboard
                from_email = os.getenv("RESEND_FROM_EMAIL", "Onboarding <onboarding@resend.dev>")
                
                payload = {
                    "from": from_email,
                    "to": [email],
                    "subject": data.subject,
                    "html": html_body
                }
                
                print(f"Attempting to send email to {email} using Resend API...")
                print(f"API Key: {resend_api_key[:10]}...")
                
                response = requests.post(resend_url, json=payload, headers=headers, timeout=10)
                
                print(f"Resend API Response Status: {response.status_code}")
                print(f"Resend API Response: {response.text}")
                
                if response.status_code == 200:
                    response_data = response.json()
                    print(f"✓ Email sent successfully to {email}")
                    print(f"Email ID: {response_data.get('id', 'N/A')}")
                    results.append({"email": email, "status": "success"})
                elif response.status_code == 403:
                    # 403 usually means domain not verified or using onboarding@resend.dev with real email
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('message', 'Domain not verified or using test email address')
                    except:
                        error_msg = "Domain verification required. onboarding@resend.dev can only send to test addresses."
                    
                    print(f"✗ Failed to send email to {email}")
                    print(f"Error (403): {error_msg}")
                    print("NOTE: To send to real emails, verify your domain in Resend dashboard:")
                    print("  1. Go to https://resend.com/domains")
                    print("  2. Add and verify your domain")
                    print("  3. Set RESEND_FROM_EMAIL environment variable (e.g., 'noreply@yourdomain.com')")
                    results.append({"email": email, "status": "error", "error": error_msg})
                else:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('message', str(error_data))
                    except:
                        error_msg = response.text or f"HTTP {response.status_code}"
                    
                    print(f"✗ Failed to send email to {email}")
                    print(f"Error: {error_msg}")
                    results.append({"email": email, "status": "error", "error": error_msg})
            else:
                # This shouldn't happen due to check at top, but just in case
                error_msg = "No email service configured"
                print(f"✗ {error_msg} for {email}")
                results.append({"email": email, "status": "error", "error": error_msg})
                    
        except Exception as e:
            print(f"Error sending email to {email}: {e}")
            import traceback
            traceback.print_exc()
            results.append({"email": email, "status": "error", "error": str(e)})
    
    return {"results": results, "sent": len([r for r in results if r["status"] == "success"])}

@app.post("/invitations/accept")
def accept_invitation(data: AcceptInviteRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM invitations WHERE token = ?", (data.token,))
    invite = cursor.fetchone()
    
    if not invite:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid invitation link")
    
    group_id = invite['group_id']
    
    cursor.execute("SELECT name FROM groups WHERE id = ?", (group_id,))
    group = cursor.fetchone()
    
    if not group:
         conn.close()
         raise HTTPException(status_code=404, detail="Group not found")
         
    cursor.execute("INSERT OR IGNORE INTO group_members VALUES (?, ?)", (group_id, data.user_id))
    conn.commit()
    conn.close()
    
    return {"success": True, "groupId": group_id, "groupName": group['name']}

# --- Thread Endpoints ---
@app.get("/threads")
def get_threads(group_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if group_id:
        cursor.execute("SELECT * FROM threads WHERE group_id = ?", (group_id,))
    else:
        cursor.execute("SELECT * FROM threads")
    
    rows = cursor.fetchall()
    threads = []
    for r in rows:
        t = row_to_dict(r)
        t['is_active'] = bool(t['is_active'])
        threads.append(t)
    conn.close()
    return threads

@app.post("/threads")
def create_thread(
    name: str = Form(...),
    group_id: str = Form(...),
    created_by: str = Form(...)
):
    new_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO threads VALUES (?, ?, ?, ?, ?, ?)", 
                   (new_id, group_id, name, created_by, True, created_at))
    conn.commit()
    conn.close()
    
    return {
        "id": new_id,
        "group_id": group_id,
        "name": name,
        "created_by": created_by,
        "is_active": True,
        "created_at": created_at
    }

# --- AI Endpoints ---

@app.post("/ask-ai")
def ask_ai(request: AskAIRequest):
    try:
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', request.question)
        
        # ChatGPT-style system prompt
        system_prompt = """You are ChatGPT, a large language model trained by OpenAI. You are helpful, harmless, and honest. 

Your responses should be:
- Clear, comprehensive, and well-structured
- Based on the most current and accurate information available
- Include citations when referencing sources (format: [Source Name](URL) or "According to [Source Name]...")
- Use markdown formatting for better readability (headers, lists, code blocks, etc.)
- Provide detailed explanations when appropriate
- Be conversational and natural, like a helpful assistant

When you have access to web search results or URLs, always cite your sources clearly. Format citations as [Source Name](URL) or mention sources naturally in your response."""
        
        user_content = request.question
        sources = []
        
        # Add chat context if available
        if request.chatContext:
            user_content = f"Previous conversation context:\n{request.chatContext}\n\nUser question: {request.question}"

        if urls:
            url_context = "\n\n--- Web Content from URLs ---\n"
            for url in urls:
                print(f"Fetching URL: {url}")
                try:
                    content = fetch_url_content(url)
                    url_context += f"\n[Source: {url}]\n{content[:3000]}\n"
                    sources.append({"url": url, "title": url})
                except Exception as e:
                    print(f"Failed to fetch {url}: {e}")
            
            user_content += url_context
            system_prompt += "\n\nYou have been provided with web content from URLs. Use this information to answer the question and cite the sources clearly."
        else:
            # Perform Web Search for up-to-date information
            print(f"Searching web for: {request.question}")
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(request.question, max_results=5))
                
                if results:
                    search_context = "\n\n--- Web Search Results (Latest Information) ---\n"
                    for idx, res in enumerate(results, 1):
                        url = res.get('href', '')
                        title = res.get('title', 'Untitled')
                        snippet = res.get('body', '')
                        
                        print(f"Processing Search Result {idx}: {title} - {url}")
                        
                        # Try to fetch full content
                        try:
                            content = fetch_url_content(url)
                            search_context += f"\n[Source {idx}: {title}]({url})\nContent: {content[:2500]}\n"
                        except Exception as e:
                            print(f"Failed to fetch full content from {url}: {e}")
                            # Use snippet if available
                            if snippet:
                                search_context += f"\n[Source {idx}: {title}]({url})\nSnippet: {snippet}\n"
                        
                        sources.append({"url": url, "title": title})
                    
                    user_content += search_context
                    system_prompt += "\n\nYou have been provided with the latest web search results. Use this current information to answer the question comprehensively. Always cite your sources using the format [Source Name](URL) or mention sources naturally (e.g., 'According to [Source Name]...'). Include multiple sources when relevant."
            except Exception as e:
                print(f"Search failed: {e}")

        # Check if OpenAI client is configured
        if not client:
            return {"content": "Error: OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."}
        
        # Use the latest GPT-4 model
        response = client.chat.completions.create(
            model="gpt-4o",  # Latest GPT-4 model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        
        # Add sources section at the end if we have sources
        if sources:
            sources_text = "\n\n**Sources:**\n"
            for source in sources:
                sources_text += f"- [{source['title']}]({source['url']})\n"
            content += sources_text
        
        return {"content": content}
    except Exception as e:
        return {"content": f"Error calling OpenAI: {str(e)}"}

def fetch_url_content(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.extract()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        return text[:8000] 
    except Exception as e:
        return f"failed to fetch URL content: {str(e)}"

@app.post("/ask-ai-stream")
def ask_ai_stream(request: AskAIRequest):
    def event_generator():
        try:
            urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', request.question)
            
            # ChatGPT-style system prompt
            system_prompt = """You are ChatGPT, a large language model trained by OpenAI. You are helpful, harmless, and honest. 

Your responses should be:
- Clear, comprehensive, and well-structured
- Based on the most current and accurate information available
- Include citations when referencing sources (format: [Source Name](URL) or "According to [Source Name]...")
- Use markdown formatting for better readability (headers, lists, code blocks, etc.)
- Provide detailed explanations when appropriate
- Be conversational and natural, like a helpful assistant

When you have access to web search results or URLs, always cite your sources clearly. Format citations as [Source Name](URL) or mention sources naturally in your response."""
            
            user_content = request.question
            sources = []
            
            # Add chat context if available
            if request.chatContext:
                user_content = f"Previous conversation context:\n{request.chatContext}\n\nUser question: {request.question}"
            
            if urls:
                url_context = "\n\n--- Web Content from URLs ---\n"
                for url in urls:
                    print(f"Fetching URL: {url}")
                    try:
                        content = fetch_url_content(url)
                        url_context += f"\n[Source: {url}]\n{content[:3000]}\n"
                        sources.append({"url": url, "title": url})
                    except Exception as e:
                        print(f"Failed to fetch {url}: {e}")
                
                user_content += url_context
                system_prompt += "\n\nYou have been provided with web content from URLs. Use this information to answer the question and cite the sources clearly."
            else:
                # Perform Web Search for up-to-date information
                print(f"Searching web for: {request.question}")
                try:
                    with DDGS() as ddgs:
                        results = list(ddgs.text(request.question, max_results=5))
                    
                    if results:
                        search_context = "\n\n--- Web Search Results (Latest Information) ---\n"
                        for idx, res in enumerate(results, 1):
                            url = res.get('href', '')
                            title = res.get('title', 'Untitled')
                            snippet = res.get('body', '')
                            
                            print(f"Processing Search Result {idx}: {title} - {url}")
                            
                            # Try to fetch full content
                            try:
                                content = fetch_url_content(url)
                                search_context += f"\n[Source {idx}: {title}]({url})\nContent: {content[:2500]}\n"
                            except Exception as e:
                                print(f"Failed to fetch full content from {url}: {e}")
                                # Use snippet if available
                                if snippet:
                                    search_context += f"\n[Source {idx}: {title}]({url})\nSnippet: {snippet}\n"
                            
                            sources.append({"url": url, "title": title})
                        
                        user_content += search_context
                        system_prompt += "\n\nYou have been provided with the latest web search results. Use this current information to answer the question comprehensively. Always cite your sources using the format [Source Name](URL) or mention sources naturally (e.g., 'According to [Source Name]...'). Include multiple sources when relevant."
                except Exception as e:
                    print(f"Search failed: {e}")

            # Check if OpenAI client is configured
            if not client:
                yield "Error: OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."
                return

            stream = client.chat.completions.create(
                model="gpt-4o",  # Latest GPT-4 model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True,
            )
            
            full_content = ""
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content_chunk = chunk.choices[0].delta.content
                    full_content += content_chunk
                    yield content_chunk
            
            # Add sources at the end of streaming
            if sources:
                sources_text = "\n\n**Sources:**\n"
                for source in sources:
                    sources_text += f"- [{source['title']}]({source['url']})\n"
                yield sources_text
                
        except Exception as e:
            yield f"Error calling OpenAI: {str(e)}"

    return StreamingResponse(event_generator(), media_type="text/plain")



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
