"""Health check router."""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import APIResponse
from app.schemas.health import HealthStatus

router = APIRouter(tags=["health"])


@router.get("/health", response_model=APIResponse[HealthStatus])
async def health_check() -> APIResponse[HealthStatus]:
    """Health check endpoint returning system status."""
    return APIResponse(
        success=True,
        message="AthlonIQ API is operational",
        data=HealthStatus(
            status="healthy",
            environment=settings.ENVIRONMENT,
            version=settings.VERSION,
            project=settings.PROJECT_NAME,
        ),
    )
