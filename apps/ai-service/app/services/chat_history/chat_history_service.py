from sqlmodel import select, Session
from app.schemas.chat import ChatSession, ChatMessage
from typing import List
import logging

logger = logging.getLogger(__name__)

class ChatHistoryService:
    def __init__(self, db: Session):
        self.db = db

    async def get_or_create_session(
        self, 
        user_id: str, 
        problem_slug: str,
        attempt_id: str = None
    ) -> ChatSession:
        """
        Gets or creates a chat session.
        
        
        :param self: Instance of the class
        :param user_id: User identifier
        :type user_id: str
        :param problem_slug: Problem identifier
        :type problem_slug: str
        :param attempt_id: Attempt identifier
        :type attempt_id: str
        :return: Chat session instance
        :rtype: ChatSession
        """

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
        """
        Adds a message to a chat session.
        :param self: Instance of the class
        :param session_id: Chat session identifier
        :type session_id: int
        :param role: Role of the message sender (e.g., 'user', 'assistant')
        :type role: str
        :param content: Content of the message
        :type content: str
        :return: Chat message instance
        :rtype: ChatMessage
        """

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
        """
        Retrieves all messages for a given chat session, ordered by creation time.

        :param self: Instance of the class
        :param session_id: Chat session identifier
        :type session_id: int
        :return: List of chat messages
        :rtype: List[ChatMessage]
        """

        statement = select(ChatMessage).where(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc())
        
        result = await self.db.exec(statement)
        return result.all()

    def format_history_for_llm(self, messages: List[ChatMessage]) -> list[dict]:
        """
        Formats chat messages for LLM input.
        :param self: Instance of the class
        :param messages: List of chat messages
        :type messages: List[ChatMessage]
        :return: Formatted chat history
        :rtype: list[dict]
        """

        formatted = []
        for msg in messages:
            role = "model" if msg.role == "assistant" else "user"
            formatted.append({
                "role": role,
                "content": msg.content
            })
        return formatted

    async def get_user_sessions(self, user_id: str, limit: int = 10) -> List[ChatSession]:
        """
        Retrieves all chat sessions for a given user, limited by the specified number.
        :param self: Instance of the class
        :param user_id: User identifier
        :type user_id: str
        :param limit: Maximum number of sessions to retrieve
        :type limit: int
        :return: List of chat sessions
        :rtype: List[ChatSession]
        """

        statement = select(ChatSession).where(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.created_at.desc()).limit(limit)
        
        result = await self.db.exec(statement)
        return result.all()

    async def delete_session(self, session_id: int, user_id: str) -> None:
        """
        Deletes a chat session and its messages.
        
        :param self: Instance of the class
        :param session_id: Chat session identifier
        :type session_id: int
        :param user_id: User identifier
        :type user_id: str
        """

        statement = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        result = await self.db.exec(statement)
        session = result.first()
        
        if not session:
            raise ValueError("Session not found or unauthorized")

        message_statement = select(ChatMessage).where(ChatMessage.session_id == session_id)
        messages = await self.db.exec(message_statement)
        for msg in messages.all():
            await self.db.delete(msg)

        await self.db.delete(session)
        await self.db.commit()

    async def delete_message(self, message_id: int, session_id: int, user_id: str) -> None:
        """
        Deletes a specific message from a chat session.
        
        :param self: Instance of the class
        :param message_id: Message identifier
        :type message_id: int
        :param session_id: Chat session identifier
        :type session_id: int
        :param user_id: User identifier
        :type user_id: str
        """
        
        statement = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        )
        result = await self.db.exec(statement)
        session = result.first()
        
        if not session:
            raise ValueError("Session not found or unauthorized")

        message_statement = select(ChatMessage).where(
            ChatMessage.id == message_id,
            ChatMessage.session_id == session_id
        )
        msg_result = await self.db.exec(message_statement)
        message = msg_result.first()
        
        if not message:
            raise ValueError("Message not found")
        
        await self.db.delete(message)
        await self.db.commit()
