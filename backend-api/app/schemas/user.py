from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import UserRole

# inherits from Pydantic BaseModel, which provides data validation
class UserCreate(BaseModel):
    """Data the client sends to register."""

    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8)

    # for rules that field validators can't handle, we can use a class method validator
    # catch 422 error early, rather than 500 error from bcrypt when it tries to hash a password that's too long
    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        # bcrypt only accepts passwords up to 72 bytes
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long (max 72 bytes)")
        return value


class UserOut(BaseModel):
    """Data the API returns about a user. Never includes the password hash."""

    # use only attributes from the SQLAlchemy model that we want to expose to the client
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    created_at: datetime