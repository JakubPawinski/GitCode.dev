from fastapi import APIRouter
from app.services.llm.providers.open_router import OpenRouterClient


router = APIRouter()

@router.get("/available")
async def get_available_models():
    """
    Endpoint to retrieve the list of available LLM models for the AI tutor.
    """
    llm_client = OpenRouterClient()
    models = llm_client.get_available_models()
    return {"available_models": [model.split("/")[1] for model in models]}