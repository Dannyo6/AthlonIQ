"""Health check schema models."""

from pydantic import BaseModel


class HealthStatus(BaseModel):
    """Health check response payload."""

    status: str
    environment: str
    version: str
    project: str
