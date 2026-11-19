from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # read values from a .env file
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "Mini Helpdesk API"
    database_url: str = "sqlite:///./helpdesk.db"
    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173"]  # vite dev server

# one shared instance, imported everywhere
settings = Settings()