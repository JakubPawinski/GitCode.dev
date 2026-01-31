from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.services.tutor.tutor_service import TutorService
from app.models.tutor import TutorRequest
from app.auth.deps import get_current_user, RequiredPermission
from app.models.generated import AuthenticatedUser, AppPermission
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/stream")
async def chat_with_tutor(
    request: TutorRequest,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Stream AI tutor response"""
    try:
        tutor_service = TutorService(db)
        
        async def event_generator():
            try:
                async for chunk in tutor_service.stream_chat_response(
                    user_id=user.id,
                    problem_slug=request.problem_slug,
                    code=request.code,
                    message=request.message,
                    problem_description=request.problem_description,
                    attempt_id=request.attempt_id
                ):
                    yield f"data: {json.dumps({'text': chunk, 'done': False})}\n\n"
                
                yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"
                
            except Exception as e:
                logger.error(f"Stream error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        logger.error(f"Tutor endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
    await tutor_service.delete_session(session_id, user.id)
    
    return {"message": f"Session {session_id} deleted successfully"}


@router.delete("/sessions/{session_id}/messages/{message_id}")
async def delete_message(
    session_id: int,
    message_id: int,
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_tutor_chat)),
    db: AsyncSession = Depends(get_session)
):
    """Delete single message from session"""
    tutor_service = TutorService(db)
    await tutor_service.delete_message(message_id, session_id, user.id)
    
    return {"message": f"Message {message_id} deleted successfully"}