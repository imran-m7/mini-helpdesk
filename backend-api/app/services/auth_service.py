from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower())) # SQLAlchemy query

# session is passed, schema is passed, returns a User object
def register_user(db: Session, data: UserCreate) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError("Email is already registered")

    user = User(
        email=data.email.lower(),
        full_name=data.full_name.strip(), # no space before or after the name
        hashed_password=hash_password(data.password),
        # role is not taken from the request: everyone registers as "user"
    )
    db.add(user) # add him to the session, but not yet committed to the database
    db.commit() # commit the session to save the user to the database
    db.refresh(user) # reload from the database: gets id and created_at
    return user

def login(db: Session, data: LoginRequest) -> Token:
    user = get_user_by_email(db, data.email) # load user from the database by email
    if user is None or not verify_password(data.password, user.hashed_password):
        # same message for both cases, so we don't reveal which emails exist
        raise UnauthorizedError("Invalid email or password")

    token = create_access_token(user_id=user.id, role=user.role.value)
    return Token(access_token=token)