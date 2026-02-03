from typing import AsyncGenerator
from app.services.chat_history.chat_history_service import ChatHistoryService
from app.services.llm.providers.gemini import GeminiClient
from app.exceptions import (
    SessionNotFoundError,
    UnauthorizedSessionError,
)
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
    ) -> AsyncGenerator[str, None]:
        """
        Streams chat response from the AI tutor with robust error handling.
        
        If streaming fails partway through, the partial response is NOT saved.
        Instead, an error message is yielded to the client.
        
        :param user_id: User identifier
        :param problem_slug: Problem identifier
        :param code: User's code submission
        :param message: User's message to the tutor
        :param problem_description: Description of the problem
        :yields: Chunks of the AI response or error message
        :raises: Exceptions for critical failures (session creation, etc.)
        """
        session = None
        user_message_id = None
        
        try:
            try:
                session = await self.history_service.get_or_create_session(
                    user_id=user_id,
                    problem_slug=problem_slug,
                )
                logger.info(f"Using session {session.id} for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to get/create session: {e}")
                error_message = "Failed to initialize chat session"
                yield error_message
                raise

            try:
                user_message = await self.history_service.add_message(
                    session_id=session.id,
                    role="user",
                    content=message
                )
                user_message_id = user_message.id
            except Exception as e:
                logger.error(f"Failed to save user message: {e}")
                error_message = "Failed to save your message"
                yield error_message
                raise

            try:
                messages = await self.history_service.get_session_messages(session.id)
                formatted_history = self.history_service.format_history_for_llm(messages[:-1])
            except Exception as e:
                logger.error(f"Failed to fetch chat history: {e}")
                error_message = "Failed to load chat history"
                yield error_message
                raise

            full_response = ""
            stream_error = None
            
            try:
                async for chunk in self.llm_client.stream_tutor_chat(
                    code=code,
                    problem_description=problem_description,
                    chat_history=formatted_history,
                    user_message=message
                ):
                    full_response += chunk
                    yield chunk
                
                logger.info(f"Stream completed successfully for session {session.id}")
                
            except Exception as stream_err:
                stream_error = stream_err
                logger.error(f"Streaming error: {stream_err}", exc_info=True)
                
                error_msg = f"\n\n[Stream interrupted: {str(stream_err)}]"
                yield error_msg
                full_response += error_msg

            if full_response.strip():
                try:
                    await self.history_service.add_message(
                        session_id=session.id,
                        role="assistant",
                        content=full_response
                    )
                    logger.info(f"Saved AI response to session {session.id}")
                except Exception as e:
                    logger.error(f"Failed to save AI response: {e}")
                    yield f"\n\n[Warning: Response not saved to history: {str(e)}]"
            else:
                logger.warning(f"No response content to save for session {session.id}")

            if stream_error:
                raise stream_error
                
        except Exception as e:
            logger.error(f"Critical error in tutor service: {str(e)}", exc_info=True)
            raise
    
    async def get_session_messages(self, user_id: str, problem_slug: str):
        """
        Retrieves or creates a chat session and fetches its messages.
        
        :param user_id: User identifier
        :param problem_slug: Problem identifier
        :return: Tuple of (session, messages)
        """
        try:
            session = await self.history_service.get_or_create_session(
                user_id=user_id,
                problem_slug=problem_slug
            )
            messages = await self.history_service.get_session_messages(session.id)
            return session, messages
        except Exception as e:
            logger.error(f"Failed to get session messages: {e}")
            raise
    
    async def get_user_sessions(self, user_id: str, limit: int = 20):
        """
        Retrieves chat sessions for a user.
        
        :param user_id: User identifier
        :param limit: Maximum number of sessions to retrieve
        :return: List of chat sessions
        """
        try:
            return await self.history_service.get_user_sessions(user_id, limit)
        except Exception as e:
            logger.error(f"Failed to get user sessions: {e}")
            raise
    
    async def delete_session(self, session_id: int, user_id: str):
        """
        Deletes a chat session.
        
        :param session_id: Session identifier
        :param user_id: User identifier
        :raises SessionNotFoundError: If session doesn't exist
        :raises UnauthorizedSessionError: If user doesn't own the session
        """
        try:
            await self.history_service.delete_session(session_id, user_id)
            logger.info(f"Deleted session {session_id}")
        except (SessionNotFoundError, UnauthorizedSessionError):
            raise
        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            raise
    
    async def delete_message(self, message_id: int, session_id: int, user_id: str):
        """
        Deletes a specific message from a chat session.

        :param message_id: Message identifier
        :param session_id: Session identifier
        :param user_id: User identifier
        :raises SessionNotFoundError: If session doesn't exist
        :raises UnauthorizedSessionError: If user doesn't own the session
        :raises MessageNotFoundError: If message doesn't exist
        """
        try:
            await self.history_service.delete_message(message_id, session_id, user_id)
            logger.info(f"Deleted message {message_id} from session {session_id}")
        except Exception as e:
            logger.error(f"Failed to delete message: {e}")
            raise