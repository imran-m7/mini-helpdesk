from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

#  in dotnet: var builder = WebApplication.CreateBuilder(); var app = builder.Build();
app = FastAPI(title=settings.app_name) 

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