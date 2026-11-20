from fastapi import APIRouter, status

from app.deps import CurrentUser, DbSession
from app.models import Comment
from app.schemas.comment import CommentCreate, CommentOut
from app.services import comment_service

# both routers below get ticket id parameter from the URL
router = APIRouter(prefix="/api/tickets/{ticket_id}/comments", tags=["comments"])

# CurrentUser on both, since service based on rules decide who can comment on which ticket id
@router.get("", response_model=list[CommentOut]) # response is list of comments, each comment is serialized to CommentOut
def list_comments(ticket_id: int, db: DbSession, current_user: CurrentUser) -> list[Comment]:
    return comment_service.list_comments(db, ticket_id, current_user)

@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    ticket_id: int, data: CommentCreate, db: DbSession, current_user: CurrentUser
) -> Comment:
    return comment_service.create_comment(db, ticket_id, data, current_user)