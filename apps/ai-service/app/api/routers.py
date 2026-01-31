from fastapi import APIRouter
from app.api.endpoints import health
from app.api.endpoints import tutor

router = APIRouter(tags=["AI"])

# Health check endpoint
router.include_router(health.router)
# Tutor endpoints
router.include_router(tutor.router, prefix="/tutor")