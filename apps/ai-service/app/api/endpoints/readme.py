from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from app.services.readme_generator.readme_generator_service import ReadmeGeneratorService
from app.auth.deps import RequiredPermission
from app.models.generated import AuthenticatedUser, AppPermission
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

token = "your-internal-api-key"


def _extract_stats_data(response_json: dict) -> dict:
    """Extract stats data from API response, handling nested 'data' structure."""
    if "data" in response_json and isinstance(response_json["data"], dict):
        return response_json["data"]
    return response_json


@router.post("/generate", response_class=PlainTextResponse)
async def generate_readme(
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_readme_generation)),
):
    """
    Generate a personalized README profile based on user statistics.
    Returns raw Markdown content.
    """
    try:
        # Fetch extended stats from problem-service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROBLEM_SERVICE_URL}/submissions/stats/extended/{user.user_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            logger.info(f"Stats response status: {response.status_code}")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch user statistics"
                )
            
            response_json = response.json()
            stats_data = _extract_stats_data(response_json)
            logger.info(f"Extracted stats data with {stats_data.get('problemsSolved', 0)} problems solved")
        
        # Prepare user data
        user_data = {
            "username": user.username,
            "githubUsername": user.username,
            "email": user.email,
            "avatarUrl": "https://www.gravatar.com/avatar/"
        }
        
        # Generate README
        readme_service = ReadmeGeneratorService()
        readme_content = await readme_service.generate_readme(user_data, stats_data)
        
        return PlainTextResponse(
            content=readme_content,
            media_type="text/markdown"
        )
        
    except Exception as e:
        logger.error(f"Failed to generate README: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview")
async def preview_readme(
    user: AuthenticatedUser = Depends(RequiredPermission(AppPermission.ai_readme_generation)),
):
    """
    Generate and return README as JSON with separate sections for preview.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.PROBLEM_SERVICE_URL}/submissions/stats/extended/{user.user_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch stats")
            
            response_json = response.json()
            stats_data = _extract_stats_data(response_json)
        
        readme_service = ReadmeGeneratorService()
        ai_content = await readme_service.get_ai_content_only(stats_data)
        
        return {
            "stats": stats_data,
            "aiContent": ai_content.model_dump(),
            "generatedAt": stats_data.get("generatedAt")
        }
        
    except Exception as e:
        logger.error(f"Failed to preview README: {e}")
        raise HTTPException(status_code=500, detail=str(e))