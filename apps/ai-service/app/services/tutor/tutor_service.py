from typing import AsyncGenerator
from app.services.chat_history.chat_history_service import ChatHistoryService
from app.services.llm.providers.gemini import GeminiClient
from app.schemas.chat import ChatSession
from sqlmodel.ext.asyncio.session import AsyncSession
import logging

logger = logging.getLogger(__name__)

class TutorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.history_service = ChatHistoryService(db)
        self.llm_client = GeminiClient()
    
    async def stream_chat_response(
        self,
        user_id: str,
        problem_slug: str,
        code: str,
        message: str,
        problem_description: str,
        attempt_id: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams chat response from the AI tutor.
        
        :param self: Instance of the class
        :param user_id: User identifier
        :type user_id: str
        :param problem_slug: Problem identifier
        :type problem_slug: str
        :param code: User's code submission
        :type code: str
        :param message: User's message to the tutor
        :type message: str
        :param problem_description: Description of the problem
        :type problem_description: str
        :param attempt_id: Identifier for the attempt
        :type attempt_id: str
        :return: Stream of chat response chunks
        :rtype: AsyncGenerator[str, None]
        """

        try:
            session = await self.history_service.get_or_create_session(
                user_id=user_id,
                problem_slug=problem_slug,
                attempt_id=attempt_id
            )
            
            await self.history_service.add_message(
                session_id=session.id,
                role="user",
                content=message
            )
            
            messages = await self.history_service.get_session_messages(session.id)
            formatted_history = self.history_service.format_history_for_llm(messages[:-1])

            full_response = ""
            async for chunk in self.llm_client.stream_tutor_chat(
                code=code,
                problem_description=problem_description,
                chat_history=formatted_history,
                user_message=message
            ):
                full_response += chunk
                yield chunk

            await self.history_service.add_message(
                session_id=session.id,
                role="assistant",
                content=full_response
            )
            
            logger.info(f"Stream completed for session {session.id}")
            
        except Exception as e:
            logger.error(f"Tutor service error: {str(e)}")
            raise
    
    async def get_session_messages(self, user_id: str, problem_slug: str):
        """
        Retrieves or creates a chat session and fetches its messages.
        
        :param self: Instance of the class
        :param user_id: User identifier
        :type user_id: str
        :param problem_slug: Problem identifier
        :type problem_slug: str
        """

        session = await self.history_service.get_or_create_session(
            user_id=user_id,
            problem_slug=problem_slug
        )
        messages = await self.history_service.get_session_messages(session.id)
        return session, messages
    
    async def get_user_sessions(self, user_id: str, limit: int = 20):
        """
        Retrieves chat sessions for a user.
        
        :param self: Instance of the class
        :param user_id: User identifier
        :type user_id: str
        :param limit: Maximum number of sessions to retrieve
        :type limit: int
        """

        return await self.history_service.get_user_sessions(user_id, limit)
    
    async def delete_session(self, session_id: int, user_id: str):
        """
        Deletes a chat session.
        
        :param self: Instance of the class
        :param session_id: Session identifier
        :type session_id: int
        :param user_id: User identifier
        :type user_id: str
        """

        await self.history_service.delete_session(session_id, user_id)
    
    async def delete_message(self, message_id: int, session_id: int, user_id: str):
        """
        Deletes a specific message from a chat session.

        :param self: Instance of the class
        :param message_id: Message identifier
        :type message_id: int
        :param session_id: Session identifier
        :type session_id: int
        :param user_id: User identifier
        :type user_id: str
        """
        
        await self.history_service.delete_message(message_id, session_id, user_id)