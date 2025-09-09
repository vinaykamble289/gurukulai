
# Socratic Tutor — Full Working Example (local)

This bundle contains a modular FastAPI backend plus static pages (landing, register, login, chat) that work together.

## Quick start (development)

1. Create virtualenv and install:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. (Optional) Set your Google API key to enable Gemini calls:
   ```bash
   export GOOGLE_API_KEY="your_key_here"
   ```
   If you don't set it, the chat endpoint will return a helpful error but the register/login flow will still work.
3. Run the app:
   ```bash
   uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
   ```
4. Open http://localhost:8000 in your browser.

## Endpoints
- `GET /` → landing page
- `GET /static/...` → static assets
- `POST /register` → JSON {email, password} → returns {user_id}
- `POST /login` → JSON {email, password} → returns {user_id}
- `POST /chat_chain_gemini` → main tutor API (requires GOOGLE_API_KEY to call Gemini)

## Notes
- SQLite DB file `socratic.db` is created in the project root.
- Passwords are stored hashed using bcrypt (for demo purposes only — for production use stronger practices).
- This example is meant for local testing and learning only.
