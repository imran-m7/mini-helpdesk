from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserBrief

# ticket comes from URL id, and author from token, so only body is required in the request body
class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def not_blank(cls, value: str) -> str:
        # two jobs: do not allow empty comments, and strip whitespace from the beginning and end of the comment
        value = value.strip()
        if not value:
            raise ValueError("Comment cannot be empty")
        return value

class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    body: str
    author: UserBrief # used from schemas.user.UserBrief
    created_at: datetime