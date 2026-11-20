"""
Create demo accounts (agents + one regular user).
Run from the backend-api folder:  python -m app.seed
"""

from app import models  # (registers all models with Base)
from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import User, UserRole
from app.services.auth_service import get_user_by_email

DEMO_USERS = [
    {
        "email": "agent1@example.com",
        "full_name": "Agent One",
        "password": "Agent123!",
        "role": UserRole.agent,
    },
    {
        "email": "agent2@example.com",
        "full_name": "Agent Two",
        "password": "Agent123!",
        "role": UserRole.agent,
    },
    {
        "email": "user@example.com",
        "full_name": "Demo User",
        "password": "User1234!",
        "role": UserRole.user,
    },
]


def seed() -> None:
    # make sure the tables exist, even if the server was never started
    Base.metadata.create_all(bind=engine)

    # open a database session and add demo users if they don't already exist
    with SessionLocal() as db:
        for data in DEMO_USERS:
            if get_user_by_email(db, data["email"]) is not None:
                print(f"skip    {data['email']} (already exists)")
                continue

            db.add(
                User(
                    email=data["email"],
                    full_name=data["full_name"],
                    hashed_password=hash_password(data["password"]),
                    role=data["role"],
                )
            )
            print(f"create  {data['email']} ({data['role'].value})")

        db.commit()


if __name__ == "__main__":
    seed()