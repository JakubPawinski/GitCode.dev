from fastapi import APIRouter
from app.api.endpoints import health

router = APIRouter()

# Health check enpoint
router.include_router(health.router, tags=["Health"])