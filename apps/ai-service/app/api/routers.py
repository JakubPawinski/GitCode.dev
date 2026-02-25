from fastapi import APIRouter
from app.api.endpoints import health
from app.api.endpoints import tutor
from app.api.endpoints import readme
from app.api.endpoints import models

router = APIRouter(tags=["AI"])

# Health check endpoint
router.include_router(health.router)
# Tutor endpoints
router.include_router(tutor.router, prefix="/tutor")

router.include_router(readme.router, prefix="/readme")

router.include_router(models.router, prefix="/models")