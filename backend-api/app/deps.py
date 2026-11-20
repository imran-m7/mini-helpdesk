from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db import get_db
from app.models import User, UserRole

# reads the "Authorization: Bearer <token>" header and adds the
# "authorize" button to Swagger. auto_error=False → we return our own 401.
bearer_scheme = HTTPBearer(auto_error=False)

# shortcut for a dependency that provides a database session to a route handler
DbSession = Annotated[Session, Depends(get_db)]

# answering the question: "who is the current user?" based on the Authorization header
def get_current_user(
    db: DbSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise UnauthorizedError("Invalid or expired token")

    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedError("User no longer exists")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

# answering the question: "is the current user an agent?" based on the Authorization header
# in dotnet like [Authorize(Roles = "Agent")]
def require_agent(current_user: CurrentUser) -> User:
    if current_user.role != UserRole.agent:
        raise ForbiddenError("Only agents can do this")
    return current_user

AgentUser = Annotated[User, Depends(require_agent)]