import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db import Base, get_db
from app.main import app
from app.models import User, UserRole

# separate in-memory database, only for tests
# it disappears when the tests end
test_engine = create_engine(
    "sqlite://", # in-memory SQLite database
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # one shared connection, so all code sees the same in-memory DB
)


# every time a connection is made to the SQLite database, enable foreign key support
@event.listens_for(test_engine, "connect")
def _enable_foreign_keys(dbapi_connection, _connection_record):
    dbapi_connection.execute("PRAGMA foreign_keys=ON")


# same settings like app, factory creates sessions, but bound to the test_engine
TestingSessionLocal = sessionmaker(
    bind=test_engine, autoflush=False, expire_on_commit=False
)


# pytest fixtures prepare something for tests
@pytest.fixture
def db():
    """A fresh, empty database for every test."""
    Base.metadata.create_all(bind=test_engine) # create empty tables
    session = TestingSessionLocal() # create a new session for the test
    yield session # this is where the test runs
    session.close() # close the session after the test
    Base.metadata.drop_all(bind=test_engine)  # drop all tables after the test, so the next test starts with a fresh database


@pytest.fixture
def client(db):
    """An HTTP client for the app that uses the test database instead of helpdesk.db."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db # override the get_db dependency to use the test database
    yield TestClient(app) # hand HTTP client to the test
    app.dependency_overrides.clear() # after tests remove override, so get_db is normal again


def create_user(db, email: str, password: str, role: UserRole = UserRole.user) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0],
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    return user


def login(client, email: str, password: str) -> dict:
    """Log in and return the Authorization header for later requests."""
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ready logged in headers
@pytest.fixture
def user_headers(client, db):
    create_user(db, "user@test.com", "User1234!")
    return login(client, "user@test.com", "User1234!")


@pytest.fixture
def agent_headers(client, db):
    create_user(db, "agent@test.com", "Agent123!", role=UserRole.agent)
    return login(client, "agent@test.com", "Agent123!")