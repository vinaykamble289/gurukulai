
import sqlite3, os
DB_PATH = os.path.join(os.getcwd(), 'socratic.db')
SCHEMA = r'''
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS learners (user_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, profile_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, user_id TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES learners(user_id));
CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, started_at TEXT NOT NULL, device TEXT, local_time TEXT);
CREATE TABLE IF NOT EXISTS interactions (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, ts TEXT, question TEXT, context_json TEXT, generator TEXT, critic_raw TEXT, final_answer TEXT, socratic_q1 TEXT, socratic_q2 TEXT, ai_tokens INT, user_tokens INT, reliance_score REAL, difficulty REAL);
CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, kind TEXT, score REAL, ts TEXT, meta_json TEXT);
CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, interaction_id INT, bleu REAL, rougeL REAL, perplexity_proxy REAL, meta_json TEXT);
'''

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn

def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()
