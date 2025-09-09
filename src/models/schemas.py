
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChatRequest(BaseModel):
    user_id: str
    question: str
    context_docs: Optional[List[str]] = None
    device: Optional[str] = None
    local_time: Optional[str] = None
    model: Optional[str] = None
    max_tokens: int = Field(default=800, ge=64, le=2048)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
