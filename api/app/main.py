"""AthlonIQ Intelligence Engine API Entrypoint."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, settings
from app.api.v1.router import api_v1_router
from app.schemas.common import APIResponse
from app.schemas.health import HealthStatus

logger = logging.getLogger(__name__)


def validate_security_configuration(s: Optional[Settings] = None) -> None:
    """Validate security settings and log operational warnings."""
    cfg = s or settings
    if cfg.ENVIRONMENT == "production":
        if cfg.DEV_AUTH_BYPASS:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: DEV_AUTH_BYPASS cannot be enabled "
                "when ENVIRONMENT is 'production'!"
            )
        if cfg.DEBUG:
            logger.warning(
                "SECURITY WARNING: DEBUG is enabled in production environment! Disable DEBUG for production."
            )
        if "*" in cfg.BACKEND_CORS_ORIGINS:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: Wildcard '*' CORS origin is strictly forbidden "
                "when ENVIRONMENT is 'production'!"
            )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle management."""
    # Startup actions
    validate_security_configuration(settings)
    yield
    # Shutdown actions


def create_app(custom_settings: Optional[Settings] = None) -> FastAPI:
    """Create and configure FastAPI application instance."""
    cfg = custom_settings or settings
    validate_security_configuration(cfg)

    application = FastAPI(
        title=cfg.PROJECT_NAME,
        description="AthlonIQ — Personal AI Performance & Physique OS Intelligence Engine",
        version=cfg.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS strictly from settings.BACKEND_CORS_ORIGINS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Root health check endpoint
    @application.get("/health", response_model=APIResponse[HealthStatus], tags=["system"])
    async def root_health() -> APIResponse[HealthStatus]:
        """Root health check probe."""
        return APIResponse(
            success=True,
            message="AthlonIQ API is running",
            data=HealthStatus(
                status="healthy",
                environment=cfg.ENVIRONMENT,
                version=cfg.VERSION,
                project=cfg.PROJECT_NAME,
            ),
        )

    @application.get("/", tags=["system"])
    async def root_info() -> dict:
        """Root information endpoint."""
        return {
            "project": cfg.PROJECT_NAME,
            "version": cfg.VERSION,
            "status": "online",
            "docs": "/docs",
            "api_v1": cfg.API_V1_PREFIX,
        }

    # Include API v1 routes
    application.include_router(api_v1_router, prefix=cfg.API_V1_PREFIX)

    return application


app = create_app()
