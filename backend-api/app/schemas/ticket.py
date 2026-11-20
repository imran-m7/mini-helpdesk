from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import TicketPriority, TicketStatus
from app.schemas.user import UserBrief

# no status-default open
# if priority  is not provided, default to medium
class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    priority: TicketPriority = TicketPriority.medium

class TicketUpdate(BaseModel):
    """All fields optional: the client sends only what it wants to change."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None

    @field_validator("title", "description", "status", "priority")
    @classmethod
    def not_null(cls, value):
        # fields may be left out, but not explicitly set to null
        if value is None:
            raise ValueError("Field cannot be null")
        return value

class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True) # convert attributes from SQLAlchemy model to Pydantic model (dictionary)

    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    created_by: UserBrief
    assigned_to: UserBrief | None
    created_at: datetime
    updated_at: datetime

class TicketFilters(BaseModel):
    """Query parameters for GET /api/tickets."""

    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assigned_to_id: int | None = None
    search: str | None = Field(default=None, max_length=200)
    page: int = Field(default=1, ge=1) # greater or equal to 1
    page_size: int = Field(default=10, ge=1, le=100) # min 1, max 100

# response model for paginated ticket results
class TicketPage(BaseModel):
    items: list[TicketOut]
    total: int
    page: int
    page_size: int
    pages: int