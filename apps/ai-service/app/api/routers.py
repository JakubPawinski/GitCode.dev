from fastapi import APIRouter
from app.api.endpoints import health
from app.api.endpoints import tutor

router = APIRouter()

# Health check enpoint
router.include_router(health.router, tags=["Health"])
# Tutor endpoints
router.include_router(tutor.router, prefix="/tutor", tags=["Tutor"])