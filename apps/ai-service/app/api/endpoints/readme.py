from fastapi import APIRouter, Depends, HTTPException
from app.auth.deps import RequiredPermission
from app.models.generated import AuthenticatedUser, AppPermission, GenerateReadmeCommand
from app.core.event_bus import event_bus
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate")
async def generate_readme(
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_readme_generation)),
):
    """
    Generate a README by publishing a GenerateReadmeCommand event.
    
    Returns a confirmation that the command was published.
    """
    try:
        logger.info(f"Publishing GenerateReadmeCommand for user: {user.id}")
        
        # Create the command
        command = GenerateReadmeCommand(userId=user.id)
        logger.debug(f"Command: {command.model_dump_json()}")
        
        # Publish the command to the event bus
        await event_bus.publish(
            routing_key="ai.readme.generate",
            event_data=command,
        )
        
        logger.info(f"Successfully published GenerateReadmeCommand for user: {user.id}")
        
        return {
            "success": True,
            "message": "README generation command published",
            "userId": user.id,
            "status": "processing",
            "details": "The README is being generated asynchronously. You will receive a notification when it's ready."
        }
        
    except Exception as e:
        logger.error(f"Failed to publish GenerateReadmeCommand: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))