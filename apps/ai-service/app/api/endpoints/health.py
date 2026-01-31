from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """
    AI Service health check endpoint
    """
    return {
        "status": "ok",
        "service": "AI Service"
    }