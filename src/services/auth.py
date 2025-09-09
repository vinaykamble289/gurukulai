
import uuid, json, os, bcrypt, time
from ..storage.db import get_db

def now_iso():
    import datetime
    return datetime.datetime.utcnow().isoformat() + 'Z'

def register_user(email: str, password: str) -> str:
    conn = get_db()
    try:
        cur = conn.execute('SELECT email FROM users WHERE email=?', (email,))
        if cur.fetchone():
            raise ValueError('Email already registered')
        user_id = str(uuid.uuid4())
        pwd_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        # create learner record
        conn.execute('INSERT OR IGNORE INTO learners(user_id, created_at, profile_json) VALUES (?,?,?)', (user_id, now_iso(), json.dumps({'email': email})))
        conn.execute('INSERT INTO users(email, password_hash, user_id) VALUES (?,?,?)', (email, pwd_hash, user_id))
        conn.commit()
        return user_id
    finally:
        conn.close()

def login_user(email: str, password: str) -> str:
    conn = get_db()
    try:
        cur = conn.execute('SELECT password_hash, user_id FROM users WHERE email=?', (email,))
        row = cur.fetchone()
        if not row:
            raise ValueError('Invalid credentials')
        pwd_hash, user_id = row
        if not bcrypt.checkpw(password.encode(), pwd_hash.encode()):
            raise ValueError('Invalid credentials')
        return user_id
    finally:
        conn.close()
