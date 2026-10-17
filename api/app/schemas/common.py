"""Standard API response schemas."""

from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard unified API response wrapper."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
