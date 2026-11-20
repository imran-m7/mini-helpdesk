from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models # registers all models with Base.metadata
from app.core.config import settings
from app.core.exceptions import AppError
from app.db import Base, engine
from app.routers import auth, comments, tickets

@asynccontextmanager
async def lifespan(app: FastAPI):
    # runs once on startup: create tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    yield

#  in dotnet: var builder = WebApplication.CreateBuilder(); var app = builder.Build();
app = FastAPI(title=settings.app_name, lifespan=lifespan)

# allow React (another origin) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# when an AppError is raised, return a JSON response with the error details
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(
        status_code=exc.status_code, content={"detail": exc.detail}, headers=headers
    )

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(comments.router)

# endpoint to check if the API is running
@app.get("/api/health")
def health():
    return {"status": "ok"}