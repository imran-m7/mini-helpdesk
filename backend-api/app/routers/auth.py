from fastapi import APIRouter, status

from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserOut
from app.services import auth_service

# every route in this router starts with this, tags is used for swagger grouping
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post(
    "/register", response_model=UserOut, status_code=status.HTTP_201_CREATED
)
def register(data: UserCreate, db: DbSession) -> User:
    return auth_service.register_user(db, data)

@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: DbSession) -> Token:
    return auth_service.login(db, data)

# check first if i am that user, then return the user object. if not, raise 401
@router.get("/me", response_model=UserOut)
def read_me(current_user: CurrentUser) -> User:
    return current_user