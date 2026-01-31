from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

class ChatSessionBase(SQLModel):
    user_id: str = Field(index=True)
    problem_slug: str = Field(index=True)
    attempt_id: Optional[str] = None

class ChatSession(ChatSessionBase, table=True):
    __tablename__ = "chat_sessions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    messages: List["ChatMessage"] = Relationship(back_populates="session", cascade_delete=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageBase(SQLModel):
    role: str
    content: str

class ChatMessage(ChatMessageBase, table=True):
    __tablename__ = "chat_messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chat_sessions.id", index=True)
    session: ChatSession = Relationship(back_populates="messages")
    created_at: datetime = Field(default_factory=datetime.utcnow)