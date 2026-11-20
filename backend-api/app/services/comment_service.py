from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BadRequestError
from app.models import Comment, TicketStatus, User
from app.schemas.comment import CommentCreate
from app.services.ticket_service import get_ticket

def list_comments(db: Session, ticket_id: int, user: User) -> list[Comment]:
    # reuses the ticket rules: 404 if the user may not see this ticket
    get_ticket(db, ticket_id, user)

    return db.scalars(
        select(Comment)
        .where(Comment.ticket_id == ticket_id)
        .options(selectinload(Comment.author)) # all author names are loaded in one extra query, not one per comment
        .order_by(Comment.created_at, Comment.id) # oldest first, and if two comments have the same timestamp, the one with the lower id first
    ).all()

def create_comment(db: Session, ticket_id: int, data: CommentCreate, user: User) -> Comment:
    ticket = get_ticket(db, ticket_id, user)
    if ticket.status == TicketStatus.closed:
        raise BadRequestError("Cannot comment on a closed ticket")

    comment = Comment(body=data.body, ticket=ticket, author=user) # passing objects not only ids, so that the ORM can set the foreign key fields automatically
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment