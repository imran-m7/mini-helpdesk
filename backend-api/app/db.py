from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# check if the database URL is for SQLite
is_sqlite = settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if is_sqlite else {}, # SQLite specific argument to allow multiple threads to access the database
)

# avoid orphan connections, SQLLite does not check foreign key constraints by default, so we need to enable it explicitly
if is_sqlite:
    @event.listens_for(engine, "connect") # for every db connection fired
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# session factory, use this engine to create sessions
# autoflush false because nothing is sent until we commit
# expire_on_commit false because we want to keep the data in memory after commit
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

# pass the base class to all models, so they can be registered with the ORM
class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal() # each request has its own database session
    try:
        yield db # only this request can use this session
    finally:
        db.close() # request done: close the session, its connection returns to the pool