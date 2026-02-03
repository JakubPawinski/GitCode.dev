from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.services.tutor.tutor_service import TutorService
from app.models.tutor import TutorRequest
from app.auth.deps import RequiredPermission
from app.models.generated import AuthenticatedUser, AppPermission
import httpx
from app.core.config import settings
import json
import logging
from app.exceptions import (
    SessionNotFoundError,
    UnauthorizedSessionError,
    MessageNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/stream")
async def chat_with_tutor(
    request: TutorRequest,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    try:
    # Fetch problem description from problem service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROBLEM_SERVICE_URL}/problems/internal/{request.problem_slug}",
                headers={"x-internal-api-key": settings.INTERNAL_API_KEY}
            )
            logger.info(f"Problem response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch problem description: {response.status_code}")
                raise HTTPException(status_code=502, detail="Failed to fetch problem description")
            
            response_json = response.json()
            problem_description = response_json.get("data", {}).get("description", "")
            logger.debug(f"Fetched problem description for slug {request.problem_slug}")
            logger.debug(f"Problem description content: {problem_description}")
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"Error fetching problem description: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching problem description")

    tutor_service = TutorService(db)
    
    async def event_generator():
        try:
            async for chunk in tutor_service.stream_chat_response(
                user_id=user.id,
                problem_slug=request.problem_slug,
                code=request.code,
                message=request.message,
                problem_description=problem_description,
            ):
                yield f"data: {json.dumps({'text': chunk, 'done': False})}\n\n"
            
            yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Stream error: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': 'An error occurred during generation'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/sessions/{problem_slug}")
async def get_session_history(
    problem_slug: str,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Get chat history for a problem"""
    tutor_service = TutorService(db)
    session, messages = await tutor_service.get_session_messages(user.id, problem_slug)
    
    return {
        "sessionId": session.id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "createdAt": msg.created_at
            }
            for msg in messages
        ],
        "createdAt": session.created_at
    }


@router.get("/user/sessions")
async def get_user_sessions(
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Get all chat sessions for user"""
    tutor_service = TutorService(db)
    sessions = await tutor_service.get_user_sessions(user.id, limit=20)
    
    return {
        "sessions": [
            {
                "id": s.id,
                "problemSlug": s.problem_slug,
                "createdAt": s.created_at,
                "updatedAt": s.updated_at
            }
            for s in sessions
        ]
    }


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Delete entire chat session"""
    tutor_service = TutorService(db)

    try:
        await tutor_service.delete_session(session_id, user.id)
        return {"message": f"Session {session_id} deleted successfully"}
    except SessionNotFoundError as e:
        logger.error(f"Error deleting session {session_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedSessionError as e:
        logger.error(f"Unauthorized attempt to delete session {session_id}: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}/messages/{message_id}")
async def delete_message(
    session_id: int,
    message_id: int,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Delete single message from session"""
    tutor_service = TutorService(db)
    try:
        await tutor_service.delete_message(message_id, session_id, user.id)
        return {"message": f"Message {message_id} deleted successfully"}
    except SessionNotFoundError as e:
        logger.error(f"Error deleting message {message_id} from session {session_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedSessionError as e:
        logger.error(f"Unauthorized attempt to delete message {message_id} from session {session_id}: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except MessageNotFoundError as e:
        logger.error(f"Message {message_id} not found in session {session_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting message {message_id} from session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    