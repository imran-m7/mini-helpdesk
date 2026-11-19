from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models # registers all models with Base.metadata
from app.core.config import settings
from app.db import Base, engine

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

# endpoint to check if the API is running
@app.get("/api/health")
def health():
    return {"status": "ok"}