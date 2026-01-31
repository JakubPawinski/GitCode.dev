from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.schemas.chat import ChatSession, ChatMessage
from typing import List
import logging
from app.exceptions import (
    SessionNotFoundError,
    UnauthorizedSessionError,
    MessageNotFoundError,
)

logger = logging.getLogger(__name__)

class ChatHistoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_session(
        self, 
        user_id: str, 
        problem_slug: str,
        attempt_id: str = None
    ) -> ChatSession:
        """Gets or creates a chat session."""
        statement = select(ChatSession).where(
            ChatSession.user_id == user_id,
            ChatSession.problem_slug == problem_slug
        )
        result = await self.db.exec(statement)
        session = result.first()

        if not session:
            session = ChatSession(
                user_id=user_id,
                problem_slug=problem_slug,
                attempt_id=attempt_id
            )
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)
            logger.info(f"Created new chat session: {session.id}")
        
        return session

    async def add_message(
        self, 
        session_id: int, 
        role: str, 
        content: str
    ) -> ChatMessage:
        """Adds a message to a chat session."""
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        logger.debug(f"Added message to session {session_id}: {role}")
        return message

    async def get_session_messages(self, session_id: int) -> List[ChatMessage]:
        """Retrieves all messages for a given chat session, ordered by creation time."""
        statement = select(ChatMessage).where(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc())
        
        result = await self.db.exec(statement)
        return result.all()

    def format_history_for_llm(self, messages: List[ChatMessage]) -> list[dict]:
        """Formats chat messages for LLM input."""
        return [
            {
                "role": "model" if msg.role == "assistant" else "user",
                "content": msg.content
            }
            for msg in messages
        ]

    async def get_user_sessions(self, user_id: str, limit: int = 10) -> List[ChatSession]:
        """Retrieves all chat sessions for a given user."""
        statement = select(ChatSession).where(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.created_at.desc()).limit(limit)
        
        result = await self.db.exec(statement)
        return result.all()

    async def delete_session(self, session_id: int, user_id: str) -> None:
        """
        Deletes a chat session and its related messages via cascade delete.
        
        The CASCADE DELETE constraint at the database level ensures all related
        ChatMessage records are automatically deleted.
        
        :param session_id: Chat session identifier
        :param user_id: User identifier for authorization check
        :raises SessionNotFoundError: If session doesn't exist
        :raises UnauthorizedSessionError: If user doesn't own the session
        """
        # Fetch session to verify it exists and user owns it
        statement = select(ChatSession).where(
            ChatSession.id == session_id
        )
        result = await self.db.exec(statement)
        session = result.first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != user_id:
            raise UnauthorizedSessionError(
                f"User {user_id} is not authorized to delete session {session_id}"
            )

        # Delete session - cascade will handle related messages
        await self.db.delete(session)
        await self.db.commit()
        logger.info(f"Deleted session {session_id} (cascade delete handled related messages)")

    async def delete_message(self, message_id: int, session_id: int, user_id: str) -> None:
        """
        Deletes a specific message from a chat session.
        
        :param message_id: Message identifier
        :param session_id: Chat session identifier for authorization check
        :param user_id: User identifier for authorization check
        :raises SessionNotFoundError: If session doesn't exist
        :raises UnauthorizedSessionError: If user doesn't own the session
        :raises MessageNotFoundError: If message doesn't exist
        """
        # Verify session exists and user owns it
        session_statement = select(ChatSession).where(
            ChatSession.id == session_id
        )
        session_result = await self.db.exec(session_statement)
        session = session_result.first()
        
        if not session:
            raise SessionNotFoundError(f"Session {session_id} not found")
        
        if session.user_id != user_id:
            raise UnauthorizedSessionError(
                f"User {user_id} is not authorized to access session {session_id}"
            )

        # Fetch and delete the specific message
        message_statement = select(ChatMessage).where(
            ChatMessage.id == message_id,
            ChatMessage.session_id == session_id
        )
        message_result = await self.db.exec(message_statement)
        message = message_result.first()
        
        if not message:
            raise MessageNotFoundError(f"Message {message_id} not found in session {session_id}")
        
        await self.db.delete(message)
        await self.db.commit()
        logger.info(f"Deleted message {message_id} from session {session_id}")