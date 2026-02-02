import logging
import httpx
from app.core.event_dispatcher import dispatcher
from app.models.generated import (
    GenerateReadmeCommand, 
    AIPATTERNS,
    ReadmeGeneratedEvent
)
from app.core.event_bus import event_bus
from app.services.readme_generator.readme_generator_service import ReadmeGeneratorService
from app.core.config import settings

logger = logging.getLogger(__name__)

api_key = settings.INTERNAL_API_KEY


def _extract_stats_data(response_json: dict) -> dict:
    """Extract stats data from API response, handling nested 'data' structure."""
    if "data" in response_json and isinstance(response_json["data"], dict):
        return response_json["data"]
    return response_json

def _extract_user_data(response_json: dict) -> dict:
    """Extract user data from API response and transform to required format."""
    user_raw = _extract_stats_data(response_json)
    
    return {
        "username": user_raw.get("username", ""),
        "githubUsername": user_raw.get("githubUsername", user_raw.get("username", "")),
        "email": user_raw.get("email", ""),
        "avatarUrl": user_raw.get("avatarUrl") or ""
    }

@dispatcher.subscribe(routing_key=AIPATTERNS.ai_readme_generate, model=GenerateReadmeCommand)
async def handle_generate_readme(event: GenerateReadmeCommand, metadata: dict):
    """
    Handle a request to generate a README by using the ReadmeGeneratorService
    and publishing the generated README content.

    Args:
        event (GenerateReadmeCommand): The command data for generating the README.
        metadata (dict): Additional metadata associated with the event.
    Returns:
        None
    """
    try:
        logger.info(f"Received GenerateReadmeCommand for user: {event.userId}")
        logger.debug(f"Event data: {event}")

        # Fetch extended stats from problem-service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROBLEM_SERVICE_URL}/submissions/stats/extended/internal/{event.userId}",
                headers={"x-internal-api-key": api_key}
            )
            logger.info(f"Stats response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch user statistics: {response.status_code}")
                return
            
            response_json = response.json()
            stats_data = _extract_stats_data(response_json)
            logger.info(f"Extracted stats data with {stats_data.get('problemsSolved', 0)} problems solved")

        # Fetch user details
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/users/{event.userId}/internal",
                headers={"x-internal-api-key": api_key}
            )
            logger.info(f"User response status: {user_response.status_code}")

            if user_response.status_code != 200:
                logger.error(f"Failed to fetch user details: {user_response.status_code}")
                return
            
            user_data_json = user_response.json()
            user_data = _extract_user_data(user_data_json)
            logger.debug(f"Extracted user data: {user_data}")

        
        # Generate README
        readme_service = ReadmeGeneratorService()
        readme_content = await readme_service.generate_readme(user_data, stats_data)

        # Create event payload
        event_payload = ReadmeGeneratedEvent(
            readmeContent=readme_content,
            userId=event.userId,
        )

        logger.debug(f"Generated README content length: {len(readme_content)}")

        # Publish the event
        await event_bus.publish(
            routing_key=AIPATTERNS.ai_readme_generated,
            event_data=event_payload,
        )
        logger.info(f"Published ReadmeGeneratedEvent for user: {event.userId}")
        
    except Exception as e:
        logger.error(f"Error in handle_generate_readme: {e}", exc_info=True)
        raise