"""AthlonIQ Intelligence Engine API Entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.schemas.common import APIResponse
from app.schemas.health import HealthStatus


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle management."""
    # Startup actions
    yield
    # Shutdown actions


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AthlonIQ — Personal AI Performance & Physique OS Intelligence Engine",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint
@app.get("/health", response_model=APIResponse[HealthStatus], tags=["system"])
async def root_health() -> APIResponse[HealthStatus]:
    """Root health check probe."""
    return APIResponse(
        success=True,
        message="AthlonIQ API is running",
        data=HealthStatus(
            status="healthy",
            environment=settings.ENVIRONMENT,
            version=settings.VERSION,
            project=settings.PROJECT_NAME,
        ),
    )


@app.get("/", tags=["system"])
async def root_info() -> dict:
    """Root information endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
    }


# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
