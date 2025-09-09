
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .models.schemas import RegisterRequest, LoginRequest, ChatRequest
from .storage.db import init_db, get_db
from .services.auth import register_user, login_user
from .services.learning import run_chain
import os
from dotenv import load_dotenv
load_dotenv()  # reads .env in the current working directory

app = FastAPI(title='Socratic Tutor Full', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

# Serve static files
app.mount('/static', StaticFiles(directory='static'), name='static')

@app.on_event('startup')
def startup():
    init_db()

@app.get('/')
def root():
    return FileResponse(os.path.join('static', 'landing.html'))

@app.post('/register')
def api_register(req: RegisterRequest):
    try:
        user_id = register_user(req.email, req.password)
        return {'user_id': user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post('/login')
def api_login(req: LoginRequest):
    try:
        user_id = login_user(req.email, req.password)
        return {'user_id': user_id}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post('/chat_chain_gemini')
def api_chat(req: ChatRequest):
    # Run the chain; errors inside will be raised as HTTPException if API key missing.
    return run_chain(req)
