from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "FoodStore API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/foodstore"

    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN: int = 604800  # 7 days

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174"]

    UPLOAD_DIR: str = "app/uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
