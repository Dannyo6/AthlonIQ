"""Central API v1 router aggregator."""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.coaching import router as coaching_router

api_v1_router = APIRouter()

# Include routers
api_v1_router.include_router(health_router)
api_v1_router.include_router(coaching_router)
