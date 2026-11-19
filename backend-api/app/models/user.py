from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.ticket import Ticket


class User(Base):
    __tablename__ = "users"

    # column name: type (null None or not null) = database details
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, create_constraint=True), default=UserRole.user
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now() 
    )

    # relationships, one user can create many tickets, and one user can be assigned to many tickets
    created_tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="created_by", foreign_keys="Ticket.created_by_id"
    )
    assigned_tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="assigned_to", foreign_keys="Ticket.assigned_to_id"
    )
    comments: Mapped[list["Comment"]] = relationship(back_populates="author")